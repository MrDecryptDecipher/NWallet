import React from 'react';

interface InputProps {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  step?: string;
  readOnly?: boolean;
  className?: string;
  onClick?: () => Promise<void> | void;  // Added onClick handler
}

const Input: React.FC<InputProps> = ({
  type,
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
  readOnly = false,
  className = '',
  onClick  // Add onClick to destructured props
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      step={step}
      readOnly={readOnly}
      className={`input-field ${className}`}
      onClick={onClick}  // Add onClick handler to input element
    />
  );
};

export default Input;