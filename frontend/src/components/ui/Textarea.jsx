import { clsx } from "clsx";
import { forwardRef, useState } from "react";

/**
 * Textarea Component
 *
 * @param {Object} props
 * @param {string} props.label - Textarea label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message
 * @param {boolean} props.disabled - Disable the textarea
 * @param {number} props.rows - Number of rows
 * @param {number} props.maxLength - Maximum character length
 * @param {boolean} props.showCount - Show character count
 * @param {string} props.className - Additional CSS classes
 */
const Textarea = forwardRef(
  (
    {
      label,
      placeholder,
      error,
      disabled = false,
      rows = 4,
      maxLength,
      showCount = false,
      className = "",
      id,
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [charCount, setCharCount] = useState(value?.length || 0);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const handleChange = (e) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const baseStyles =
      "w-full px-4 py-2.5 text-secondary-900 bg-white border rounded-lg transition-all duration-200 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none";

    const stateStyles = error
      ? "border-error-500 focus:border-error-500 focus:ring-error-500/20"
      : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20";

    const disabledStyles =
      disabled && "bg-secondary-50 text-secondary-500 cursor-not-allowed";

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
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          className={clsx(baseStyles, stateStyles, disabledStyles, className)}
          {...props}
        />
        <div className="flex justify-between mt-1.5">
          {error && <p className="text-sm text-error-600">{error}</p>}
          {showCount && maxLength && (
            <p
              className={clsx(
                "text-sm ml-auto",
                charCount >= maxLength
                  ? "text-error-600"
                  : "text-secondary-500",
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
