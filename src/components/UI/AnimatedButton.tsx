import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const AnimatedButton = ({ children, className, isLoading, variant = 'primary', ...props }: AnimatedButtonProps) => {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] border-none",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20",
    danger: "bg-red-500/80 text-white hover:bg-red-600 border border-red-500/50"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={isLoading || props.disabled}
      className={cn(
        "py-3 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 w-full",
        variants[variant],
        (isLoading || props.disabled) && "opacity-50 cursor-not-allowed grayscale",
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </motion.button>
  );
};
