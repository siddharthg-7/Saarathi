import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  ...props
}) => {
  return (
    <div
      className={`bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-lg transition-all duration-200 ${
        hoverEffect ? 'hover:border-indigo-500/30 hover:shadow-indigo-500/5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
