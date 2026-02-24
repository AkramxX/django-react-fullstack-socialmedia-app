/**
 * ConversationList Component
 *
 * Displays all conversations with last message preview.
 * Sorted by most recent message.
 */

import { clsx } from "clsx";
import { Avatar, Spinner } from "../ui";

const ConversationList = ({
  conversations = [],
  activeConversationId = null,
  onSelectConversation,
  loading = false,
  currentUsername = "",
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-secondary-900 mb-1">
          No messages yet
        </h3>
        <p className="text-sm text-secondary-500 text-center">
          Start a conversation by visiting someone's profile
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-secondary-200">
        <h2 className="text-lg font-semibold text-secondary-900">Messages</h2>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onClick={() => onSelectConversation(conversation)}
            currentUsername={currentUsername}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual conversation item
 */
const ConversationItem = ({
  conversation,
  isActive,
  onClick,
  currentUsername,
}) => {
  // Get the other participant
  const otherUser =
    conversation.participants?.find((p) => p.username !== currentUsername) ||
    conversation.other_user;

  const lastMessage = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const truncateMessage = (text, maxLength = 40) => {
    if (!text) return "No messages yet";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
        "hover:bg-secondary-50 focus:outline-none focus:bg-secondary-50",
        isActive && "bg-primary-50 hover:bg-primary-50",
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={otherUser?.profile_image}
          name={otherUser?.username || "User"}
          size="lg"
        />
        {/* Online indicator could go here */}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={clsx(
              "font-medium truncate",
              unreadCount > 0 ? "text-secondary-900" : "text-secondary-700",
            )}
          >
            {otherUser?.username || "Unknown User"}
          </span>
          <span className="text-xs text-secondary-500 flex-shrink-0 ml-2">
            {formatTime(lastMessage?.created_at || conversation.updated_at)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p
            className={clsx(
              "text-sm truncate",
              unreadCount > 0
                ? "text-secondary-900 font-medium"
                : "text-secondary-500",
            )}
          >
            {lastMessage?.sender?.username === currentUsername && "You: "}
            {truncateMessage(lastMessage?.content)}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-medium text-white bg-primary-500 rounded-full min-w-[20px] text-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationList;
