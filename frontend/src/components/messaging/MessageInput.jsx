/**
 * MessageInput Component
 *
 * Text input with send button for composing messages.
 * Supports Enter to send, Shift+Enter for newline.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { IoSend } from "react-icons/io5";
import { IconButton } from "../ui";

const MAX_LENGTH = 2000;
const TYPING_DEBOUNCE = 1000;

const MessageInput = ({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const charCount = message.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const canSend = message.trim().length > 0 && !isOverLimit && !disabled;

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [message, resizeTextarea]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping && onTypingStart) {
      setIsTyping(true);
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && onTypingStop) {
        setIsTyping(false);
        onTypingStop();
      }
    }, TYPING_DEBOUNCE);
  }, [isTyping, onTypingStart, onTypingStop]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && onTypingStop) {
        onTypingStop();
      }
    };
  }, [isTyping, onTypingStop]);

  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTypingStart();
  };

  const handleSend = () => {
    if (!canSend) return;

    onSend(message.trim());
    setMessage("");

    // Stop typing indicator
    if (isTyping && onTypingStop) {
      setIsTyping(false);
      onTypingStop();
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Focus back to textarea
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-secondary-200 bg-white p-3 sm:p-4">
      <div className="flex items-end gap-2 sm:gap-3">
        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={clsx(
              "w-full px-4 py-2.5 text-sm sm:text-base text-secondary-900 bg-secondary-50 border rounded-2xl resize-none",
              "placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-offset-0",
              "transition-all duration-200",
              isOverLimit
                ? "border-error-500 focus:border-error-500 focus:ring-error-500/20"
                : "border-secondary-200 focus:border-primary-500 focus:ring-primary-500/20",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            style={{ maxHeight: "150px" }}
          />

          {/* Character count */}
          {charCount > MAX_LENGTH * 0.8 && (
            <div
              className={clsx(
                "absolute right-3 bottom-2 text-xs",
                isOverLimit ? "text-error-500" : "text-secondary-400",
              )}
            >
              {charCount}/{MAX_LENGTH}
            </div>
          )}
        </div>

        {/* Send button */}
        <IconButton
          variant={canSend ? "primary" : "ghost"}
          size="md"
          ariaLabel="Send message"
          onClick={handleSend}
          disabled={!canSend}
          className={clsx(
            "flex-shrink-0 transition-all duration-200",
            canSend
              ? "bg-primary-500 text-white hover:bg-primary-600"
              : "text-secondary-400 cursor-not-allowed",
          )}
        >
          <IoSend size={20} />
        </IconButton>
      </div>

      {/* Disabled message */}
      {disabled && (
        <p className="mt-2 text-xs text-secondary-500 text-center">
          Connection lost. Reconnecting...
        </p>
      )}
    </div>
  );
};

export default MessageInput;
