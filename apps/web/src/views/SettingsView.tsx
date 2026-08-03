import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Bot,
  Clock,
  Bell,
  ShieldCheck,
  Activity,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { UserProfile } from '@saarathi/types';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userProfile, onUpdateProfile }) => {
  const [aiModel, setAiModel] = useState(userProfile.aiModel);
  const [workingStart, setWorkingStart] = useState(userProfile.workingHoursStart);
  const [workingEnd, setWorkingEnd] = useState(userProfile.workingHoursEnd);
  const [autoReschedule, setAutoReschedule] = useState(userProfile.autoRescheduleHighRisk);
  const [notifications, setNotifications] = useState(userProfile.notificationsEnabled);

  // System Health state
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkGatewayHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthStatus(data);
    } catch (err) {
      setHealthStatus({ status: 'offline', error: 'Failed to reach backend proxy' });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkGatewayHealth();
  }, []);

  const handleSave = () => {
    onUpdateProfile({
      aiModel,
      workingHoursStart: workingStart,
      workingHoursEnd: workingEnd,
      autoRescheduleHighRisk: autoReschedule,
      notificationsEnabled: notifications,
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>Saarathi OS Preferences & Model Architecture</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">System Settings</h1>
      </div>

      {/* AI Model Orchestration */}
      <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>Kairo AI Assistant Model Selector</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => {
              setAiModel('gemini-3.6-flash');
              onUpdateProfile({ aiModel: 'gemini-3.6-flash' });
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              aiModel === 'gemini-3.6-flash'
                ? 'bg-indigo-600/20 border-indigo-500/50 ring-1 ring-indigo-500/30'
                : 'bg-gray-950 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="font-bold text-xs text-white mb-1">Gemini 3.6 Flash</div>
            <p className="text-[11px] text-gray-400">
              Primary server-side LLM for complex schedule synthesis and chat reasoning.
            </p>
            {aiModel === 'gemini-3.6-flash' && (
              <span className="inline-block mt-2 text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setAiModel('groq-llama-3.3');
              onUpdateProfile({ aiModel: 'groq-llama-3.3' });
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              aiModel === 'groq-llama-3.3'
                ? 'bg-indigo-600/20 border-indigo-500/50 ring-1 ring-indigo-500/30'
                : 'bg-gray-950 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="font-bold text-xs text-white mb-1">Groq Llama 3.3 70B</div>
            <p className="text-[11px] text-gray-400">
              Ultra-low latency inference for Voice Brain Dump task parsing.
            </p>
            {aiModel === 'groq-llama-3.3' && (
              <span className="inline-block mt-2 text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setAiModel('hybrid-orchestrator');
              onUpdateProfile({ aiModel: 'hybrid-orchestrator' });
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              aiModel === 'hybrid-orchestrator'
                ? 'bg-indigo-600/20 border-indigo-500/50 ring-1 ring-indigo-500/30'
                : 'bg-gray-950 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="font-bold text-xs text-white mb-1">Hybrid Orchestrator</div>
            <p className="text-[11px] text-gray-400">
              Smart route queries between Gemini and Groq based on task complexity.
            </p>
            {aiModel === 'hybrid-orchestrator' && (
              <span className="inline-block mt-2 text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Working Hours & Auto-Reschedule */}
      <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Working Hours & Procrastination Automation</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Working Hours Window
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workingStart}
                onChange={(e) => setWorkingStart(e.target.value)}
                className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10"
              />
              <span className="text-gray-500 text-xs">to</span>
              <input
                type="text"
                value={workingEnd}
                onChange={(e) => setWorkingEnd(e.target.value)}
                className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-950 border border-white/5 cursor-pointer">
              <span className="text-xs font-medium text-gray-300">
                Auto-Reschedule High Skip-Risk Tasks ({'>'}75%)
              </span>
              <input
                type="checkbox"
                checked={autoReschedule}
                onChange={(e) => setAutoReschedule(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-950 border border-white/5 cursor-pointer">
              <span className="text-xs font-medium text-gray-300">
                Proactive Kairo Notifications
              </span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Live System Health Inspector */}
      <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Saarathi Express Gateway Health</span>
          </h3>

          <button
            onClick={checkGatewayHealth}
            disabled={checkingHealth}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
            <span>Ping Gateway</span>
          </button>
        </div>

        {healthStatus && (
          <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Gateway Status: {healthStatus.status}
              </span>
              <span>{healthStatus.system}</span>
            </div>
            <p className="text-gray-400">
              AI Connected: {healthStatus.aiConnected ? 'TRUE' : 'FALSE (Local Engine Active)'}
            </p>
            <p className="text-gray-500 text-[10px]">Timestamp: {healthStatus.timestamp}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};
