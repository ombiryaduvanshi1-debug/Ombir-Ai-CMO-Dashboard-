import React, { useState, useEffect } from 'react';
import {
  Activity,
  BarChart3,
  Globe,
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  ExternalLink,
  Shield,
  Clock,
  PieChart as PieIcon,
  MousePointer,
  FileText
} from 'lucide-react';
import { GoogleAnalyticsMetric } from '../types';
import { api } from '../lib/api';

export const GoogleAnalyticsView: React.FC<{
  onNavigateWithPrompt?: (tab: 'chat' | 'reports' | 'insights', prompt: string) => void;
}> = ({ onNavigateWithPrompt }) => {
  const [gaData, setGaData] = useState<GoogleAnalyticsMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Connection Form State
  const [propertyIdInput, setPropertyIdInput] = useState('properties/498123019');
  const [measurementIdInput, setMeasurementIdInput] = useState('G-CMO391829');
  const [propertyNameInput, setPropertyNameInput] = useState('Enterprise Web & Mobile App (GA4)');
  const [apiSecretInput, setApiSecretInput] = useState('ga4_sec_991823102');

  const loadGAData = async () => {
    setLoading(true);
    try {
      const data = await api.getGAData();
      setGaData(data);
      if (data) {
        setPropertyIdInput(data.propertyId || 'properties/498123019');
        setMeasurementIdInput(data.measurementId || 'G-CMO391829');
        setPropertyNameInput(data.propertyName || 'Enterprise Web & Mobile App (GA4)');
      }
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: 'Failed to load Google Analytics data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGAData();
  }, []);

  const handleConnectGA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    setMessage(null);
    try {
      const res = await api.connectGA({
        propertyId: propertyIdInput,
        measurementId: measurementIdInput,
        propertyName: propertyNameInput,
        apiKey: apiSecretInput
      });
      setGaData(res);
      setShowConfigModal(false);
      setMessage({ type: 'success', text: 'Google Analytics 4 property connected successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to connect Google Analytics' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncLive = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await api.syncGA();
      setGaData(res.gaData);
      setMessage({ type: 'success', text: `GA4 live sync complete! Processed ${res.syncedEvents} web events.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to sync Google Analytics' });
    } finally {
      setSyncing(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    setAnalyzing(true);
    setMessage(null);
    try {
      const res = await api.analyzeGA();
      setAiAnalysis(res.analysis);
      setGaData(res.gaData);
      setMessage({ type: 'success', text: 'Gemini AI traffic & attribution audit generated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to analyze GA4 metrics' });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
        <p className="text-sm font-medium">Connecting to Google Analytics 4 Data API...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              Google Analytics 4 (GA4) Integration
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Data API v1 Connected
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Google Analytics Traffic & Conversion Hub
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Realtime website traffic, user acquisition channels, event conversions, and landing page bounce rate analytics directly synchronized with Gemini CMO Intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            Connect / Configure Property
          </button>

          <button
            onClick={handleSyncLive}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing GA4...' : 'Live GA4 Sync'}
          </button>

          <button
            onClick={handleRunAIAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Auditing Traffic...' : 'Gemini GA4 Audit'}
          </button>
        </div>
      </div>

      {/* Message Notice */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Realtime KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Realtime Active Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Visitors Right Now</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {gaData?.realtimeActiveUsers || 142}
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1"></span>
              Live GA4 Stream
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Active on desktop & mobile web right now</p>
        </div>

        {/* Total Users Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users Today</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {(gaData?.totalUsersToday || 18450).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
              +14.2% vs yesterday
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {(gaData?.sessionsToday || 24120).toLocaleString('en-IN')} total sessions recorded
          </p>
        </div>

        {/* Avg Engagement Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Engagement Time</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {Math.floor((gaData?.avgEngagementTimeSec || 184) / 60)}m {(gaData?.avgEngagementTimeSec || 184) % 60}s
            </span>
            <span className="text-xs font-bold text-emerald-400">+12s session length</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">High active time on pricing & demo pages</p>
        </div>

        {/* Bounce Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bounce Rate</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {gaData?.bounceRatePct || 38.4}%
            </span>
            <span className="text-xs font-bold text-emerald-400">-2.1% (Improved)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {(gaData?.pageviewsToday || 68900).toLocaleString('en-IN')} pageviews today
          </p>
        </div>
      </div>

      {/* AI Traffic Analysis Result Card */}
      {aiAnalysis && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span>Gemini AI Google Analytics 4 Traffic & Attribution Audit</span>
            </div>
            <button
              onClick={() => onNavigateWithPrompt?.('chat', `Deep-dive into my Google Analytics 4 traffic sources (${gaData?.measurementId}) and outline an immediate strategy to boost lead conversions.`)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              Discuss in AI CMO Chat
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* Two Column Layout: Acquisition Sources & Landing Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acquisition Traffic Sources Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              User Acquisition Traffic Sources (GA4)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Session Default Channel Group
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="pb-3">Source / Channel</th>
                  <th className="pb-3 text-right">Users</th>
                  <th className="pb-3 text-right">Sessions</th>
                  <th className="pb-3 text-right">Conversions</th>
                  <th className="pb-3 text-right">Conv. %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {(gaData?.trafficSources || []).map((src, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {src.source}
                    </td>
                    <td className="py-3 text-right">{src.users.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-slate-400">{src.sessions.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right font-bold text-emerald-400">{src.conversions}</td>
                    <td className="py-3 text-right font-bold text-indigo-400">{src.conversionRatePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Landing Pages Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Top Landing Pages & Engagement (GA4)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Page Path
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="pb-3">Page Path</th>
                  <th className="pb-3 text-right">Pageviews</th>
                  <th className="pb-3 text-right">Avg Active Time</th>
                  <th className="pb-3 text-right">Conversions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {(gaData?.topLandingPages || []).map((page, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono text-[11px] text-indigo-300 truncate max-w-[180px]">
                      {page.path}
                    </td>
                    <td className="py-3 text-right font-semibold text-white">{page.views.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-slate-400">{Math.floor(page.activeTimeSec / 60)}m {page.activeTimeSec % 60}s</td>
                    <td className="py-3 text-right font-bold text-emerald-400">{page.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* GA4 Event Conversions & Monetary Value in INR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-emerald-400" />
              GA4 Key Event Conversions & Attributed Pipeline Value (INR)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Track custom lead forms, demo schedules, and whitepaper downloads synchronized with Salesforce/Zoho pipeline.</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Measurement Protocol
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {(gaData?.conversionsByEvent || []).map((evt, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-emerald-500/40 transition">
              <span className="text-[11px] font-mono text-indigo-300 font-semibold">{evt.eventName}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white">{evt.count.toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Events
                </span>
              </div>
              {evt.valueINR > 0 && (
                <p className="text-xs font-semibold text-emerald-300">
                  Value: ₹{evt.valueINR.toLocaleString('en-IN')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connect Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-lg w-full space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Connect Google Analytics 4 (GA4)</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectGA} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  GA4 Property ID
                </label>
                <input
                  type="text"
                  required
                  value={propertyIdInput}
                  onChange={e => setPropertyIdInput(e.target.value)}
                  placeholder="e.g. properties/498123019"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Found in Google Analytics Admin &gt; Property Settings</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Measurement ID (Web Stream)
                </label>
                <input
                  type="text"
                  required
                  value={measurementIdInput}
                  onChange={e => setMeasurementIdInput(e.target.value)}
                  placeholder="e.g. G-CMO391829"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Format: G-XXXXXXXXXX for Data Streams</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Property Display Name
                </label>
                <input
                  type="text"
                  value={propertyNameInput}
                  onChange={e => setPropertyNameInput(e.target.value)}
                  placeholder="e.g. Main Enterprise Website & App"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Measurement Protocol API Secret / Service Key
                </label>
                <input
                  type="password"
                  value={apiSecretInput}
                  onChange={e => setApiSecretInput(e.target.value)}
                  placeholder="Enter GA4 API Secret or Token"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {syncing ? 'Verifying...' : 'Save & Test GA4 Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
