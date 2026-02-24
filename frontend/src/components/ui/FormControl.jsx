import { clsx } from "clsx";

/**
 * FormControl Component
 * Wrapper component that combines label, input/textarea, helper text, and error message
 *
 * @param {Object} props
 * @param {string} props.label - Form field label
 * @param {string} props.htmlFor - ID of the form element
 * @param {string} props.helperText - Helper text below the input
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Show required indicator
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Form input/textarea component
 */
const FormControl = ({
  label,
  htmlFor,
  helperText,
  error,
  required = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <div className={clsx("w-full", className)} {...props}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-secondary-700 mb-1.5"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-secondary-500">{helperText}</p>
      )}
      {error && <p className="mt-1.5 text-sm text-error-600">{error}</p>}
    </div>
  );
};

export default FormControl;
