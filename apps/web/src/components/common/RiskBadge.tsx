import React from 'react';
import { AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { getRiskLevel, getRiskBadgeClasses } from '@saarathi/utils';

interface RiskBadgeProps {
  skipProbability: number;
  showIcon?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  skipProbability,
  showIcon = true,
  className = '',
}) => {
  const level = getRiskLevel(skipProbability);
  const badgeClasses = getRiskBadgeClasses(skipProbability);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badgeClasses} ${className}`}
      data-testid="risk-badge"
    >
      {showIcon && level === 'HIGH' && <AlertOctagon className="w-3.5 h-3.5" />}
      {showIcon && level === 'MEDIUM' && <AlertTriangle className="w-3.5 h-3.5" />}
      {showIcon && level === 'LOW' && <CheckCircle2 className="w-3.5 h-3.5" />}
      {skipProbability}% Skip Risk
    </span>
  );
};
