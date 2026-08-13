import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Upload,
  Workflow,
  BarChart2,
  FileText,
  Shield,
  ArrowRight,
  User,
  Building,
  DollarSign,
  Zap,
  Mic,
  Clock,
  CheckCircle2,
  X,
  FileSpreadsheet,
  CornerDownLeft,
  ChevronRight,
  Sliders,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { CRMRecord, ChatMessage, ExecutiveReport, CommandSearchResult } from '../types';
import { api } from '../lib/api';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string, prompt?: string) => void;
  onTriggerScan?: () => void;
  onOpenVoiceQuery?: () => void;
}

type CategoryFilter = 'all' | 'crm' | 'chat' | 'reports' | 'navigation' | 'actions';

interface NavItemOption {
  id: string;
  tab: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

interface ActionOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
}

interface ReportSectionOption {
  id: string;
  title: string;
  period: string;
  description: string;
  sectionKey?: string;
}

const QUICK_NAV_ITEMS: NavItemOption[] = [
  {
    id: 'nav-dash',
    tab: 'dashboard',
    title: 'Executive CMO Dashboard',
    description: 'Revenue trends, ROI analysis, CAC, and channel breakdowns',
    icon: LayoutDashboard,
    badge: 'Core'
  },
  {
    id: 'nav-chat',
    tab: 'chat',
    title: 'AI CMO Co-Pilot & Chat',
    description: 'Ask questions, query raw marketing data, and execute strategic prompts',
    icon: MessageSquare,
    badge: 'AI'
  },
  {
    id: 'nav-insights',
    tab: 'insights',
    title: 'AI Strategic Audit & Trends',
    description: 'Automated deep audits, channel optimizations, and budget recommendations',
    icon: Sparkles,
    badge: 'AI'
  },
  {
    id: 'nav-anomalies',
    tab: 'anomalies',
    title: 'Anomaly Detection System',
    description: 'Automated Z-score scanning, revenue drops, and CAC spike alerts',
    icon: AlertTriangle,
    badge: 'Alerts'
  },
  {
    id: 'nav-upload',
    tab: 'upload',
    title: 'CSV / Excel & Data Upload',
    description: 'Upload custom dataset files, map columns, or connect Google Sheets',
    icon: Upload,
    badge: 'Data'
  },
  {
    id: 'nav-crm',
    tab: 'crm',
    title: 'CRM Connectors & Pipeline Sync',
    description: 'Salesforce, Zoho, HubSpot REST API connectors and lead funnel sync',
    icon: Workflow,
    badge: 'CRM'
  },
  {
    id: 'nav-ga',
    tab: 'ga',
    title: 'Google Analytics 4 Realtime',
    description: 'Realtime active users, traffic acquisition sources, and landing page conversions',
    icon: BarChart2,
    badge: 'GA4'
  },
  {
    id: 'nav-reports',
    tab: 'reports',
    title: 'Executive Reports & PDF Audits',
    description: 'Team performance reports, presales member audits, and project ROI matrices',
    icon: FileText,
    badge: 'PDF'
  },
  {
    id: 'nav-admin',
    tab: 'admin',
    title: 'Admin User Management & Settings',
    description: 'Role access, password resets, SMTP configuration, and security logs',
    icon: Shield,
    badge: 'Admin'
  }
];

