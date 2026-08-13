import React, { useState } from 'react';
import {
  Search,
  Bell,
  Calendar,
  Filter,
  Building2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Mic,
  UserCheck,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { PerformanceAlert } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  channelFilter: string;
  setChannelFilter: (channel: string) => void;
  projectFilter: string;
  setProjectFilter: (project: string) => void;
  alerts: PerformanceAlert[];
  onRefresh: () => void;
  isRefreshing: boolean;
  availableProjects?: string[];
  availableChannels?: string[];
  onOpenVoiceQuery?: () => void;
  onQuickAskAI?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onTriggerScan?: () => void;
  onDismissAlert?: (id: string) => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dateFilter,
  setDateFilter,
  channelFilter,
  setChannelFilter,
  projectFilter,
  setProjectFilter,
  alerts,
  onRefresh,
  isRefreshing,
  availableProjects = [],
  availableChannels = [],
  onOpenVoiceQuery,
  onQuickAskAI,
  onNavigateToTab,
  onTriggerScan,
  onDismissAlert,
  onOpenCommandPalette
}) => {
  const { user, login } = useAuth();
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const defaultProjects = [
    'MERLIN GROUP CORPORATE (KOLKATA)',
    'MERLIN AQUAVILLE',
    'MERLIN X',
    'Rise Reloaded',
    'SERENIA',
    'MERLIN IVY',
    'F RESIDENCES',
    'General Project'
  ];
  // Prioritize uploaded projects if available
  const projectList = React.useMemo(() => {
    const raw = availableProjects.length > 0 ? availableProjects : defaultProjects;
    return Array.from(new Set(raw)).filter(Boolean);
  }, [availableProjects]);

  const defaultChannels = [
    'Google Ads',
    'Meta Ads',
    'LinkedIn',
    'Organic SEO',
    'Email Nurture',
    'Salesforce CRM'
  ];
  const channelList = React.useMemo(() => {
    return Array.from(new Set([...defaultChannels, ...availableChannels])).filter(Boolean);
  }, [availableChannels]);

  // Parse currently selected project array
  const selectedProjectArray = React.useMemo(() => {
    if (!projectFilter || projectFilter === 'all') return [];
    return projectFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }, [projectFilter]);

  const isAllProjectsSelected = selectedProjectArray.length === 0 || projectFilter === 'all';

  const handleToggleProject = (projName: string) => {
    if (projName === 'all') {
      setProjectFilter('all');
      return;
    }
    const target = projName.toLowerCase().trim();
    let updated: string[];

    if (selectedProjectArray.includes(target)) {
      updated = selectedProjectArray.filter(p => p !== target);
    } else {
      updated = [...selectedProjectArray, target];
    }

    if (updated.length === 0) {
      setProjectFilter('all');
    } else {
      setProjectFilter(updated.join(','));
    }
  };

  const handleSelectAllProjects = () => {
    setProjectFilter('all');
  };

  const projectDisplayLabel = React.useMemo(() => {
    if (isAllProjectsSelected) return 'All Projects';
    if (selectedProjectArray.length === 1) {
      const found = projectList.find(p => p.toLowerCase().trim() === selectedProjectArray[0]);
      return found || selectedProjectArray[0];
    }
    return `${selectedProjectArray.length} Projects Selected`;
  }, [isAllProjectsSelected, selectedProjectArray, projectList]);

  const handleRoleSwitch = async () => {
    if (user?.role === 'admin') {
      await login('user@cmo.ai', 'user123');
    } else {
      await login('ombir@omangentic.com', '9836447541');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 shrink-0 sticky top-0 z-20 shadow-xs w-full max-w-full min-w-0 overflow-hidden">
      {/* Left: Search & Filter indicators */}
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xl">
        <button
          onClick={() => {
            if (onOpenCommandPalette) onOpenCommandPalette();
          }}
          className="w-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between transition-all shadow-inner group text-left cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
            <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-medium truncate text-xs">
              Search CRM records, AI chat, reports...
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 shrink-0 ml-1">
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right: Actions, Filters, Notifications, Role Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Quick Channel Filter */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 shrink-0" />
          <select
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 outline-none pr-1 py-0.5 cursor-pointer max-w-[100px] truncate"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Channels</option>
            {channelList.map(ch => (
              <option key={ch} value={ch.toLowerCase()} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{ch}</option>
            ))}
          </select>
        </div>

        {/* Multi-Select Project Selector */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              !isAllProjectsSelected
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/60 hover:bg-slate-200/70'
            }`}
            title="Filter Dashboard by Projects (Multi-Select)"
          >
            <Building2 className={`w-3.5 h-3.5 shrink-0 ${!isAllProjectsSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
            <span className="truncate max-w-[120px] sm:max-w-[160px] font-bold">{projectDisplayLabel}</span>
            {!isAllProjectsSelected && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                {selectedProjectArray.length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Multi-Select Dropdown Popover */}
          {isProjectDropdownOpen && (
            <div className="absolute right-0 sm:left-0 mt-2 w-72 sm:w-84 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 animate-in fade-in slide-in-from-top-2">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Filter by Project</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSelectAllProjects}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-1.5 py-0.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  >
                    Select All
                  </button>
                  {!isAllProjectsSelected && (
                    <button
                      onClick={() => setProjectFilter('all')}
                      className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => setIsProjectDropdownOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Search Box inside popover */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  placeholder="Search project name..."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Checkboxes List */}
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {/* All Projects Option */}
                <button
                  onClick={() => handleToggleProject('all')}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all text-left ${
                    isAllProjectsSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                      isAllProjectsSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isAllProjectsSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>All Projects</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">All Data</span>
                </button>

                {/* Individual Projects */}
                {projectList
                  .filter(p => p.toLowerCase().includes(projectSearch.toLowerCase()))
                  .map(proj => {
                    const checked = selectedProjectArray.includes(proj.toLowerCase());
                    return (
                      <button
                        key={proj}
                        onClick={() => handleToggleProject(proj)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all text-left ${
                          checked
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                            checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{proj}</span>
                        </div>
                      </button>
                    );
                  })}

                {projectList.filter(p => p.toLowerCase().includes(projectSearch.toLowerCase())).length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    No matching projects found
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isAllProjectsSelected ? 'All projects shown' : `${selectedProjectArray.length} of ${projectList.length} selected`}
                </span>
                <button
                  onClick={() => setIsProjectDropdownOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Report Period Selector: Compact select on small screens, tabs on lg screens */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
          
          {/* Dropdown for < lg screens */}
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="lg:hidden bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none py-0.5 pr-1 cursor-pointer"
          >
            <option value="daily" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Daily</option>
            <option value="monthly" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Monthly</option>
            <option value="quarterly" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Quarterly</option>
            <option value="yearly" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Yearly</option>
          </select>

          {/* Button pills for lg+ screens */}
          <div className="hidden lg:flex items-center gap-0.5">
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'quarterly', label: 'Quarterly' },
              { id: 'yearly', label: 'Yearly' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setDateFilter(p.id)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap ${
                  dateFilter === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh Live Data */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Sync & Refresh Metrics"
          className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
        </button>

        {/* Quick Voice Ask AI Button */}
        {onOpenVoiceQuery && (
          <button
            onClick={onOpenVoiceQuery}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold hover:border-indigo-400 transition-all shadow-xs shrink-0"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Voice</span>
          </button>
        )}

        {/* Notifications Alert Bell */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowAlertsDrawer(!showAlertsDrawer)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all relative shrink-0"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-xs">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Drawer */}
          {showAlertsDrawer && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Push Performance Alerts</span>
                </h3>

                <div className="flex items-center gap-2">
                  {onTriggerScan && (
                    <button
                      onClick={() => onTriggerScan()}
                      className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 text-[10px] font-bold hover:bg-indigo-100 transition-all flex items-center gap-1"
                      title="Run Anomaly Scan"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Scan</span>
                    </button>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {alerts.length} New
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No active performance alerts detected.
                  </div>
                ) : (
                  alerts.map(alt => (
                    <div
                      key={alt.id}
                      className={`p-3 rounded-xl border text-xs ${
                        alt.type === 'critical'
                          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                          : alt.type === 'positive'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                          : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span>{alt.title}</span>
                        <span className="text-[9px] opacity-70">{new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] opacity-90 leading-tight mb-2">{alt.message}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                        {alt.actionLabel && (
                          <button
                            onClick={() => {
                              setShowAlertsDrawer(false);
                              if (onQuickAskAI) onQuickAskAI();
                            }}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            {alt.actionLabel}
                          </button>
                        )}

                        {onDismissAlert && (
                          <button
                            onClick={() => onDismissAlert(alt.id)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {onNavigateToTab && (
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setShowAlertsDrawer(false);
                      onNavigateToTab('anomalies');
                    }}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Open Anomaly Detection Dashboard</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Role Switcher Button */}
        <button
          onClick={handleRoleSwitch}
          title={`Switch Role (Current: ${user?.role})`}
          className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shrink-0"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="whitespace-nowrap">Switch Role</span>
        </button>
      </div>
    </header>
  );
};
