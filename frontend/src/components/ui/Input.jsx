import { clsx } from "clsx";
import { forwardRef } from "react";

/**
 * Input Component
 *
 * @param {Object} props
 * @param {'text' | 'email' | 'password' | 'file' | 'search'} props.type - Input type
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message
 * @param {boolean} props.disabled - Disable the input
 * @param {string} props.className - Additional CSS classes
 */
const Input = forwardRef(
  (
    {
      type = "text",
      label,
      placeholder,
      error,
      disabled = false,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const baseStyles =
      "w-full px-4 py-2.5 text-secondary-900 bg-white border rounded-lg transition-all duration-200 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-offset-0";

    const stateStyles = error
      ? "border-error-500 focus:border-error-500 focus:ring-error-500/20"
      : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20";

    const disabledStyles =
      disabled && "bg-secondary-50 text-secondary-500 cursor-not-allowed";

    if (type === "file") {
      return (
        <div className="w-full">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-secondary-700 mb-1.5"
            >
              {label}
            </label>
          )}
          <input
            ref={ref}
            id={inputId}
            type="file"
            disabled={disabled}
            className={clsx(
              "w-full text-sm text-secondary-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              className,
            )}
            {...props}
          />
          {error && <p className="mt-1.5 text-sm text-error-600">{error}</p>}
        </div>
      );
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-secondary-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(baseStyles, stateStyles, disabledStyles, className)}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-error-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
