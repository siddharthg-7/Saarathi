import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'gray';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gray', className = '' }) => {
  const variantMap = {
    indigo: 'bg-primary/10 text-primary border-primary/20',
    emerald: 'bg-success/10 text-success border-success/20',
    amber: 'bg-warning/10 text-warning border-warning/20',
    rose: 'bg-danger/10 text-danger border-danger/20',
    gray: 'bg-surfaceSecondary text-textSecondary border-border',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${variantMap[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
