
import React from 'react';

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

const Logo: React.FC<LogoProps> = ({ className, size = "medium" }) => {
  const sizes = {
    small: "h-8",
    medium: "h-12",
    large: "h-20"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/acaizen-logo.png"
        alt="Açaízen Logo"
        className={`${sizes[size]}`}
        onError={(e) => {
          // Fallback if image doesn't load
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='none'%3E%3Crect width='100' height='100' rx='10' fill='%239b87f5'/%3E%3Cpath d='M30 65L50 35L70 65' stroke='white' stroke-width='6'/%3E%3C/svg%3E";
        }}
      />
      <div className={`ml-2 font-semibold text-primary-dark ${size === 'small' ? 'text-lg' : size === 'medium' ? 'text-xl' : 'text-3xl'}`}>
        <span>Açaízen</span>
        <span className="font-light ml-1">SmartHUB</span>
      </div>
    </div>
  );
};

export default Logo;
