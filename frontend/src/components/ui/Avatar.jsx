import { clsx } from "clsx";
import { useState } from "react";
import { SERVER_URL } from "../../constants/constants";

/**
 * Avatar Component
 *
 * @param {Object} props
 * @param {string} props.src - Image source URL (can be relative path or full URL)
 * @param {string} props.alt - Alt text
 * @param {string} props.name - Name for fallback initials
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} props.size - Avatar size
 * @param {boolean} props.border - Show border
 * @param {string} props.className - Additional CSS classes
 */
const Avatar = ({
  src,
  alt = "",
  name = "",
  size = "md",
  border = false,
  className = "",
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-xl",
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Normalize image URL - handle both full URLs and relative paths
  const getImageUrl = (url) => {
    if (!url) return null;
    // If already a full URL, return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Otherwise, prepend server URL
    return `${SERVER_URL}${url}`;
  };

  const imageUrl = getImageUrl(src);
  const showFallback = !imageUrl || imageError;

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center rounded-full bg-secondary-200 overflow-hidden flex-shrink-0",
        sizes[size],
        border && "ring-2 ring-white",
        className,
      )}
      {...props}
    >
      {showFallback ? (
        <span className="font-medium text-secondary-600">
          {getInitials(name)}
        </span>
      ) : (
        <img
          src={imageUrl}
          alt={alt || name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default Avatar;
