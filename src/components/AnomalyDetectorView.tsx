import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Zap,
  Sliders,
  Bell,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Search,
  Filter,
  Trash2,
  Settings,
  Clock,
  Activity,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '../lib/api';
import { PerformanceAlert, AnomalyDetectionConfig, DetectedAnomalyItem } from '../types';

interface AnomalyDetectorViewProps {
  onNavigateToTab?: (tab: string, prompt?: string) => void;
  onRefreshAlerts?: () => void;
}

export const AnomalyDetectorView: React.FC<AnomalyDetectorViewProps> = ({
  onNavigateToTab,
  onRefreshAlerts
}) => {
  const [config, setConfig] = useState<AnomalyDetectionConfig>({
    sensitivity: 1.8,
    lookbackDays: 30,
    autoScanIntervalMinutes: 15,
    autoScanEnabled: true,
    monitoredMetrics: {
      revenue: true,
      leads: true,
      conversions: true,
      conversionRate: true,
      cpl: true,
      cac: true,
      roi: true
    },
    pushToastNotifications: true
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [anomalies, setAnomalies] = useState<DetectedAnomalyItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [scannedMetricsCount, setScannedMetricsCount] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'positive'>('all');
  const [activeTab, setActiveTab] = useState<'anomalies' | 'alerts' | 'settings'>('anomalies');
  const [toastNotification, setToastNotification] = useState<{ title: string; message: string; type: 'critical' | 'warning' | 'positive' } | null>(null);

  // Load config and run initial scan on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const fetchedConfig = await api.getAnomalyConfig();
      if (fetchedConfig) setConfig(fetchedConfig);

      const fetchedAlerts = await api.getAlerts();
      setAlerts(fetchedAlerts || []);

      // Auto run scan on view open
      await handleRunScan(fetchedConfig?.sensitivity || 1.8);
    } catch (err) {
      console.error('Error initializing anomaly view:', err);
    }
  };

  const handleRunScan = async (sens?: number) => {
    setIsScanning(true);
    try {
      const res = await api.scanAnomalies(sens || config.sensitivity);
      setAnomalies(res.anomalies || []);
      setAlerts(res.alerts || []);
      setLastScanTime(res.scannedAt);
      setScannedMetricsCount(res.scannedMetricsCount || 24);

      if (onRefreshAlerts) onRefreshAlerts();

      if (res.anomalies && res.anomalies.length > 0 && config.pushToastNotifications) {
        const topAnom = res.anomalies[0];
        setToastNotification({
          title: topAnom.title,
          message: `${topAnom.metric} anomaly detected (Z=${topAnom.zScore}, ${topAnom.deviationPct > 0 ? '+' : ''}${topAnom.deviationPct}% deviation).`,
          type: topAnom.type
        });

        // Hide toast after 6 seconds
        setTimeout(() => setToastNotification(null), 6000);
      }
    } catch (err) {
      console.error('Failed to run anomaly scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<AnomalyDetectionConfig>) => {
    setIsSavingConfig(true);
    try {
      const updated = await api.updateAnomalyConfig(newConfig);
      setConfig(updated);
    } catch (err) {
      console.error('Failed to update anomaly config:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDismissAlert = async (id: string) => {
    try {
      const updatedAlerts = await api.dismissAlert(id);
      setAlerts(updatedAlerts);
      if (onRefreshAlerts) onRefreshAlerts();
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const handleClearAlerts = async () => {
    try {
      await api.clearAlerts();
      setAlerts([]);
      if (onRefreshAlerts) onRefreshAlerts();
    } catch (err) {
      console.error('Error clearing alerts:', err);
    }
  };

  const filteredAnomalies = anomalies.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Popup */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-indigo-500/30 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              toastNotification.type === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              toastNotification.type === 'positive' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Push Alert Notification
                </span>
                <button
                  onClick={() => setToastNotification(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <h4 className="font-bold text-sm text-slate-100">{toastNotification.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-snug">{toastNotification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Automated Proactive Metric Scanner</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Anomaly Detection & Push Alerts
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Continuously scans daily revenue, conversion drop-offs, lead volume spikes, and channel CPL/CAC variations using Z-Score statistical outlier algorithms.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => handleRunScan()}
              disabled={isScanning}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Metrics...' : 'Run Instant AI Scan'}</span>
            </button>
          </div>
        </div>

        {/* Scan Status Metrics Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">Engine Status</span>
              <span className="font-semibold text-white">Active Monitoring</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">Sensitivity Threshold</span>
              <span className="font-semibold text-white">Z ≥ {config.sensitivity} σ</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">Last Scanned</span>
              <span className="font-semibold text-white">
                {lastScanTime ? new Date(lastScanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">Anomalies Found</span>
              <span className="font-semibold text-white">{anomalies.length} Flagged</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'anomalies'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Detected Anomalies ({anomalies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Active Alerts ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Scan Rules & Sensitivity</span>
          </button>
        </div>

        {activeTab === 'anomalies' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'all' ? 'bg-white dark:bg-slate-700 font-bold shadow-xs' : 'text-slate-500'
              }`}
            >
              All ({anomalies.length})
            </button>
            <button
              onClick={() => setActiveFilter('critical')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'critical' ? 'bg-rose-500 text-white font-bold shadow-xs' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              Critical ({anomalies.filter(a => a.type === 'critical').length})
            </button>
            <button
              onClick={() => setActiveFilter('warning')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'warning' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              Warning ({anomalies.filter(a => a.type === 'warning').length})
            </button>
            <button
              onClick={() => setActiveFilter('positive')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'positive' ? 'bg-emerald-500 text-white font-bold shadow-xs' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Positive ({anomalies.filter(a => a.type === 'positive').length})
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Detected Anomalies Feed */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          {filteredAnomalies.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">No Metrics Anomalies Detected</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                All marketing channels, conversion rates, and spend efficiency parameters are operating within expected baseline limits (Z &lt; {config.sensitivity}).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAnomalies.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-lg relative overflow-hidden bg-white dark:bg-slate-900 ${
                    item.type === 'critical'
                      ? 'border-rose-200 dark:border-rose-900/50'
                      : item.type === 'positive'
                      ? 'border-emerald-200 dark:border-emerald-900/50'
                      : 'border-amber-200 dark:border-amber-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          item.type === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' :
                          item.type === 'positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                        }`}>
                          {item.type} Anomaly
                        </span>

                        {item.channel && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                            {item.channel}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-mono">
                          Z = {item.zScore} σ
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {item.title}
                      </h3>
                    </div>

                    <div className={`p-2 rounded-xl shrink-0 ${
                      item.deviationPct > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    }`}>
                      {item.deviationPct > 0 ? (
                        <div className="flex items-center gap-0.5 font-bold text-xs">
                          <ArrowUpRight className="w-4 h-4" />
                          <span>+{item.deviationPct}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 font-bold text-xs">
                          <ArrowDownRight className="w-4 h-4" />
                          <span>{item.deviationPct}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Value comparison metrics box */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Observed Metric Value</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        {item.unit === 'currency' ? `₹${item.currentValue.toLocaleString('en-IN')}` :
                         item.unit === 'percentage' ? `${item.currentValue}%` :
                         `${item.currentValue}x`}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] block">Baseline Mean ({config.lookbackDays}d)</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {item.unit === 'currency' ? `₹${item.baselineValue.toLocaleString('en-IN')}` :
                         item.unit === 'percentage' ? `${item.baselineValue}%` :
                         `${item.baselineValue}x`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <p className="leading-relaxed">
                      <strong className="text-slate-800 dark:text-slate-200">Probable Root Cause:</strong> {item.probableCause}
                    </p>
                    <p className="leading-relaxed text-indigo-600 dark:text-indigo-400 font-medium">
                      <strong className="text-slate-800 dark:text-slate-200">Recommended Action:</strong> {item.recommendedAction}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400">{item.timeframe}</span>
                    
                    <button
                      onClick={() => {
                        if (onNavigateToTab) {
                          onNavigateToTab('chat', `How can we fix the anomaly: ${item.title}? Probable cause: ${item.probableCause}`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 transition-all flex items-center gap-1 text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Consult AI CMO</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Alerts Drawer Panel View */}
      {activeTab === 'alerts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Triggered Push Alerts Feed
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All alerts generated into the top navbar notification drawer.
              </p>
            </div>

            {alerts.length > 0 && (
              <button
                onClick={handleClearAlerts}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Alerts</span>
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No active performance alerts. Click "Run Instant AI Scan" to evaluate real-time dataset metrics.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-4 text-xs ${
                    alt.type === 'critical'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                      : alt.type === 'positive'
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span>{alt.title}</span>
                      <span className="text-[10px] font-mono opacity-70">
                        {new Date(alt.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="opacity-90 leading-relaxed text-xs">{alt.message}</p>

                    {alt.actionLabel && (
                      <button
                        onClick={() => {
                          if (onNavigateToTab) onNavigateToTab('chat', `Detailed analysis on alert: ${alt.title} - ${alt.message}`);
                        }}
                        className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{alt.actionLabel}</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDismissAlert(alt.id)}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 transition-all"
                    title="Dismiss alert"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings & Sensitivity Rules */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              Anomaly Detection Configuration & Threshold Rules
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust statistical outlier thresholds (Z-Score), lookback windows, and push alert triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sensitivity Setting */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Statistical Sensitivity (Z-Score Threshold)
                </label>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
                  Z = {config.sensitivity} σ
                </span>
              </div>

              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={config.sensitivity}
                onChange={(e) => handleUpdateConfig({ sensitivity: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1.0 σ (Strict / High Alerts)</span>
                <span>1.8 σ (Balanced Default)</span>
                <span>3.0 σ (Relaxed / Extreme Only)</span>
              </div>
            </div>

            {/* Lookback Period Setting */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                Historical Baseline Window
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[14, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => handleUpdateConfig({ lookbackDays: days })}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      config.lookbackDays === days
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {days} Days Baseline
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Monitored Metrics Checkboxes */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Monitored Key Performance Metrics
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {Object.entries(config.monitoredMetrics).map(([key, isMonitored]) => (
                <label
                  key={key}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    {key === 'conversionRate' ? 'Conversion Rate %' : key.toUpperCase()}
                  </span>
                  <input
                    type="checkbox"
                    checked={isMonitored}
                    onChange={(e) =>
                      handleUpdateConfig({
                        monitoredMetrics: {
                          ...config.monitoredMetrics,
                          [key]: e.target.checked
                        }
                      })
                    }
                    className="w-4 h-4 rounded-md text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
