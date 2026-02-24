'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id: externalId, className = '', ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-charcoal-700 mb-1">
            {label}
            {props.required && <span aria-hidden="true" className="text-red-600 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : undefined}
          className={`w-full px-4 py-2.5 border rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent transition-colors ${error ? 'border-red-500' : 'border-charcoal-200'} ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