const PRESET_REPORT_SECTIONS: ReportSectionOption[] = [
  {
    id: 'rep-sec-1',
    title: 'Q3 Executive Growth & CMO Summary Report',
    period: 'Q3 2026',
    description: 'Overview of $378.3K total revenue, 4.4x aggregate ROI, and top performing channels.'
  },
  {
    id: 'rep-sec-2',
    title: 'Presales Team Member Performance Audit',
    period: 'Monthly Team Audit',
    description: 'Individual presales representative lead assignments, site visit conversion rates, and call logs.',
    sectionKey: 'presales-audit'
  },
  {
    id: 'rep-sec-3',
    title: 'Sales Manager Lead Conversion & Revenue Breakdown',
    period: 'Quarterly Sales Breakdown',
    description: 'Manager-wise closed bookings, average ticket size, and target achievement percentages.',
    sectionKey: 'sales-manager-audit'
  },
  {
    id: 'rep-sec-4',
    title: 'Project-Wise Real Estate ROI Matrix',
    period: 'Aura Heights & Grand Skylight',
    description: 'Granular marketing spend vs INR revenue, lead pipeline, and bookings across real estate projects.',
    sectionKey: 'project-roi-matrix'
  },
  {
    id: 'rep-sec-5',
    title: 'Google Analytics 4 Realtime Web & App Traffic',
    period: 'Live Active Stream',
    description: 'GA4 real-time active users, organic SEO traffic sources, and event conversion values.',
    sectionKey: 'ga4-realtime'
  }
];

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onTriggerScan,
  onOpenVoiceQuery
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [crmRecords, setCrmRecords] = useState<CRMRecord[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [serverReports, setServerReports] = useState<ExecutiveReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await api.globalSearch('');
      setCrmRecords(res.crmRecords || []);
      setChatHistory(res.chatHistory || []);
      setServerReports(res.reports || []);
    } catch (err) {
      console.error('Failed to load command palette initial search data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform search query update
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.globalSearch(query);
        setCrmRecords(res.crmRecords || []);
        setChatHistory(res.chatHistory || []);
        if (res.reports && res.reports.length > 0) {
          setServerReports(res.reports);
        }
      } catch (err) {
        console.error('Error fetching command palette query search:', err);
      } finally {
        setIsLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Build combined items for rendering & keyboard navigation
  const qLower = query.trim().toLowerCase();

  // 1. Filtered CRM Records
  const filteredCRM = crmRecords.filter(item => {
    if (activeCategory !== 'all' && activeCategory !== 'crm') return false;
    if (!qLower) return true;
    return (
      item.name.toLowerCase().includes(qLower) ||
      item.statusOrStage.toLowerCase().includes(qLower) ||
      item.provider.toLowerCase().includes(qLower) ||
      (item.company && item.company.toLowerCase().includes(qLower)) ||
      (item.email && item.email.toLowerCase().includes(qLower)) ||
      (item.assignedTo && item.assignedTo.toLowerCase().includes(qLower))
    );
  });

  // 2. Filtered Chat History
  const filteredChat = chatHistory.filter(msg => {
    if (activeCategory !== 'all' && activeCategory !== 'chat') return false;
    if (!qLower) return true;
    return (
      msg.text.toLowerCase().includes(qLower) ||
      (msg.suggestions && msg.suggestions.some(s => s.toLowerCase().includes(qLower)))
    );
  });

  // 3. Filtered Reports & Sections
  const filteredReports = PRESET_REPORT_SECTIONS.filter(rep => {
    if (activeCategory !== 'all' && activeCategory !== 'reports') return false;
    if (!qLower) return true;
    return (
      rep.title.toLowerCase().includes(qLower) ||
      rep.period.toLowerCase().includes(qLower) ||
      rep.description.toLowerCase().includes(qLower)
    );
  });

  // 4. Filtered Quick Navigation
  const filteredNav = QUICK_NAV_ITEMS.filter(nav => {
    if (activeCategory !== 'all' && activeCategory !== 'navigation') return false;
    if (!qLower) return true;
    return (
      nav.title.toLowerCase().includes(qLower) ||
      nav.description.toLowerCase().includes(qLower) ||
      nav.badge?.toLowerCase().includes(qLower)
    );
  });

  // 5. Actions
  const ACTIONS_LIST: ActionOption[] = [
    {
      id: 'act-scan',
      title: 'Run Instant Anomaly Detection Scan',
      description: 'Trigger statistical Z-score audit across revenue, CAC, and lead conversion rates',
      icon: AlertTriangle,
      action: () => {
        if (onTriggerScan) onTriggerScan();
        onNavigateToTab('anomalies');
      }
    },
    {
      id: 'act-voice',
      title: 'Open Gemini AI Live Voice Assistant',
      description: 'Start hands-free real-time conversational marketing speech co-pilot',
      icon: Mic,
      action: () => {
        if (onOpenVoiceQuery) onOpenVoiceQuery();
      }
    },
    {
      id: 'act-sf-sync',
      title: 'Sync Salesforce CRM Pipeline',
      description: 'Pull latest leads, qualified opportunities, and deals from Salesforce Cloud',
      icon: Workflow,
      action: () => {
        onNavigateToTab('crm');
      }
    },
    {
      id: 'act-upload-csv',
      title: 'Upload CSV Dataset / Connect Google Sheet',
      description: 'Import custom marketing files or synchronize live Google Sheets URL',
      icon: FileSpreadsheet,
      action: () => {
        onNavigateToTab('upload');
      }
    },
    {
      id: 'act-report-gen',
      title: 'Generate Executive Marketing Report',
      description: 'Build a comprehensive executive summary PDF with AI strategic recommendations',
      icon: FileText,
      action: () => {
        onNavigateToTab('reports');
      }
    }
  ];

  const filteredActions = ACTIONS_LIST.filter(act => {
    if (activeCategory !== 'all' && activeCategory !== 'actions') return false;
    if (!qLower) return true;
    return (
      act.title.toLowerCase().includes(qLower) ||
      act.description.toLowerCase().includes(qLower)
    );
  });

  // Flatten all items for unified index calculation
  type UnifiedItem =
    | { kind: 'crm'; data: CRMRecord }
    | { kind: 'chat'; data: ChatMessage }
    | { kind: 'report'; data: ReportSectionOption }
    | { kind: 'nav'; data: NavItemOption }
    | { kind: 'action'; data: ActionOption };

  const unifiedList: UnifiedItem[] = [
    ...filteredNav.map(item => ({ kind: 'nav' as const, data: item })),
    ...filteredActions.map(item => ({ kind: 'action' as const, data: item })),
    ...filteredCRM.map(item => ({ kind: 'crm' as const, data: item })),
    ...filteredChat.map(item => ({ kind: 'chat' as const, data: item })),
    ...filteredReports.map(item => ({ kind: 'report' as const, data: item }))
  ];

  // Handle Keyboard Navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < unifiedList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : unifiedList.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (unifiedList.length > 0 && unifiedList[selectedIndex]) {
        executeItem(unifiedList[selectedIndex]);
      }
    }
  };

  const executeItem = (item: UnifiedItem) => {
    onClose();
    if (item.kind === 'nav') {
      onNavigateToTab(item.data.tab);
    } else if (item.kind === 'action') {
      item.data.action();
    } else if (item.kind === 'crm') {
      onNavigateToTab('crm');
    } else if (item.kind === 'chat') {
      onNavigateToTab('chat', item.data.text);
    } else if (item.kind === 'report') {
      onNavigateToTab('reports');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Box */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-indigo-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search CRM records, past AI chat history, report sections, or execute quick actions..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 mr-2 text-xs"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/30 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <button
            onClick={() => { setActiveCategory('all'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Results ({unifiedList.length})
          </button>
          <button
            onClick={() => { setActiveCategory('navigation'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCategory === 'navigation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Navigation ({filteredNav.length})</span>
          </button>
          <button
            onClick={() => { setActiveCategory('crm'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCategory === 'crm'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-3 h-3" />
            <span>CRM Records ({filteredCRM.length})</span>
          </button>
          <button
            onClick={() => { setActiveCategory('chat'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCategory === 'chat'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>AI Chat ({filteredChat.length})</span>
          </button>
          <button
            onClick={() => { setActiveCategory('reports'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCategory === 'reports'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Reports ({filteredReports.length})</span>
          </button>
          <button
            onClick={() => { setActiveCategory('actions'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCategory === 'actions'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Actions ({filteredActions.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-3 space-y-4">
          {unifiedList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No records or results found matching "{query}"</p>
              <p className="text-xs opacity-75 mt-1">Try searching for "Salesforce", "CAC", "Aura Heights", "Presales", or "ROI"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {unifiedList.map((item, idx) => {
                const isSelected = idx === selectedIndex;

                if (item.kind === 'nav') {
                  const Icon = item.data.icon;
                  return (
                    <div
                      key={item.data.id}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                            <span>{item.data.title}</span>
                            {item.data.badge && (
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                {item.data.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] leading-snug ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.data.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80 shrink-0 ml-3">
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                }

                if (item.kind === 'action') {
                  const Icon = item.data.icon;
                  return (
                    <div
                      key={item.data.id}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                            <span>{item.data.title}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'}`}>
                              Action
                            </span>
                          </div>
                          <p className={`text-[11px] leading-snug ${isSelected ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.data.description}
                          </p>
                        </div>
                      </div>

                      <Zap className="w-4 h-4 opacity-70 shrink-0 ml-3" />
                    </div>
                  );
                }

                if (item.kind === 'crm') {
                  const rec = item.data;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'}`}>
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                            <span>{rec.name}</span>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
                              {rec.type} • {rec.provider}
                            </span>
                          </div>
                          <div className={`text-[11px] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 ${isSelected ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {rec.company && <span>Company: {rec.company}</span>}
                            <span>• Stage: {rec.statusOrStage}</span>
                            {rec.assignedTo && <span>• Rep: {rec.assignedTo}</span>}
                          </div>
                        </div>
                      </div>

                      {rec.valueINR && (
                        <div className="text-right shrink-0 ml-3">
                          <span className={`font-mono font-bold text-xs ${isSelected ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                            ₹{rec.valueINR.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.kind === 'chat') {
                  const msg = item.data;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                            <span className="line-clamp-1">{msg.text}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'}`}>
                              Chat History
                            </span>
                          </div>
                          <p className={`text-[11px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <CornerDownLeft className="w-3.5 h-3.5 opacity-70 shrink-0 ml-3" />
                    </div>
                  );
                }

                if (item.kind === 'report') {
                  const rep = item.data;
                  return (
                    <div
                      key={rep.id}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                            <span>{rep.title}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'}`}>
                              {rep.period}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-snug line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {rep.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 opacity-70 shrink-0 ml-3" />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* Footer Status & Keyboard Navigation Guide */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-[10px]">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-[10px]">↵</kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-[10px]">ESC</kbd>
              <span>Close</span>
            </span>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>CMO Global Command Center</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function Compass(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
