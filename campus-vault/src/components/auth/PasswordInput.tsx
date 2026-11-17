import { useState } from 'react';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  invalid?: boolean;
  describedBy?: string;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
  minLength,
  invalid = false,
  describedBy,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="password-input-wrap">
      <input
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <button
        className="password-visibility-toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 8.8 4.7 9.5 6-.3.6-1.3 2-3 3.5M6.2 6.2C3.9 7.7 2.7 9.8 2.5 11c.7 1.3 4.3 6 9.5 6 1 0 2-.2 2.8-.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        )}
      </button>
    </span>
  );
}
