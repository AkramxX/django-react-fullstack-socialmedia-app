import { clsx } from "clsx";

/**
 * Spinner Component
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} props.size - Spinner size
 * @param {'primary' | 'white' | 'secondary'} props.color - Spinner color
 * @param {string} props.className - Additional CSS classes
 */
const Spinner = ({
  size = "md",
  color = "primary",
  className = "",
  ...props
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  const colors = {
    primary: "text-primary-600",
    white: "text-white",
    secondary: "text-secondary-500",
  };

  return (
    <svg
      className={clsx("animate-spin", sizes[size], colors[color], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * LoadingOverlay Component
 * Full-page or section loading overlay
 *
 * @param {Object} props
 * @param {boolean} props.fullScreen - Cover entire screen
 * @param {string} props.message - Loading message
 * @param {string} props.className - Additional CSS classes
 */
export const LoadingOverlay = ({
  fullScreen = false,
  message = "Loading...",
  className = "",
  ...props
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm",
        fullScreen ? "fixed inset-0 z-50" : "absolute inset-0",
        className,
      )}
      {...props}
    >
      <Spinner size="lg" />
      {message && <p className="mt-3 text-sm text-secondary-600">{message}</p>}
    </div>
  );
};

export default Spinner;
