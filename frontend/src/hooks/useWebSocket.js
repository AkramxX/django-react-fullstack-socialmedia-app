/**
 * Custom hook for WebSocket connection management.
 *
 * Provides a simple interface to connect to chat rooms and handle messages.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { websocketService, ConnectionState } from "../services/websocket";

/**
 * Hook for managing WebSocket connection to a chat room.
 *
 * @param {string} roomName - The room name to connect to (optional)
 * @returns {Object} WebSocket state and methods
 */
export function useWebSocket(roomName = null) {
  const [connectionState, setConnectionState] = useState(
    ConnectionState.DISCONNECTED,
  );
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState(null);

  const typingTimeoutRef = useRef(new Map());
  const currentRoomRef = useRef(null);

  // Handle incoming messages
  const handleMessage = useCallback((data) => {
    setMessages((prev) => [
      ...prev,
      {
        id: data.message_id || Date.now().toString(),
        content: data.content,
        sender: data.sender,
        timestamp: data.timestamp,
        isOwn: false, // Will be set correctly by the component
      },
    ]);
  }, []);

  // Handle typing indicators
  const handleTyping = useCallback((data) => {
    const { username, is_typing } = data;

    if (is_typing) {
      setTypingUsers((prev) => {
        if (!prev.includes(username)) {
          return [...prev, username];
        }
        return prev;
      });

      // Clear existing timeout for this user
      if (typingTimeoutRef.current.has(username)) {
        clearTimeout(typingTimeoutRef.current.get(username));
      }

      // Set timeout to remove typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== username));
        typingTimeoutRef.current.delete(username);
      }, 3000);

      typingTimeoutRef.current.set(username, timeout);
    } else {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
      if (typingTimeoutRef.current.has(username)) {
        clearTimeout(typingTimeoutRef.current.get(username));
        typingTimeoutRef.current.delete(username);
      }
    }
  }, []);

  // Handle connection state changes
  const handleStateChange = useCallback((data) => {
    setConnectionState(data.state);
  }, []);

  // Handle errors
  const handleError = useCallback((data) => {
    setError(data.message);
  }, []);

  // Connect to room
  const connect = useCallback(async (room) => {
    if (!room) return;

    setError(null);
    setMessages([]);
    setTypingUsers([]);
    currentRoomRef.current = room;

    try {
      await websocketService.connect(room);
    } catch (err) {
      setError("Failed to connect to chat");
      console.error("WebSocket connection error:", err);
    }
  }, []);

  // Disconnect from room
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    currentRoomRef.current = null;
    setMessages([]);
    setTypingUsers([]);
  }, []);

  // Send a message
  const sendMessage = useCallback((content) => {
    if (!content.trim()) return;

    websocketService.sendMessage(content);

    // Optimistically add message to local state
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        content: content,
        sender: "me", // Will be replaced with actual username
        timestamp: new Date().toISOString(),
        isOwn: true,
        pending: true,
      },
    ]);
  }, []);

  // Send typing indicator
  const sendTypingStart = useCallback(() => {
    websocketService.sendTypingStart();
  }, []);

  const sendTypingStop = useCallback(() => {
    websocketService.sendTypingStop();
  }, []);

  // Send read receipt
  const sendReadReceipt = useCallback((messageIds) => {
    websocketService.sendReadReceipt(messageIds);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set up event listeners
  useEffect(() => {
    const unsubMessage = websocketService.on("message", handleMessage);
    const unsubTyping = websocketService.on("typing", handleTyping);
    const unsubState = websocketService.on("state", handleStateChange);
    const unsubError = websocketService.on("error", handleError);

    // Set initial state
    setConnectionState(websocketService.getState());

    return () => {
      unsubMessage();
      unsubTyping();
      unsubState();
      unsubError();
    };
  }, [handleMessage, handleTyping, handleStateChange, handleError]);

  // Auto-connect when roomName changes
  useEffect(() => {
    if (roomName && roomName !== currentRoomRef.current) {
      connect(roomName);
    }

    return () => {
      // Clear typing timeouts on unmount
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [roomName, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRoomRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return {
    // State
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    isReconnecting: connectionState === ConnectionState.RECONNECTING,
    messages,
    typingUsers,
    error,

    // Methods
    connect,
    disconnect,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    sendReadReceipt,
    clearError,

    // Utilities
    setMessages, // Allow external updates (e.g., loading history)
  };
}

export default useWebSocket;
