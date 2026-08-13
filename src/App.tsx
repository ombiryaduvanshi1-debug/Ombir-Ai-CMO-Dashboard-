import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { AIChatView } from './components/AIChatView';
import { AIInsightsView } from './components/AIInsightsView';
import { CSVUploadView } from './components/CSVUploadView';
import { CRMIntegrationView } from './components/CRMIntegrationView';
import { GoogleAnalyticsView } from './components/GoogleAnalyticsView';
import { ReportsView } from './components/ReportsView';
import { AdminPanelView } from './components/AdminPanelView';
import { DataManagementView } from './components/DataManagementView';
import { ROICostSheetView } from './components/ROICostSheetView';
import { AnomalyDetectorView } from './components/AnomalyDetectorView';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { PerformanceAlert } from './types';
import { api } from './lib/api';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [dateFilter, setDateFilter] = useState('monthly');
  const [channelFilter, setChannelFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialChatPrompt, setInitialChatPrompt] = useState<string | undefined>(undefined);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const mData = await api.getMetrics({ dateRange: dateFilter, channel: channelFilter, project: projectFilter });
      setMetrics(mData);
      const aData = await api.getAlerts();
      setAlerts(aData);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateFilter, channelFilter, projectFilter]);

  const availableProjects = React.useMemo(() => {
    if (metrics?.allProjectsAvailable && Array.isArray(metrics.allProjectsAvailable) && metrics.allProjectsAvailable.length > 0) {
      return metrics.allProjectsAvailable;
    }
    if (metrics?.marketingDashboard?.projectWisePerformance && Array.isArray(metrics.marketingDashboard.projectWisePerformance) && metrics.marketingDashboard.projectWisePerformance.length > 0) {
      return metrics.marketingDashboard.projectWisePerformance.map((p: any) => p.project).filter(Boolean);
    }
    return [
      'MERLIN GROUP CORPORATE (KOLKATA)',
      'MERLIN AQUAVILLE',
      'MERLIN X',
      'Rise Reloaded',
      'SERENIA',
      'MERLIN IVY',
      'F RESIDENCES',
      'General Project'
    ];
  }, [metrics]);

  const availableChannels = React.useMemo(() => {
    if (metrics?.allChannelsAvailable && Array.isArray(metrics.allChannelsAvailable) && metrics.allChannelsAvailable.length > 0) {
      return metrics.allChannelsAvailable;
    }
    if (metrics?.marketingDashboard?.sourceWisePerformance && Array.isArray(metrics.marketingDashboard.sourceWisePerformance) && metrics.marketingDashboard.sourceWisePerformance.length > 0) {
      return metrics.marketingDashboard.sourceWisePerformance.map((s: any) => s.source).filter(Boolean);
    }
    return [
      'Google Ads',
      'Meta Ads',
      'LinkedIn',
      'Organic SEO',
      'Email Nurture',
      'Salesforce CRM'
    ];
  }, [metrics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium text-slate-400">Booting Ombir AI CMO Dashboard Engine...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleNavigateWithPrompt = (tab: NavTab, prompt: string) => {

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Live Voice Modal for gemini-3.1-flash-live-preview */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateToTab={(tab, prompt) => {
          if (prompt) {
            handleNavigateWithPrompt(tab as NavTab, prompt);
          } else {
            setActiveTab(tab as NavTab);
          }
        }}
        onTriggerScan={handleTriggerScan}
        onOpenVoiceQuery={handleOpenVoiceQuery}
      />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alerts.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          channelFilter={channelFilter}
          setChannelFilter={setChannelFilter}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          alerts={alerts}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          availableProjects={availableProjects}
          availableChannels={availableChannels}
          onOpenVoiceQuery={handleOpenVoiceQuery}
          onQuickAskAI={handleQuickAskAI}
          onNavigateToTab={(tab) => setActiveTab(tab as NavTab)}
          onTriggerScan={handleTriggerScan}
          onDismissAlert={handleDismissAlert}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto w-full min-w-0 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              onNavigateToTab={setActiveTab}
              onTriggerAIAnalysis={() => setActiveTab('insights')}
            />
          )}

          {activeTab === 'chat' && (
            <AIChatView
              initialPrompt={initialChatPrompt}
              onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
            />
          )}

          {activeTab === 'insights' && (
            <AIInsightsView />
          )}

          {activeTab === 'anomalies' && (
            <AnomalyDetectorView
              onNavigateToTab={(tab, prompt) => handleNavigateWithPrompt(tab as NavTab, prompt || '')}
              onRefreshAlerts={loadData}
            />
          )}

          {activeTab === 'upload' && (
            <CSVUploadView
              onUploadSuccess={loadData}
              onNavigateWithPrompt={(tab, prompt) => handleNavigateWithPrompt(tab as NavTab, prompt)}
            />
          )}

          {activeTab === 'crm' && (
            <CRMIntegrationView />
          )}

          {activeTab === 'ga' && (
            <GoogleAnalyticsView
              onNavigateWithPrompt={(tab, prompt) => handleNavigateWithPrompt(tab as NavTab, prompt)}
            />
          )}

          {activeTab === 'roi-cost' && (
            <ROICostSheetView
              onRefresh={loadData}
              onNavigateWithPrompt={(tab, prompt) => handleNavigateWithPrompt(tab as NavTab, prompt)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}

          {activeTab === 'admin' && (
            <AdminPanelView />
          )}

          {activeTab === 'data_management' && (
            <DataManagementView currentUser={user} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
