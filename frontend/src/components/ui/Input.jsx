import { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      type = 'text',
      error,
      className = '',
      helperText,
      ...props
    },
    ref
  ) => {
    return (
      <div className={className}>
        {label && (
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full rounded-xl border bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border)]'
          }`}
          {...props}
        />
        {helperText && !error && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
        )}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
