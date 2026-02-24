import { clsx } from "clsx";

/**
 * Card Component
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | 'none'} props.padding - Card padding
 * @param {boolean} props.shadow - Show shadow
 * @param {boolean} props.border - Show border
 * @param {boolean} props.hoverable - Add hover effect
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 */
const Card = ({
  padding = "md",
  shadow = true,
  border = true,
  hoverable = false,
  className = "",
  children,
  ...props
}) => {
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-lg",
        paddingStyles[padding],
        shadow && "shadow-sm",
        border && "border border-secondary-200",
        hoverable && "transition-shadow duration-200 hover:shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card.Header Component
 */
const CardHeader = ({ className = "", children, ...props }) => (
  <div
    className={clsx("pb-3 mb-3 border-b border-secondary-200", className)}
    {...props}
  >
    {children}
  </div>
);

/**
 * Card.Body Component
 */
const CardBody = ({ className = "", children, ...props }) => (
  <div className={clsx("", className)} {...props}>
    {children}
  </div>
);

/**
 * Card.Footer Component
 */
const CardFooter = ({ className = "", children, ...props }) => (
  <div
    className={clsx("pt-3 mt-3 border-t border-secondary-200", className)}
    {...props}
  >
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
