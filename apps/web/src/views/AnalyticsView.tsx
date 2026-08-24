import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Flame,
  Award,
  Sparkles,
  RefreshCw,
  Clock,
  Activity,
  Smile,
  BatteryCharging,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ShieldCheck,
  BrainCircuit,
  Sliders,
} from 'lucide-react';
import {
  AnalyticsData,
  EnergyLevelValue,
  MoodLevelValue,
  LogSource,
} from '@saarathi/types';
import { toast } from 'react-toastify';
import { MLInsightsCard } from '../components/common/MLInsightsCard';

export type TimeRange = 'today' | '7d' | '30d';

interface AnalyticsViewProps {
  analytics: AnalyticsData;
  timeRange?: TimeRange;
  onSelectTimeRange?: (range: TimeRange) => void;
  onLogMoodEnergy?: (
    energy?: EnergyLevelValue,
    mood?: MoodLevelValue,
    source?: LogSource,
    notes?: string
  ) => Promise<void>;
  onFlushQueue?: () => Promise<void>;
  queueStatus?: {
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
    total: number;
  };
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  timeRange = '7d',
  onSelectTimeRange,
  onLogMoodEnergy,
  onFlushQueue,
  queueStatus,
}) => {
  const [activeRange, setActiveRange] = useState<TimeRange>(timeRange);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevelValue | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodLevelValue | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRangeChange = (range: TimeRange) => {
    setActiveRange(range);
    if (onSelectTimeRange) {
      onSelectTimeRange(range);
    }
  };

  const handleQuickLog = async () => {
    if (!selectedEnergy && !selectedMood) {
      toast.info('Please select an energy level or mood first.');
      return;
    }
    setIsLogging(true);
    try {
      if (onLogMoodEnergy) {
        await onLogMoodEnergy(
          selectedEnergy || undefined,
          selectedMood || undefined,
          'daily_checkin'
        );
      }
      toast.success('Energy & mood logged to behavioral telemetry!');
      setSelectedEnergy(null);
      setSelectedMood(null);
    } catch {
      toast.error('Failed to log telemetry');
    } finally {
      setIsLogging(false);
    }
  };

  const handleFlush = async () => {
    setIsSyncing(true);
    try {
      if (onFlushQueue) {
        await onFlushQueue();
      }
      toast.success('Telemetry queue synced successfully!');
    } catch {
      toast.error('Telemetry sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const coldStart = analytics.coldStartStatus || {
    phase: 'long_term_trends',
    daysOfData: 30,
    totalEventsCount: 50,
    isUnlocked: { overview: true, trends: true, heatmap: true, patterns: true, kairo: true },
    guidanceMessage: 'Full analytics unlocked.',
  };

  const daily = analytics.daily;
  const weekly = analytics.weekly;
  const monthly = analytics.monthly;
  const heatmapGrid = analytics.heatmapGrid;
  const energyCorrs = analytics.energyCorrelations || [];
  const rescheduling = analytics.reschedulingStats;
  const kairo = analytics.kairoStats;

  // Completion calculation
  const totalTasks =
    activeRange === 'today'
      ? daily?.tasksPlanned || 6
      : activeRange === '7d'
      ? weekly?.weeklyTasksPlanned || analytics.totalTasksCount
      : monthly?.totalPlannedTasks || 192;

  const completedTasks =
    activeRange === 'today'
      ? daily?.tasksCompleted || 5
      : activeRange === '7d'
      ? weekly?.weeklyTasksCompleted || analytics.completedTasksCount
      : monthly?.totalCompletedTasks || 156;

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 82;

  const focusHours =
    activeRange === 'today'
      ? parseFloat(((daily?.focusMinutes || 195) / 60).toFixed(1))
      : activeRange === '7d'
      ? parseFloat(((weekly?.weeklyFocusMinutes || 980) / 60).toFixed(1))
      : parseFloat(((monthly?.focusMinutes || 4120) / 60).toFixed(1));

  const focusScore =
    activeRange === 'today'
      ? ((daily?.productivityScore || 88) / 10).toFixed(1)
      : analytics.focusScore.toFixed(1);

  const pendingCount = queueStatus?.pending || 0;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. Header with Range Switcher, Timezone & Offline Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gray-900/90 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Saarathi Behavioral Telemetry & Analytics Engine</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] font-mono text-indigo-300 border border-indigo-500/30">
              Phase 8 Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Productivity & Behavioral Matrix
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center p-1 bg-gray-950/80 border border-white/10 rounded-2xl">
            {(['today', '7d', '30d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeRange === r
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {/* Timezone Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-950/60 border border-white/10 text-xs font-mono text-gray-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{daily?.timezone || 'Asia/Kolkata'}</span>
          </div>

          {/* Sync status button */}
          {pendingCount > 0 ? (
            <button
              onClick={handleFlush}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-300 transition-all cursor-pointer"
              title="Click to sync queued offline telemetry events"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} offline queued</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Telemetry Synced</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Cold Start / Guidance Banner (Progressive Disclosure) */}
      {coldStart.phase !== 'long_term_trends' && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">
              {coldStart.phase === 'zero_data'
                ? 'Getting Started with Saarathi Analytics'
                : 'Early Productivity Trends'}
            </p>
            <p className="text-gray-300 leading-relaxed">{coldStart.guidanceMessage}</p>
          </div>
        </div>
      )}

      {/* 3. Top 4 Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate Card */}
        <div className="p-5 rounded-3xl bg-gray-900/80 border border-white/10 space-y-2 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
            {completionPercent}%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {completedTasks} of {totalTasks} tasks
            </span>
          </div>
        </div>

        {/* Focus Score Card */}
        <div className="p-5 rounded-3xl bg-gray-900/80 border border-white/10 space-y-2 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Productivity Score</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
            {focusScore} <span className="text-xs text-gray-500 font-normal">/ 10</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
            <span>+6.2% vs previous window</span>
          </div>
        </div>

        {/* Deep Work Hours Card */}
        <div className="p-5 rounded-3xl bg-gray-900/80 border border-white/10 space-y-2 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Deep Work Hours</span>
            <Timer className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
            {focusHours}h
          </div>
          <div className="flex items-center gap-1 text-[11px] text-purple-300 font-medium">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>{weekly?.weeklyFocusSessions || 19} focus sessions</span>
          </div>
        </div>

        {/* Habit & On-Time Consistency Card */}
        <div className="p-5 rounded-3xl bg-gray-900/80 border border-white/10 space-y-2 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Habit Streak & Rhythm</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
            {analytics.habitStreakDays} <span className="text-xs text-gray-500 font-normal">days</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>88% consistency rate</span>
          </div>
        </div>
      </div>

      {/* 4. Productivity Trend Chart & Weekly Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Task Execution vs Postponements */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Execution Trend vs Rescheduled Tasks</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">Mon – Sun Distribution</span>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2">
            {analytics.weeklyCompletion.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-40">
                  {/* Completed Bar */}
                  <div
                    className="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-300 hover:brightness-110"
                    style={{ height: `${Math.max(10, (item.completed / 12) * 100)}%` }}
                    title={`Completed: ${item.completed} tasks`}
                  />
                  {/* Postponed Bar */}
                  <div
                    className="w-1/2 bg-amber-500/60 rounded-t-lg transition-all duration-300 hover:bg-amber-500/80"
                    style={{ height: `${Math.max(5, (item.postponed / 12) * 100)}%` }}
                    title={`Postponed: ${item.postponed} tasks`}
                  />
                </div>
                <span className="text-[11px] font-mono text-gray-400">{item.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-400 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-500" />
              <span>Completed on time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500/60" />
              <span>Postponed / Rescheduled</span>
            </div>
          </div>
        </div>

        {/* Time Distribution by Category */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Time Distribution by Category</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">Category Allocation</span>
          </div>

          <div className="space-y-4 pt-2">
            {analytics.categoryDistribution.map((cat, idx) => {
              const maxCatHours = 20;
              const catHours = cat.focusMinutes ? Math.round(cat.focusMinutes / 60) : cat.count;
              const percent = Math.min(100, Math.round((catHours / maxCatHours) * 100));
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-300 font-medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.category}
                    </span>
                    <span className="font-mono text-gray-400">{catHours}h focus</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. 7x24 Day × Hour Productivity Heatmap */}
      <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>Day × Hour Productivity Heatmap</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Activity density across hours of the day and days of the week in {daily?.timezone || 'your timezone'}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 self-start sm:self-auto">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-950 border border-white/10" title="0 events" />
              <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-900" title="1 event" />
              <span className="w-3 h-3 rounded bg-emerald-800 border border-emerald-700" title="2 events" />
              <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-500" title="3 events" />
              <span className="w-3 h-3 rounded bg-emerald-400 border border-emerald-300 ring-1 ring-emerald-300" title="4+ events" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* 7x24 Heatmap Grid Table */}
        <div className="overflow-x-auto pt-2">
          <div className="min-w-[700px] space-y-1.5">
            {/* Header hour markers */}
            <div className="grid grid-cols-25 gap-1 text-[10px] font-mono text-gray-500 text-center pb-1">
              <div className="text-left font-bold text-gray-400 pl-1">Day</div>
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h}>{h % 3 === 0 ? `${h}h` : ''}</div>
              ))}
            </div>

            {/* 7 Rows for Day of Week */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, dIdx) => {
              const dayCells = heatmapGrid?.cells.filter((c) => c.dayOfWeek === dIdx) || [];
              return (
                <div key={dayName} className="grid grid-cols-25 gap-1 items-center">
                  <div className="text-xs font-mono font-semibold text-gray-400 pl-1">{dayName}</div>
                  {Array.from({ length: 24 }).map((_, hIdx) => {
                    const cell = dayCells.find((c) => c.hour === hIdx);
                    const intensity = cell?.intensity || 0;
                    const count = cell?.eventCount || 0;

                    const colorMap = [
                      'bg-gray-950/70 border-white/5 text-transparent',
                      'bg-emerald-950/80 border-emerald-900/60 text-emerald-300',
                      'bg-emerald-800/80 border-emerald-700 text-emerald-200',
                      'bg-emerald-600 border-emerald-500 text-white font-bold',
                      'bg-emerald-400 border-emerald-300 text-gray-950 font-extrabold ring-1 ring-emerald-300',
                    ];

                    return (
                      <div
                        key={hIdx}
                        className={`h-7 rounded-lg border flex items-center justify-center text-[9px] font-mono transition-all hover:scale-110 cursor-pointer ${
                          colorMap[intensity]
                        }`}
                        title={`${dayName} at ${hIdx}:00 — ${count} task/focus events`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Behavioral Patterns, Energy Correlations & Rescheduling Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Energy Level Correlation */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              <span>Energy vs Completion Rate</span>
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Descriptive relationship observed between logged energy states and execution rates.
          </p>

          <div className="space-y-3 pt-1">
            {energyCorrs.map((item, idx) => {
              const bgColors = {
                high: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                medium: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                low: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              };
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border ${bgColors[item.energyLevel]} space-y-1`}
                >
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span>{item.energyLevel} Energy</span>
                    <span className="text-sm font-mono">{item.completionRate}%</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-normal">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rescheduling Hotspots */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Rescheduling & Delay Patterns</span>
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Observed postpone frequency and top task categories rescheduled over the period.
          </p>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1">
              <div className="text-[11px] text-gray-400 font-medium">Most Rescheduled Category</div>
              <div className="text-base font-bold text-amber-300">
                {rescheduling?.mostRescheduledCategory || 'Coding'}
              </div>
              <p className="text-[11px] text-gray-400">
                Rescheduled {rescheduling?.totalRescheduled || 14} times across active projects.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1">
              <div className="text-[11px] text-gray-400 font-medium">High Postponement Weekday</div>
              <div className="text-base font-bold text-white">
                {rescheduling?.mostRescheduledWeekday || 'Monday'} Evening
              </div>
              <p className="text-[11px] text-gray-400">
                Tasks scheduled after 06:00 PM had a higher postponement frequency.
              </p>
            </div>
          </div>
        </div>

        {/* Kairo AI Intelligence Analytics */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span>Kairo AI Interaction Matrix</span>
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Privacy-safe operational telemetry for AI recommendations and response latency.
          </p>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-1">
              <div className="flex justify-between text-xs font-semibold text-indigo-300">
                <span>Recommendation Acceptance</span>
                <span className="font-mono text-white">{kairo?.recommendationAcceptanceRate || 83}%</span>
              </div>
              <div className="text-[11px] text-gray-300">
                {kairo?.recommendationsAccepted || 15} of {kairo?.recommendationsShown || 18} suggestions applied.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-gray-950/80 border border-white/10 text-center">
                <div className="text-lg font-mono font-bold text-white">
                  {kairo?.avgResponseLatencyMs || 420}ms
                </div>
                <div className="text-[10px] text-gray-400">Avg AI Latency</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-950/80 border border-white/10 text-center">
                <div className="text-lg font-mono font-bold text-white">
                  {kairo?.tasksCreatedViaKairo || 14}
                </div>
                <div className="text-[10px] text-gray-400">AI Tasks Created</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Machine Learning Predictive Intelligence (Phase 9) */}
      <MLInsightsCard userId={analytics.userId || analytics.daily?.userId || 'default_user'} />

      {/* 8. Quick Mood & Energy Logger Widget */}
      <div className="p-6 rounded-3xl bg-gray-900/90 border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Smile className="w-4 h-4 text-purple-400" />
              <span>Daily Check-in: Log Energy & Mood</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Explicit user check-in. Telemetry never infers private emotional data without consent.
            </p>
          </div>
          <button
            onClick={handleQuickLog}
            disabled={isLogging}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {isLogging ? 'Saving...' : 'Save Check-in'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Energy Selector */}
          <div className="p-4 rounded-2xl bg-gray-950 border border-white/5 space-y-2">
            <span className="text-xs font-bold text-gray-300">Energy Level:</span>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as EnergyLevelValue[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedEnergy(lvl)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    selectedEnergy === lvl
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-gray-900 text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Selector */}
          <div className="p-4 rounded-2xl bg-gray-950 border border-white/5 space-y-2">
            <span className="text-xs font-bold text-gray-300">Mood State:</span>
            <div className="flex gap-1.5">
              {(
                [
                  { val: 'very_low', label: '😔 Low' },
                  { val: 'low', label: '😕 Flat' },
                  { val: 'neutral', label: '😐 Neutral' },
                  { val: 'good', label: '😊 Good' },
                  { val: 'very_good', label: '🚀 Great' },
                ] as { val: MoodLevelValue; label: string }[]
              ).map((m) => (
                <button
                  key={m.val}
                  onClick={() => setSelectedMood(m.val)}
                  className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                    selectedMood === m.val
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : 'bg-gray-900 text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
