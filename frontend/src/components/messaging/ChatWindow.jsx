/**
 * ChatWindow Component
 *
 * Displays the active conversation with messages, header, and input.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { IoArrowBack, IoEllipsisVertical } from "react-icons/io5";
import { Avatar, Spinner, IconButton } from "../ui";
import MessageBubble, { DateSeparator } from "./MessageBubble";
import MessageInput from "./MessageInput";

const ChatWindow = ({
  conversation,
  messages = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  typingUsers = [],
  currentUsername = "",
  isConnected = true,
  onBack,
}) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Get other user from conversation
  const otherUser =
    conversation?.participants?.find((p) => p.username !== currentUsername) ||
    conversation?.other_user;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);

    // Load more when scrolled to top
    if (scrollTop === 0 && hasMore && !loadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  // Empty state
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-secondary-50">
        <div className="w-20 h-20 mb-4 rounded-full bg-secondary-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-secondary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-secondary-900 mb-2">
          Select a conversation
        </h3>
        <p className="text-sm text-secondary-500">
          Choose from your existing conversations or start a new one
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-secondary-200 bg-white">
        {/* Back button (mobile) */}
        {onBack && (
          <IconButton
            variant="ghost"
            size="sm"
            ariaLabel="Back to conversations"
            onClick={onBack}
            className="md:hidden -ml-2"
          >
            <IoArrowBack size={20} />
          </IconButton>
        )}

        {/* User info */}
        <button
          onClick={() => navigate(`/${otherUser?.username}`)}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
        >
          <Avatar
            src={otherUser?.profile_image}
            name={otherUser?.username || "User"}
            size="md"
          />
          <div className="text-left">
            <h3 className="font-semibold text-secondary-900">
              {otherUser?.username || "Unknown User"}
            </h3>
            {typingUsers.length > 0 ? (
              <p className="text-xs text-primary-500">typing...</p>
            ) : (
              <p className="text-xs text-secondary-500">
                {isConnected ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </button>

        {/* Actions */}
        <IconButton variant="ghost" size="sm" ariaLabel="More options">
          <IoEllipsisVertical size={20} />
        </IconButton>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}

        {/* Initial loading */}
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-secondary-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-secondary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <p className="text-secondary-600 mb-1">No messages yet</p>
            <p className="text-sm text-secondary-500">
              Say hello to {otherUser?.username}!
            </p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <DateSeparator date={date} />
                {dateMessages.map((message, index) => (
                  <MessageBubble
                    key={message.id || index}
                    content={message.content}
                    timestamp={message.created_at || message.timestamp}
                    isOwn={
                      message.is_own_message ||
                      message.sender_username === currentUsername ||
                      message.sender?.username === currentUsername ||
                      message.isOwn
                    }
                    isRead={message.is_read}
                    isPending={message.pending}
                  />
                ))}
              </div>
            ))}
          </>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 py-2">
            <div className="flex items-center gap-1 px-4 py-2 bg-secondary-100 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <MessageInput
        onSend={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        disabled={!isConnected}
        placeholder={`Message ${otherUser?.username || ""}...`}
      />
    </div>
  );
};

/**
 * Group messages by date for date separators
 */
function groupMessagesByDate(messages) {
  const groups = {};

  messages.forEach((message) => {
    const date = new Date(
      message.created_at || message.timestamp,
    ).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });

  return groups;
}

export default ChatWindow;
