/**
 * Messages Page - Main messaging interface.
 *
 * Layout with sidebar for conversation list and main area for active chat.
 * Responsive design: sidebar hidden on mobile when chat is active.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { ConversationList, ChatWindow } from "../components/messaging";
import { Spinner } from "../components/ui";
import { useWebSocket } from "../hooks/useWebSocket";
import { useWebSocketContext } from "../contexts/WebSocketContext";
import {
  get_conversations,
  get_messages,
  send_message,
  mark_messages_read,
} from "../api/endpoints";

const Messages = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [error, setError] = useState(null);

  // Get current user
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentUsername = userData.username || "";

  // WebSocket for real-time
  const { markConversationRead } = useWebSocketContext();
  const {
    isConnected,
    isReconnecting,
    messages: wsMessages,
    typingUsers,
    sendMessage: wsSendMessage,
    sendTypingStart,
    sendTypingStop,
    connect: wsConnect,
    disconnect: wsDisconnect,
    setMessages: setWsMessages,
  } = useWebSocket();

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const data = await get_conversations();
      setConversations(data.results || data || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (convId, before = null) => {
    try {
      if (before) {
        setLoadingMore(true);
      } else {
        setLoadingMessages(true);
        setMessages([]);
      }

      const data = await get_messages(convId, before);
      // Backend returns { messages: [...], has_more: boolean }
      const newMessages = data.messages || data.results || data || [];

      if (before) {
        // Prepend older messages (already in chronological order from backend)
        setMessages((prev) => [...newMessages, ...prev]);
      } else {
        // Backend already returns in chronological order
        setMessages(newMessages);
      }

      setHasMoreMessages(!!data.has_more || !!data.next);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  }, []);

  // Mark messages as read
  const handleMarkRead = useCallback(
    async (convId) => {
      try {
        await mark_messages_read(convId);
        markConversationRead(convId);

        // Update local conversation unread count
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c)),
        );
      } catch (err) {
        console.error("Failed to mark messages as read:", err);
      }
    },
    [markConversationRead],
  );

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    (conversation) => {
      navigate(`/messages/${conversation.id}`);
    },
    [navigate],
  );

  // Handle back to list (mobile)
  const handleBack = useCallback(() => {
    navigate("/messages");
  }, [navigate]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (content) => {
      if (!activeConversation || !content.trim()) return;

      const otherUser =
        activeConversation.participants?.find(
          (p) => p.username !== currentUsername,
        ) || activeConversation.other_user;

      // Optimistically add message
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        content: content.trim(),
        sender: { username: currentUsername },
        created_at: new Date().toISOString(),
        is_read: false,
        pending: true,
        isOwn: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Send via WebSocket if connected
        if (isConnected) {
          wsSendMessage(content.trim());
        }

        // Also send via API for persistence
        const result = await send_message(otherUser?.username, content.trim());

        // API returns { message: {...}, conversation_id, room_name }
        const savedMessage = result.message || result;

        // Update the optimistic message with real data
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...savedMessage,
                  isOwn: true,
                  is_own_message: true,
                  pending: false,
                }
              : m,
          ),
        );

        // Update conversation's last message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? {
                  ...c,
                  last_message: savedMessage,
                  updated_at: savedMessage.created_at,
                }
              : c,
          ),
        );
      } catch (err) {
        console.error("Failed to send message:", err);
        // Mark message as failed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, pending: false, failed: true } : m,
          ),
        );
      }
    },
    [activeConversation, currentUsername, isConnected, wsSendMessage],
  );

  // Handle load more messages
  const handleLoadMore = useCallback(() => {
    if (!activeConversation || loadingMore || !hasMoreMessages) return;

    const oldestMessage = messages[0];
    if (oldestMessage) {
      fetchMessages(activeConversation.id, oldestMessage.id);
    }
  }, [
    activeConversation,
    loadingMore,
    hasMoreMessages,
    messages,
    fetchMessages,
  ]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle conversation change from URL
  useEffect(() => {
    // Skip if no conversationId or conversations not loaded yet
    if (!conversationId || conversations.length === 0) {
      if (!conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
      return;
    }

    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    // Only update if this is a different conversation
    if (activeConversation?.id === conversationId) return;

    setActiveConversation(conversation);

    // Fetch messages for this conversation
    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        setMessages([]);
        const data = await get_messages(conversationId);
        // Backend returns { messages: [...], has_more: boolean }
        const newMessages = data.messages || data.results || data || [];
        // Backend already returns in chronological order
        setMessages(newMessages);
        setHasMoreMessages(!!data.has_more || !!data.next);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    // Mark as read (only once)
    const markRead = async () => {
      try {
        await mark_messages_read(conversationId);
        // Update local conversation unread count
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c,
          ),
        );
      } catch (err) {
        console.error("Failed to mark messages as read:", err);
      }
    };

    loadMessages();
    markRead();

    // Connect WebSocket for real-time
    const otherUser =
      conversation.participants?.find((p) => p.username !== currentUsername) ||
      conversation.other_user;
    if (otherUser) {
      const roomName = [currentUsername, otherUser.username].sort().join("_");
      wsConnect(roomName);
    }

    // Cleanup on unmount or conversation change
    return () => {
      wsDisconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversations.length]);

  // Merge WebSocket messages with local messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const lastWsMessage = wsMessages[wsMessages.length - 1];

      // Determine if this is our own message (sender can be object or string)
      const senderUsername =
        typeof lastWsMessage.sender === "object"
          ? lastWsMessage.sender?.username
          : lastWsMessage.sender;
      const isOwnMessage = senderUsername === currentUsername;

      // Check if message already exists (avoid duplicates)
      setMessages((prev) => {
        // Skip our own messages received via WebSocket - we already have them from the API
        if (isOwnMessage) return prev;

        const exists = prev.some(
          (m) =>
            m.id === lastWsMessage.id ||
            (m.content === lastWsMessage.content &&
              Math.abs(
                new Date(m.created_at || m.timestamp) -
                  new Date(lastWsMessage.timestamp),
              ) < 5000),
        );

        if (exists) return prev;

        return [
          ...prev,
          {
            ...lastWsMessage,
            created_at: lastWsMessage.timestamp,
            isOwn: false,
          },
        ];
      });

      // Clear WS messages after processing
      setWsMessages([]);
    }
  }, [wsMessages, currentUsername, setWsMessages]);

  // Mobile: show only chat when conversation is selected
  const showSidebar = !conversationId;
  const showChat = !!conversationId;

  return (
    <div className="h-[calc(100vh-4rem)] bg-secondary-50">
      <div className="h-full max-w-6xl mx-auto flex">
        {/* Sidebar - Conversation List */}
        <div
          className={clsx(
            "w-full md:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-secondary-200",
            "md:block",
            showSidebar ? "block" : "hidden",
          )}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={handleSelectConversation}
            loading={loadingConversations}
            currentUsername={currentUsername}
          />
        </div>

        {/* Main - Chat Window */}
        <div
          className={clsx(
            "flex-1 min-w-0",
            "md:block",
            showChat ? "block" : "hidden",
          )}
        >
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            loading={loadingMessages}
            loadingMore={loadingMore}
            hasMore={hasMoreMessages}
            onLoadMore={handleLoadMore}
            onSendMessage={handleSendMessage}
            onTypingStart={sendTypingStart}
            onTypingStop={sendTypingStop}
            typingUsers={typingUsers}
            currentUsername={currentUsername}
            isConnected={isConnected || !conversationId}
            onBack={handleBack}
          />
        </div>
      </div>

      {/* Reconnecting indicator */}
      {isReconnecting && conversationId && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-warning-100 text-warning-800 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Spinner size="sm" />
          <span className="text-sm">Reconnecting...</span>
        </div>
      )}
    </div>
  );
};

export default Messages;
