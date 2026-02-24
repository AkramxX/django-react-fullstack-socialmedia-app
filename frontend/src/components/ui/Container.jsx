import { clsx } from "clsx";

/**
 * Container Component
 * Provides consistent max-width and horizontal padding
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | 'xl' | 'full'} props.size - Maximum width
 * @param {boolean} props.centered - Center the container
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Container content
 */
const Container = ({
  size = "lg",
  centered = true,
  className = "",
  children,
  as: Component = "div",
  ...props
}) => {
  const sizes = {
    sm: "max-w-xl", // 576px
    md: "max-w-2xl", // 672px
    lg: "max-w-5xl", // 1024px
    xl: "max-w-7xl", // 1280px
    full: "max-w-full",
  };

  return (
    <Component
      className={clsx(
        "w-full px-4 sm:px-6 lg:px-8",
        sizes[size],
        centered && "mx-auto",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Container;
