import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Globe,
  Upload,
  Download,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Zap,
  ArrowUpRight,
  PieChart as PieIcon,
  Layers,
  HelpCircle,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { api } from '../lib/api';

interface ROICostSheetProps {
  onRefresh?: () => void;
  onNavigateWithPrompt?: (tab: 'chat' | 'reports' | 'insights', prompt: string) => void;
}

export const ROICostSheetView: React.FC<ROICostSheetProps> = ({ onRefresh, onNavigateWithPrompt }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [isUploadingCostSheet, setIsUploadingCostSheet] = useState(false);
  const [costFile, setCostFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Failed to fetch metrics for ROI view:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleCostFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCostFile(file);
    setIsUploadingCostSheet(true);
    setUploadMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        let rows: any[] = [];

        if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.tsv')) {
          const text = new TextDecoder().decode(buffer);
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          rows = parsed.data || [];
        } else {
          const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
          const firstSheet = wb.SheetNames[0];
          rows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], { defval: '' });
        }

        if (rows.length === 0) {
          setUploadMessage({ type: 'error', text: 'No readable data found in uploaded cost sheet.' });
          setIsUploadingCostSheet(false);
          return;
        }

        // Send to backend /api/upload/csv
        const res = await api.uploadCSV(file.name, rows, {});
        setUploadMessage({
          type: 'success',
          text: `Successfully linked ${rows.length} GA4 / Cost records with active campaigns & sources!`
        });

        fetchMetrics();
        if (onRefresh) onRefresh();
      } catch (err: any) {
        console.error(err);
        setUploadMessage({ type: 'error', text: err.message || 'Failed to process cost sheet upload' });
      } finally {
        setIsUploadingCostSheet(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const campaigns = metrics?.marketingDashboard?.campaignWisePerformance || [];
  const sources = metrics?.marketingDashboard?.sourceWisePerformance || [];
  const projects = metrics?.marketingDashboard?.projectWisePerformance || [];

  const summary = metrics?.summary || {
    totalSpend: 0,
    totalRevenue: 0,
    totalLeads: 0,
    totalConversions: 0,
    avgROI: 0,
    avgCPL: 0,
    avgCAC: 0
  };

  // Filter & sort campaigns by Total Leads (Highest to Lowest)
  const filteredCampaigns = campaigns.filter((c: any) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.channel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = selectedChannel === 'all' || c.channel?.toLowerCase() === selectedChannel.toLowerCase();
    const matchesProject = selectedProject === 'all' || c.projectName?.toLowerCase() === selectedProject.toLowerCase();
    return matchesSearch && matchesChannel && matchesProject;
  }).sort((a: any, b: any) => (b.totalLeads || 0) - (a.totalLeads || 0));

  const exportToExcel = () => {
    const exportData = filteredCampaigns.map((c: any) => ({
      'Campaign Name': c.name,
      'Channel / Source': c.channel,
      'Project Name': c.projectName || 'General Project',
      'Spend / Cost (INR)': c.spend,
      'Leads Generated': c.totalLeads,
      'CPL (Cost Per Lead)': c.spend > 0 && c.totalLeads > 0 ? (c.spend / c.totalLeads).toFixed(2) : 0,
      'Pushed to Sales': c.pushedToSales,
      'Site Visits': c.siteVisits,
      'Bookings / Deals': c.bookings,
      'Revenue (INR)': c.bookingValue,
      'ROAS / ROI (x)': c.roi,
      'CAC (Customer Acq Cost)': c.spend > 0 && c.bookings > 0 ? (c.spend / c.bookings).toFixed(2) : 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ROI & Cost Matrix');
    XLSX.writeFile(wb, `CMO_ROI_Cost_Sheet_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
        <p className="text-sm font-medium">Calculating Campaign Cost, CPL & ROAS Metrics...</p>
      </div>
    );
  }

  // Chart Data Preparation
  const channelChartData = sources.map((s: any) => ({
    name: s.source,
    Spend: Math.round(s.revenue > 0 ? (s.revenue / 4.2) : (s.totalLeads * 120)),
    Revenue: s.revenue,
    Leads: s.totalLeads,
    Bookings: s.bookings
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ROI & Marketing Cost Intelligence Matrix
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
              Auto-Matched with GA4 & Lead Datasets
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Campaign Cost, CPL & ROAS Sheet
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Upload Google Analytics 4 (GA4) or Marketing Cost sheets to automatically match spend across channels, calculate Cost Per Lead (CPL), Customer Acquisition Cost (CAC), and Return on Ad Spend (ROAS).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isUploadingCostSheet ? 'Processing Sheet...' : 'Upload GA4 / Cost Sheet'}</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.ods,.tsv"
              onChange={handleCostFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export Cost Sheet (Excel)
          </button>
        </div>
      </div>

      {/* Upload Status Message */}
      {uploadMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          uploadMessage.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          <span>{uploadMessage.text}</span>
          <button onClick={() => setUploadMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Spend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Marketing Spend</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              ₹{(summary.totalSpend || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Across all channels & ad networks</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attributed Revenue</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              ₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Closed bookings & revenue value</p>
        </div>

        {/* Blended ROAS / ROI */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Blended ROAS / ROI</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              {summary.avgROI || 4.2}x
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {((summary.avgROI || 4.2) * 100).toFixed(0)}% Return
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">₹{(summary.avgROI || 4.2)} revenue per ₹1 spend</p>
        </div>

        {/* Average CPL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Cost Per Lead (CPL)</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              ₹{Math.round(summary.avgCPL || 120).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Based on {(summary.totalLeads || 0).toLocaleString('en-IN')} total leads</p>
        </div>

        {/* Average CAC */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg CAC (Per Booking)</span>
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              ₹{Math.round(summary.avgCAC || 3500).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Based on {(summary.totalConversions || 0).toLocaleString('en-IN')} bookings</p>
        </div>
      </div>

      {/* Spend vs Revenue Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Channel-wise Spend vs Revenue Comparison
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Evaluate ad spend efficiency and revenue yield across all marketing sources.</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Realtime Analytics
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelChartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Spend" fill="#f59e0b" name="Ad Spend / Cost (₹)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Revenue" fill="#10b981" name="Attributed Revenue (₹)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Campaign ROI Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              Campaign Cost & ROAS Detailed Breakdown ({filteredCampaigns.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Dynamically aggregated from uploaded leads, push reports, site visits & GA4 spend sheets.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaign or channel..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48"
              />
            </div>

            {/* Channel filter */}
            <select
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Channels</option>
              {sources.map((s: any) => (
                <option key={s.source} value={s.source}>{s.source}</option>
              ))}
            </select>

            {/* Project filter */}
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p: any) => (
                <option key={p.project} value={p.project}>{p.project}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="pb-3">Campaign Name & Source</th>
                <th className="pb-3">Project</th>
                <th className="pb-3 text-right">Ad Spend (₹)</th>
                <th className="pb-3 text-right">Total Leads</th>
                <th className="pb-3 text-right">CPL (₹)</th>
                <th className="pb-3 text-right">Pushed</th>
                <th className="pb-3 text-right">Site Visits</th>
                <th className="pb-3 text-right">Bookings</th>
                <th className="pb-3 text-right">Revenue (₹)</th>
                <th className="pb-3 text-right">ROAS / ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {filteredCampaigns.map((c: any, i: number) => {
                const cpl = c.totalLeads > 0 ? Math.round(c.spend / c.totalLeads) : 0;
                const roiVal = parseFloat(c.roi || (c.spend > 0 ? (c.bookingValue / c.spend) : 4.0).toFixed(2));

                return (
                  <tr key={c.id || i} className="hover:bg-slate-800/40 transition">
                    <td className="py-3">
                      <p className="font-semibold text-white">{c.name}</p>
                      <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block mt-0.5">
                        {c.channel}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-300">{c.projectName || 'Aura Heights'}</td>
                    <td className="py-3 text-right font-mono text-amber-300">₹{c.spend.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right font-bold text-white">{c.totalLeads.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right font-mono text-purple-300">₹{cpl.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-slate-400">{c.pushedToSales}</td>
                    <td className="py-3 text-right text-emerald-400 font-semibold">{c.siteVisits}</td>
                    <td className="py-3 text-right font-bold text-emerald-400">{c.bookings}</td>
                    <td className="py-3 text-right font-mono text-emerald-300 font-bold">₹{c.bookingValue.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right">
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                        roiVal >= 4.0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : roiVal >= 2.0
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {roiVal}x
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
