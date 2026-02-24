/**
 * WebSocket Context Provider for real-time messaging.
 *
 * Provides WebSocket connection state and methods to the component tree.
 * Manages global unread count and active conversations.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { websocketService, ConnectionState } from "../services/websocket";
import { API_URL } from "../constants/constants";

const WebSocketContext = createContext(null);

/**
 * Hook to access WebSocket context.
 *
 * @returns {Object} WebSocket context value
 */
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider",
    );
  }
  return context;
}

/**
 * WebSocket Provider component.
 *
 * Provides global WebSocket state management for the app.
 */
export function WebSocketProvider({ children }) {
  const [connectionState, setConnectionState] = useState(
    ConnectionState.DISCONNECTED,
  );
  const [activeRoom, setActiveRoom] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/messages/unread-count/`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  // Connect to a chat room
  const connectToRoom = useCallback(
    async (roomName) => {
      if (activeRoom === roomName) return;

      try {
        await websocketService.connect(roomName);
        setActiveRoom(roomName);
      } catch (error) {
        console.error("Failed to connect to room:", error);
        throw error;
      }
    },
    [activeRoom],
  );

  // Disconnect from current room
  const disconnectFromRoom = useCallback(() => {
    websocketService.disconnect();
    setActiveRoom(null);
  }, []);

  // Update unread count (called when receiving new message)
  const incrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  // Decrease unread count (called when marking messages as read)
  const decrementUnreadCount = useCallback((count = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count));
  }, []);

  // Reset unread count for a conversation (just decrements locally, API call is handled separately)
  const markConversationRead = useCallback((conversationId, count = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count));
  }, []);

  // Handle state changes from WebSocket service
  useEffect(() => {
    const unsubState = websocketService.on("state", (data) => {
      setConnectionState(data.state);
    });

    const unsubUserJoined = websocketService.on("userJoined", (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.username]));
    });

    const unsubUserLeft = websocketService.on("userLeft", (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
    });

    // Set initial state
    setConnectionState(websocketService.getState());

    return () => {
      unsubState();
      unsubUserJoined();
      unsubUserLeft();
    };
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const value = {
    // Connection state
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    isReconnecting: connectionState === ConnectionState.RECONNECTING,
    activeRoom,

    // Unread messages
    unreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    markConversationRead,
    fetchUnreadCount,

    // Online presence
    onlineUsers: Array.from(onlineUsers),
    isUserOnline: (username) => onlineUsers.has(username),

    // Connection methods
    connectToRoom,
    disconnectFromRoom,

    // Direct access to service for advanced use
    websocketService,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketContext;
