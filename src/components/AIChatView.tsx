import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Mic,
  MicOff,
  RefreshCw,
  Zap,
  Check,
  ChevronRight,
  BrainCircuit,
  MessageSquare,
  Upload,
  Database,
  FileSpreadsheet,
  X,
  FileText,
  Table,
  HelpCircle,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  FileCode,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { ChatMessage } from '../types';
import { api } from '../lib/api';

interface AIChatViewProps {
  initialPrompt?: string;
  onOpenLiveVoice?: () => void;
}

const CHART_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#14b8a6'  // Teal
];

const SAMPLE_DATABASE_PRESETS = [
  {
    id: 'leads',
    title: '📊 Raw Inbound Leads Database (CSV)',
    subtitle: '14,850 leads with source, presales status & site visits',
    fileName: 'raw_inbound_leads_2026.csv',
    content: `lead_id,source,presales_status,sales_status,site_visit_done,project_name,created_at
LD-1001,Google Ads,Qualified,Pushed to Sales,Yes,Grand Residency Tower A,2026-08-01
LD-1002,Meta Ads,Unqualified,Dropped,No,Skyline Urban Oasis,2026-08-01
LD-1003,Organic SEO,Qualified,Site Visit Done,Yes,Horizon Tech Park,2026-08-02
LD-1004,LinkedIn,Qualified,Pushed to Lost,No,Apex Luxury Heights,2026-08-02
LD-1005,Email Nurture,Qualified,Booked,Yes,Grand Residency Tower A,2026-08-03
LD-1006,Google Ads,Unqualified,Dropped,No,Pinnacle Business Bay,2026-08-03
LD-1007,Meta Ads,Qualified,Pushed to Lost,Yes,Skyline Urban Oasis,2026-08-04
LD-1008,Organic SEO,Qualified,Booked,Yes,Grand Residency Tower A,2026-08-04
LD-1009,Referral,Qualified,Site Visit Done,Yes,Apex Luxury Heights,2026-08-05
LD-1010,Google Ads,Qualified,Pushed to Lost,No,Pinnacle Business Bay,2026-08-05`
  },
  {
    id: 'lost_leads',
    title: '🏢 Project-Wise & Team Lost Leads Database (CSV)',
    subtitle: '2,840 lost leads with assigned SM, reason & site visit history',
    fileName: 'sales_lost_leads_raw.csv',
    content: `lead_id,project_name,assigned_sales_manager,site_visit_done,lost_reason,revenue_loss_inr
LST-201,Grand Residency Tower A,Ombir Yadav,Yes,Pricing / High Unit Cost vs Market,₹8500000
LST-202,Skyline Urban Oasis,Alex Rivera,No,Selected Direct Competitor,₹7200000
LST-203,Horizon Tech Park,Marcus Vance,Yes,Product Feature / Layout Gap,₹5500000
LST-204,Apex Luxury Heights,Priya Sharma,No,Pricing / High Unit Cost vs Market,₹9800000
LST-205,Pinnacle Business Bay,David Chen,Yes,Internal Budget Freeze / Cancelled,₹8000000
LST-206,Grand Residency Tower A,Ombir Yadav,No,Location / Commute Concerns,₹8500000
LST-207,Skyline Urban Oasis,Priya Sharma,Yes,Unresponsive / Lead Dropped Off,₹7200000
LST-208,Horizon Tech Park,Alex Rivera,Yes,Selected Direct Competitor,₹5500000`
  },
  {
    id: 'campaigns',
    title: '💰 Campaign Performance & Spend Raw Export (JSON)',
    subtitle: 'Detailed JSON payload of campaign spend (₹), ROI & CAC (₹)',
    fileName: 'campaign_spend_performance.json',
    content: JSON.stringify([
      { campaign: "Q3 High-Intent Search", channel: "Google Ads", spend_inr: 1840000, revenue_inr: 7912000, leads: 840, conversions: 58, cac_inr: 31720 },
      { campaign: "Meta Retargeting V2", channel: "Meta Ads", spend_inr: 1420000, revenue_inr: 4970000, leads: 620, conversions: 31, cac_inr: 45800 },
      { campaign: "B2B Decision Makers", channel: "LinkedIn", spend_inr: 2100000, revenue_inr: 8820000, leads: 480, conversions: 42, cac_inr: 50000 },
      { campaign: "Organic Blog SEO", channel: "Organic SEO", spend_inr: 450000, revenue_inr: 3600000, leads: 950, conversions: 64, cac_inr: 7030 },
      { campaign: "VIP Email Newsletter", channel: "Email Nurture", spend_inr: 120000, revenue_inr: 2880000, leads: 1100, conversions: 78, cac_inr: 1530 }
    ], null, 2)
  }
];

