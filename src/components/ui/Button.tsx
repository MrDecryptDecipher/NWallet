import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'web3' | 'web3outline' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'web3',
  type = 'button',
  disabled = false,
  className = '',
  style = {}
}) => {
  const baseClass = 'px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105';
  const variantClass = {
    web3: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    web3outline: 'border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white',
    ghost: 'bg-transparent text-purple-500 hover:bg-purple-500 hover:text-white'
  }[variant];

  return (
    <button
      className={`${baseClass} ${variantClass} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;