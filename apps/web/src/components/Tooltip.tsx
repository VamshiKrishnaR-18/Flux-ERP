import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { clsx } from 'clsx';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || <Info className={clsx("w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors", className)} />}
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] font-medium rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
