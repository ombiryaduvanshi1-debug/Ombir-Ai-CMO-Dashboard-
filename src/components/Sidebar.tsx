import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Upload,
  Workflow,
  Globe,
  FileSpreadsheet,
  ShieldCheck,
  LogOut,
  BrainCircuit,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  AlertTriangle,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'dashboard' | 'chat' | 'insights' | 'anomalies' | 'data-management' | 'upload' | 'crm' | 'ga' | 'roi-cost' | 'reports' | 'admin';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  alertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, alertCount = 0 }) => {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Sales, Funnel & ROI Analytics'
    },
    {
      id: 'chat' as NavTab,
      label: 'AI CMO Advisor Chat',
      icon: MessageSquare,
      badge: 'Live',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      description: 'Conversational LLM Strategy'
    },
    {
      id: 'insights' as NavTab,
      label: 'AI Insights Engine',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      description: 'Auto Trends & Strategic Audit'
    },
    {
      id: 'anomalies' as NavTab,
      label: 'Anomaly Detection',
      icon: AlertTriangle,
      badge: alertCount > 0 ? `${alertCount}` : 'Auto',
      badgeColor: alertCount > 0
        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 animate-pulse'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      description: 'Spikes, Drops & Push Alerts'
    },
    {
      id: 'data-management' as NavTab,
      label: 'Data Management',
      icon: Database,
      badge: 'UDM',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-800',
      description: 'Unified Data & AI Mapping Layer'
    },
    {
      id: 'upload' as NavTab,
      label: 'CSV Data Upload',
      icon: Upload,
      badge: null,
      description: 'Import & Auto Field Mapping'
    },
    {
      id: 'crm' as NavTab,
      label: 'CRM Integrations',
      icon: Workflow,
      badge: 'Sync',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      description: 'Salesforce & Zoho Live Sync'
    },
    {
      id: 'ga' as NavTab,
      label: 'Google Analytics 4',
      icon: Globe,
      badge: 'GA4',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      description: 'Web Streams, Events & Acquisition'
    },
    {
      id: 'roi-cost' as NavTab,
      label: 'ROI & Cost Sheet',
      icon: TrendingUp,
      badge: 'GA4/Cost',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      description: 'Campaign Cost, CPL & ROAS Matrix'
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports & Exports',
      icon: FileSpreadsheet,
      badge: null,
      description: 'PDF Briefs & Excel Downloads'
    },
    {
      id: 'admin' as NavTab,
      label: 'Admin Control Panel',
      icon: ShieldCheck,
      badge: isAdmin ? 'Admin' : 'Restricted',
      badgeColor: isAdmin
        ? 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800'
        : 'bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-800',
      description: 'User Roles & Activity Audit'
    }
  ];

  return (
    <aside className="w-72 bg-slate-900 text-slate-200 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base tracking-tight leading-tight flex items-center gap-1.5">
              Ombir AI CMO Dashboard
            </h1>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase mt-0.5">
              Strategic Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Main Workspace
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isRestricted = item.id === 'admin' && !isAdmin;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-left ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-md shadow-indigo-600/20 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold tracking-tight truncate flex items-center gap-1.5">
                    {item.label}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-white/20 text-white border-white/30'
                      : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sync Status Banner */}
      <div className="px-4 py-3 mx-3 mb-3 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="text-[11px]">
            <p className="font-semibold text-slate-200">Salesforce & CRM Active</p>
            <p className="text-[10px] text-slate-400">Live Auto-Sync (15m)</p>
          </div>
        </div>
        <TrendingUp className="w-4 h-4 text-emerald-400" />
      </div>

      {/* Current User Profile Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={user?.avatar || '/ombir_photo.svg'}
            alt={user?.name || 'Ombir Yadav'}
            className="w-9 h-9 rounded-full object-cover border border-indigo-500/40 ring-2 ring-slate-800 shrink-0 bg-slate-800"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {user?.role}
              </span>
              <span className="text-[10px] text-slate-500 truncate">{user?.email}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
