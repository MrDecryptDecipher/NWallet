import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const NeonInput = ({ label, icon, ...props }: NeonInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">{label}</label>
      <div className="relative group">
        {/* Glow effect */}
        <motion.div
          animate={{ opacity: isFocused ? 1 : 0 }}
          className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg blur opacity-0 transition duration-500 group-hover:opacity-50"
        />

        <div className="relative flex items-center bg-slate-900/90 rounded-lg border border-white/10 p-1">
          {icon && <div className="pl-3 text-gray-400">{icon}</div>}
          <input
            {...props}
            onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
            className="w-full bg-transparent border-none outline-none text-white p-2.5 placeholder-gray-500 focus:ring-0 [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_rgba(15,23,42,0.9)_inset] [&:-webkit-autofill]:-webkit-text-fill-color-white"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>
    </div>
  );
};