export const AIChatView: React.FC<AIChatViewProps> = ({ initialPrompt, onOpenLiveVoice }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ fileName: string; content: string; recordCount?: number } | null>(null);
  const [activeDataset, setActiveDataset] = useState<{ fileName: string; recordCount: number; sampleRows?: any[] } | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const defaultSuggestions = [
    'Prepare a campaign ROI breakdown table from database',
    'Which project has the highest lost leads and why?',
    'Analyze site visit conversion rates across channels with pie chart',
    'Provide a CAC vs LTV optimization report'
  ];

  const loadHistory = async () => {
    try {
      const history = await api.getChatHistory();
      setMessages(history);
      const active = await api.getActiveDataset();
      setActiveDataset(active);
    } catch (e) {
      console.error('Failed to load chat history or active dataset', e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let contentText = '';
      let recordCount = 0;
      const fileName = file.name;
      const lower = fileName.toLowerCase();

      if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        contentText = XLSX.utils.sheet_to_csv(worksheet);
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
        recordCount = rows.length;
      } else if (lower.endsWith('.json')) {
        const text = await file.text();
        contentText = text;
        try {
          const parsed = JSON.parse(text);
          recordCount = Array.isArray(parsed) ? parsed.length : 1;
        } catch {
          recordCount = 1;
        }
      } else {
        const text = await file.text();
        contentText = text;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        recordCount = lines.length > 1 ? lines.length - 1 : lines.length;
      }

      setAttachedFile({
        fileName,
        content: contentText,
        recordCount
      });
      setShowPresets(false);
    } catch (err) {
      console.error('File read error:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string || '';
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        setAttachedFile({
          fileName: file.name,
          content: text,
          recordCount: lines.length > 1 ? lines.length - 1 : lines.length
        });
        setShowPresets(false);
      };
      reader.readAsText(file);
    }
  };

  const handleSelectPreset = (preset: typeof SAMPLE_DATABASE_PRESETS[0]) => {
    const lines = preset.content.split('\n').filter(l => l.trim().length > 0);
    setAttachedFile({
      fileName: preset.fileName,
      content: preset.content,
      recordCount: lines.length > 1 ? lines.length - 1 : lines.length
    });
    setShowPresets(false);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const currentAttached = attachedFile;
    setInput('');
    setAttachedFile(null); // Clear input attachment after send
    setIsLoading(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
      attachment: currentAttached ? {
        fileName: currentAttached.fileName,
        recordCount: currentAttached.recordCount,
        sampleText: currentAttached.content.substring(0, 100)
      } : undefined
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const responseMsg = await api.sendChatMessage(query, currentAttached || undefined);
      setMessages(prev => [...prev.filter(m => !m.id.startsWith('temp-')), tempUserMsg, responseMsg]);
    } catch (err) {
      console.error('Failed to send chat message', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'I encountered an error analyzing your uploaded raw database with Gemini. Please retry or check file format.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Web Speech Recognition Integration
  const toggleVoiceInput = () => {
    setSpeechNotice(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechNotice('Speech recognition is not supported by your browser. Please type your query directly.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechNotice(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event?.error || event);
        setIsListening(false);
        const errType = event?.error;
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setSpeechNotice('Microphone / speech recognition permission was denied or restricted in browser. You can type your query directly.');
        } else if (errType === 'no-speech') {
          setSpeechNotice('No speech was detected. Please speak clearly into your microphone.');
        } else if (errType === 'audio-capture') {
          setSpeechNotice('No microphone hardware was detected or audio capture failed.');
        } else if (errType === 'network') {
          setSpeechNotice('Network error occurred during speech recognition. Please type your query.');
        } else if (errType !== 'aborted') {
          setSpeechNotice('Speech recognition encountered an error. You can type your query directly.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
      setSpeechNotice('Could not start microphone dictation. Please type your query directly.');
    }
  };

  // Render embedded charts (Pie Chart, Bar Chart, KPI Cards) inside message bubble
  const renderMessageCharts = (chartData?: ChatMessage['chartData']) => {
    if (!chartData) return null;

    return (
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
        {/* KPI Summary Cards */}
        {chartData.kpiCards && chartData.kpiCards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {chartData.kpiCards.map((kpi, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{kpi.label}</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{kpi.value}</div>
                {kpi.change && (
                  <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">{kpi.change}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pie Charts Grid */}
        {chartData.pieCharts && chartData.pieCharts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chartData.pieCharts.map((pie, pIdx) => (
              <div key={pIdx} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <PieChartIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{pie.title}</span>
                </h4>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pie.data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        paddingAngle={3}
                      >
                        {pie.data.map((_, entryIdx) => (
                          <Cell key={`cell-${entryIdx}`} fill={CHART_COLORS[entryIdx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${val}%`, 'Share']}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Pie Legend */}
                <div className="mt-1 grid grid-cols-2 gap-1 text-[10px]">
                  {pie.data.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[itemIdx % CHART_COLORS.length] }}></span>
                        <span className="truncate">{item.name}</span>
                      </span>
                      <strong className="font-semibold ml-1">{item.value}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bar Charts */}
        {chartData.barCharts && chartData.barCharts.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {chartData.barCharts.map((bar, bIdx) => (
              <div key={bIdx}>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{bar.title}</span>
                </h4>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bar.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
                      <Bar dataKey="revenue" name="Revenue (₹ Lakhs)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="leads" name="Leads" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper to render Markdown text with Table support nicely
  const renderMessageText = (text: string) => {
    // Check if message contains markdown table
    if (text.includes('|') && text.includes('---')) {
      const lines = text.split('\n');
      const elements: React.ReactNode[] = [];
      let currentTableLines: string[] = [];
      let inTable = false;

      lines.forEach((line, index) => {
        const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');

        if (isTableLine) {
          inTable = true;
          currentTableLines.push(line);
        } else {
          if (inTable && currentTableLines.length > 0) {
            // Render table accumulated so far
            elements.push(renderMarkdownTable(currentTableLines, `table-${index}`));
            currentTableLines = [];
            inTable = false;
          }
          elements.push(
            <p key={`line-${index}`} className="my-1 whitespace-pre-wrap">
              {formatInlineMarkdown(line)}
            </p>
          );
        }
      });

      if (inTable && currentTableLines.length > 0) {
        elements.push(renderMarkdownTable(currentTableLines, `table-end`));
      }

      return <div className="space-y-1.5">{elements}</div>;
    }

    return <p className="whitespace-pre-wrap">{formatInlineMarkdown(text)}</p>;
  };

  const formatInlineMarkdown = (line: string) => {
    // Simple inline bold formatting (**bold**)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdownTable = (tableLines: string[], key: string) => {
    const rows = tableLines
      .filter(l => !l.includes('---'))
      .map(l => l.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1));

    if (rows.length === 0) return null;
    const header = rows[0];
    const body = rows.slice(1);

    return (
      <div key={key} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <tr>
              {header.map((col, idx) => (
                <th key={idx} className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2.5 text-slate-700 dark:text-slate-300 font-medium">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto h-[calc(100vh-5rem)] flex flex-col justify-between">
      {/* Hidden File Input (Accepts ANY file format: .csv, .xlsx, .xls, .json, .txt, .pdf, .xml, .ods, etc.) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="*"
        className="hidden"
      />

      {/* Header */}
      <div className="pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                AI Chief Marketing Officer Advisor
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Gemini 3.6 Flash Context
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ask strategic questions or command AI to analyze your live uploaded spreadsheets & CRM data.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLiveVoice && (
              <button
                onClick={onOpenLiveVoice}
                className="text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all border border-emerald-400/30 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
                <span>Live Voice Call</span>
              </button>
            )}

            <button
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sample Datasets</span>
            </button>

            <button
              onClick={loadHistory}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Active Live Dataset Badge */}
        {activeDataset && (
          <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-indigo-200 shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
              <span>
                Active Live Dataset Synced: <strong className="text-white">{activeDataset.fileName}</strong> ({activeDataset.recordCount.toLocaleString('en-IN')} rows)
              </span>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
              ⚡ Live Gemini Context
            </span>
          </div>
        )}
      </div>

      {/* Presets Modal / Drawer */}
      {showPresets && (
        <div className="my-3 p-4 bg-indigo-50/80 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2 uppercase tracking-wider">
              <Database className="w-4 h-4 text-indigo-600" /> Select Raw Database Preset to Attach
            </h3>
            <button onClick={() => setShowPresets(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_DATABASE_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group"
              >
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {preset.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {preset.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Conversation Scroll Area */}
      <div className="flex-1 overflow-y-auto my-4 space-y-5 pr-2 scrollbar-thin">
        {messages.map(msg => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isAI ? '' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isAI
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-3xl space-y-2 ${isAI ? '' : 'text-right'}`}>
                {/* User Attachment Chip */}
                {msg.attachment && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    isAI
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      : 'bg-indigo-700/60 border-indigo-400/30 text-white'
                  }`}>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attached DB: {msg.attachment.fileName}</span>
                    {msg.attachment.recordCount && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        {msg.attachment.recordCount} rows
                      </span>
                    )}
                  </div>
                )}

                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  isAI
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-medium inline-block text-left'
                }`}>
                  {renderMessageText(msg.text)}
                  {isAI && renderMessageCharts(msg.chartData)}
                </div>

                <div className="text-[10px] text-slate-400 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Suggestions / Follow-ups */}
                {isAI && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-1">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sug)}
                        className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700/60 transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {attachedFile ? `Analyzing attached raw database ${attachedFile.fileName} with Gemini...` : 'Analyzing live CRM & campaign metrics...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts if few messages */}
      {messages.length <= 2 && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Suggested Raw Database Queries
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {defaultSuggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug)}
                className="p-2.5 rounded-xl text-left text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 font-medium transition-all flex items-center justify-between group"
              >
                <span>{sug}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attached Raw File Preview Bar before Input */}
      {attachedFile && (
        <div className="mb-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                {attachedFile.fileName}
                {attachedFile.recordCount && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 font-semibold">
                    {attachedFile.recordCount} rows
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                Raw database attached! Ask any question or request a custom breakdown table.
              </p>
            </div>
          </div>

          <button
            onClick={() => setAttachedFile(null)}
            className="p-1 text-emerald-600 hover:text-rose-600 dark:text-emerald-400 dark:hover:text-rose-400 transition-colors"
            title="Detach File"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Speech Notice / Error Alert */}
      {speechNotice && (
        <div className="mb-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{speechNotice}</span>
          </div>
          <button
            onClick={() => setSpeechNotice(null)}
            className="p-1 text-amber-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="relative pt-2">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg"
        >
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Any Data File (Excel .xlsx, CSV, JSON, TXT, PDF, XML, etc.)"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all flex items-center gap-1 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span className="text-[11px] font-semibold hidden sm:inline">Attach Data File</span>
          </button>

          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop Listening' : 'Voice Input'}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              attachedFile
                ? `Ask anything about ${attachedFile.fileName} (e.g. "Prepare ROI comparison table")...`
                : isListening
                ? 'Listening to your query...'
                : 'Ask AI CMO Advisor or upload a raw database...'
            }
            className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 px-2"
          />

          <button
            type="submit"
            disabled={(!input.trim() && !attachedFile) || isLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

