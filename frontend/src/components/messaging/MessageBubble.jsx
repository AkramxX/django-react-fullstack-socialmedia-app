/**
 * MessageBubble Component
 *
 * Displays a single message with different styling for sent vs received.
 * Shows timestamp on hover and read status for sent messages.
 */

import { useState } from "react";
import { clsx } from "clsx";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";

const MessageBubble = ({
  content,
  timestamp,
  isOwn = false,
  isRead = false,
  isPending = false,
  showAvatar = false,
  avatar = null,
  senderName = "",
}) => {
  const [showTime, setShowTime] = useState(false);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffDays === 0) {
      return timeStr;
    } else if (diffDays === 1) {
      return `Yesterday ${timeStr}`;
    } else if (diffDays < 7) {
      return `${date.toLocaleDateString([], { weekday: "short" })} ${timeStr}`;
    } else {
      return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${timeStr}`;
    }
  };

  return (
    <div
      className={clsx(
        "flex w-full mb-1 group",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={clsx(
          "flex items-end gap-2 max-w-[75%] sm:max-w-[65%]",
          isOwn && "flex-row-reverse",
        )}
      >
        {/* Avatar placeholder for alignment */}
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 flex-shrink-0">
            {avatar && (
              <img
                src={avatar}
                alt={senderName}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
          </div>
        )}

        {/* Message content */}
        <div
          className={clsx(
            "relative px-4 py-2 rounded-2xl cursor-pointer transition-all",
            isOwn
              ? "bg-primary-500 text-white rounded-br-md"
              : "bg-secondary-100 text-secondary-900 rounded-bl-md",
            isPending && "opacity-70",
          )}
          onClick={() => setShowTime(!showTime)}
          onMouseEnter={() => setShowTime(true)}
          onMouseLeave={() => setShowTime(false)}
        >
          {/* Message text */}
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>

          {/* Read status for own messages */}
          {isOwn && (
            <div className="flex items-center justify-end gap-1 mt-1">
              {isPending ? (
                <span className="text-xs text-primary-200">Sending...</span>
              ) : (
                <span className={clsx("text-primary-200")}>
                  {isRead ? (
                    <IoCheckmarkDone size={14} />
                  ) : (
                    <IoCheckmark size={14} />
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timestamp tooltip */}
      <div
        className={clsx(
          "absolute mt-1 px-2 py-1 text-xs text-secondary-500 bg-white rounded shadow-sm border border-secondary-100 transition-opacity z-10",
          showTime ? "opacity-100" : "opacity-0 pointer-events-none",
          isOwn ? "right-0" : "left-0",
        )}
        style={{ display: "none" }} // Hidden by default, shown on hover via parent
      >
        {formatTime(timestamp)}
      </div>
    </div>
  );
};

/**
 * Date separator component for grouping messages by date
 */
export const DateSeparator = ({ date }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "long" });
    } else {
      return date.toLocaleDateString([], {
        month: "long",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 text-xs font-medium text-secondary-500 bg-secondary-100 rounded-full">
        {formatDate(date)}
      </div>
    </div>
  );
};

export default MessageBubble;
