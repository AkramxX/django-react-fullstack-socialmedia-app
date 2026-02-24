import { clsx } from "clsx";

/**
 * IconButton Component
 * Button component for icon-only actions
 *
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {string} props.ariaLabel - Accessibility label (required)
 * @param {boolean} props.disabled - Disable the button
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Icon element
 */
const IconButton = ({
  variant = "ghost",
  size = "md",
  ariaLabel,
  disabled = false,
  className = "",
  children,
  type = "button",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800",
    secondary:
      "bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary-500 active:bg-secondary-300",
    danger:
      "bg-error-50 text-error-600 hover:bg-error-100 focus:ring-error-500 active:bg-error-200",
    ghost:
      "bg-transparent text-secondary-600 hover:bg-secondary-100 hover:text-secondary-800 focus:ring-secondary-500 active:bg-secondary-200",
  };

  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
