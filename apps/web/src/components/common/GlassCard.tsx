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
      className={`glass-premium rounded-xl p-5 shadow-sm-premium transition-all duration-200 ${
        hoverEffect ? 'hover:border-primary/30 hover:shadow-medium-premium' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
