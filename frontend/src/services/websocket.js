/**
 * WebSocket Service for real-time messaging.
 *
 * Provides a singleton WebSocket connection manager with:
 * - Automatic reconnection with exponential backoff
 * - Message queuing when disconnected
 * - Event-based message handling
 */

import { WS_URL } from "../constants/constants";

// Connection states
export const ConnectionState = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  RECONNECTING: "reconnecting",
  ERROR: "error",
};

// Message types from server
export const MessageType = {
  CHAT_MESSAGE: "chat_message",
  TYPING: "typing",
  READ_RECEIPT: "read_receipt",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  ERROR: "error",
};

class WebSocketService {
  constructor() {
    this.socket = null;
    this.roomName = null;
    this.state = ConnectionState.DISCONNECTED;
    this.listeners = new Map();
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimeout = null;
    this.maxQueueSize = 100;
  }

  /**
   * Connect to a chat room.
   *
   * @param {string} roomName - The room name (format: username1_username2)
   * @returns {Promise<void>}
   */
  connect(roomName) {
    return new Promise((resolve, reject) => {
      // Close existing connection if any
      if (this.socket) {
        this.disconnect();
      }

      this.roomName = roomName;
      this.state = ConnectionState.CONNECTING;
      this._notifyStateChange();

      const wsUrl = `${WS_URL}/ws/chat/${roomName}/`;

      try {
        this.socket = new WebSocket(wsUrl);
      } catch (error) {
        this.state = ConnectionState.ERROR;
        this._notifyStateChange();
        reject(error);
        return;
      }

      this.socket.onopen = () => {
        this.state = ConnectionState.CONNECTED;
        this.reconnectAttempts = 0;
        this._notifyStateChange();
        this._flushMessageQueue();
        resolve();
      };

      this.socket.onclose = (event) => {
        const wasConnected = this.state === ConnectionState.CONNECTED;

        // Handle different close codes
        if (event.code === 4001) {
          // Authentication failure
          this.state = ConnectionState.ERROR;
          this._notifyError("Authentication failed. Please log in again.");
        } else if (event.code === 4003) {
          // Permission denied
          this.state = ConnectionState.ERROR;
          this._notifyError(
            "Permission denied. You can only message mutual followers.",
          );
        } else if (wasConnected) {
          // Unexpected disconnect, try to reconnect
          this._scheduleReconnect();
        } else {
          this.state = ConnectionState.DISCONNECTED;
        }

        this._notifyStateChange();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.state = ConnectionState.ERROR;
        this._notifyStateChange();
        reject(error);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };
    });
  }

  /**
   * Disconnect from the current room.
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.roomName = null;
    this.state = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
    this._notifyStateChange();
  }

  /**
   * Send a chat message.
   *
   * @param {string} content - The message content
   */
  sendMessage(content) {
    this._send({
      type: "chat_message",
      content: content,
    });
  }

  /**
   * Send typing started indicator.
   */
  sendTypingStart() {
    this._send({ type: "typing_start" });
  }

  /**
   * Send typing stopped indicator.
   */
  sendTypingStop() {
    this._send({ type: "typing_stop" });
  }

  /**
   * Send read receipt for messages.
   *
   * @param {string[]} messageIds - Array of message IDs that were read
   */
  sendReadReceipt(messageIds) {
    this._send({
      type: "mark_read",
      message_ids: messageIds,
    });
  }

  /**
   * Subscribe to events.
   *
   * @param {string} event - Event type ('message', 'typing', 'read', 'state', 'error')
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Get current connection state.
   *
   * @returns {string} Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get current room name.
   *
   * @returns {string|null} Current room name
   */
  getRoomName() {
    return this.roomName;
  }

  // ==================== Private Methods ====================

  _send(data) {
    if (this.state === ConnectionState.CONNECTED && this.socket) {
      this.socket.send(JSON.stringify(data));
    } else {
      // Queue message for later
      this._queueMessage(data);
    }
  }

  _queueMessage(data) {
    // Don't queue typing indicators
    if (data.type === "typing_start" || data.type === "typing_stop") {
      return;
    }

    this.messageQueue.push(data);

    // Enforce max queue size (drop oldest)
    if (this.messageQueue.length > this.maxQueueSize) {
      this.messageQueue.shift();
    }
  }

  _flushMessageQueue() {
    while (
      this.messageQueue.length > 0 &&
      this.state === ConnectionState.CONNECTED
    ) {
      const data = this.messageQueue.shift();
      this.socket.send(JSON.stringify(data));
    }
  }

  _handleMessage(data) {
    const type = data.type;

    switch (type) {
      case MessageType.CHAT_MESSAGE:
        this._notify("message", data);
        break;
      case MessageType.TYPING:
        this._notify("typing", data);
        break;
      case MessageType.READ_RECEIPT:
        this._notify("read", data);
        break;
      case MessageType.USER_JOINED:
        this._notify("userJoined", data);
        break;
      case MessageType.USER_LEFT:
        this._notify("userLeft", data);
        break;
      case MessageType.ERROR:
        this._notifyError(data.message);
        break;
      default:
        console.warn("Unknown message type:", type);
    }
  }

  _notify(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  _notifyStateChange() {
    this._notify("state", { state: this.state });
  }

  _notifyError(message) {
    this._notify("error", { message });
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.state = ConnectionState.ERROR;
      this._notifyError("Max reconnection attempts reached");
      return;
    }

    this.state = ConnectionState.RECONNECTING;
    this._notifyStateChange();

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      if (this.roomName) {
        this.connect(this.roomName).catch(() => {
          // Will trigger onclose which schedules another reconnect
        });
      }
    }, delay);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Also export the class for testing
export default WebSocketService;
