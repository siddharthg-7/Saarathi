export function formatMinutesToHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getRiskLevel(skipProbability: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (skipProbability >= 75) return 'HIGH';
  if (skipProbability >= 30) return 'MEDIUM';
  return 'LOW';
}

export function getRiskBadgeClasses(skipProbability: number): string {
  const level = getRiskLevel(skipProbability);
  switch (level) {
    case 'HIGH':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse';
    case 'MEDIUM':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'LOW':
    default:
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  }
}
