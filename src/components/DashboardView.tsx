import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Globe2,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck,
  Send,
  XCircle,
  MapPin,
  Calendar,
  ShieldCheck,
  Activity,
  FileText,
  CheckSquare,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  Briefcase,
  ChevronRight,
  Percent,
  Mail,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
  ComposedChart,
  LineChart,
  Line,
  ReferenceLine,
  Brush
} from 'recharts';
import {
  SalesMetric,
  LeadFunnelStage,
  CampaignMetric,
  ChannelMetric,
  RegionalMetric,
  MarketingDashboardMetrics,
  DashboardSection
} from '../types';

interface DashboardViewProps {
  metrics: {
    sales: SalesMetric[];
    funnel: LeadFunnelStage[];
    campaigns: CampaignMetric[];
    channels: ChannelMetric[];
    regions: RegionalMetric[];
    summary: {
      totalRevenue: number;
      totalSpend: number;
      totalLeads: number;
      totalQualified: number;
      totalConversions: number;
      avgROI: number;
      avgCPL: number;
      avgCAC: number;
      pipelineValue: number;
    };
    marketingDashboard?: MarketingDashboardMetrics;
  } | null;
  dateFilter?: string;
  setDateFilter?: (filter: string) => void;
  onNavigateToTab: (tab: any) => void;
  onTriggerAIAnalysis: () => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

interface HistoricalTrendsChartProps {
  salesData: SalesMetric[];
  dateFilter?: string;
  setDateFilter?: (filter: string) => void;
}

export const HistoricalTrendsChart: React.FC<HistoricalTrendsChartProps> = ({ salesData, dateFilter, setDateFilter }) => {
  const [selectedRange, setSelectedRange] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>('daily');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');
  const [metricMode, setMetricMode] = useState<'leads_conversions' | 'revenue_trend' | 'conversion_rate' | 'cpl_cac' | 'multi_kpi'>('leads_conversions');
  const [chartViewType, setChartViewType] = useState<'pie' | 'trend'>('pie');
  const [showBrush, setShowBrush] = useState<boolean>(false);
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);

  // Sync date filter when user changes range or custom dates
  const handleRangeChange = (range: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom') => {
    setSelectedRange(range);
    if (!setDateFilter) return;
    if (range === 'daily' || range === 'monthly' || range === 'quarterly' || range === 'yearly') {
      setDateFilter(range);
    } else if (range === 'custom' && startDate && endDate) {
      setDateFilter(`${startDate}:${endDate}`);
    }
  };

  const handleCustomDateChange = (sDate: string, eDate: string) => {
    setStartDate(sDate);
    setEndDate(eDate);
    if (setDateFilter && selectedRange === 'custom' && sDate && eDate) {
      setDateFilter(`${sDate}:${eDate}`);
    }
  };

  const chartData = React.useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return [];
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '0';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch {
        return dateStr;
      }
    };

    if (selectedRange === 'daily') {
      return salesData
        .slice()
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .map(item => {
          const leads = item.leads || 0;
          const qualifiedLeads = item.qualifiedLeads || item.conversions || 0;
          const siteVisits = item.siteVisits || 0;
          const conversionRate = leads > 0 ? parseFloat(((qualifiedLeads / leads) * 100).toFixed(2)) : 0;
          const siteVisitConversionRate = qualifiedLeads > 0 ? parseFloat(((siteVisits / qualifiedLeads) * 100).toFixed(2)) : 0;
          return {
            ...item,
            displayDate: formatDate(item.date),
            leads,
            qualifiedLeads,
            siteVisits,
            conversionRate,
            siteVisitConversionRate,
            targetRevenue: Math.round((item.revenue || 0) * 1.1),
            cpl: leads > 0 && (item as any).spend ? Math.round(((item as any).spend || 0) / leads) : 0,
            cac: item.conversions > 0 && (item as any).spend ? Math.round(((item as any).spend || 0) / item.conversions) : 0,
          };
        });
    }

    if (selectedRange === 'weekly') {
      const weekMap = new Map<string, any>();
      salesData.forEach(item => {
        let label = item.date;
        try {
          const d = new Date(item.date);
          if (!isNaN(d.getTime())) {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            label = `W/o ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          }
        } catch {}

        if (!weekMap.has(label)) {
          weekMap.set(label, { date: label, displayDate: label, leads: 0, qualifiedLeads: 0, siteVisits: 0, conversions: 0, revenue: 0, spend: 0 });
        }
        const w = weekMap.get(label);
        w.leads += item.leads || 0;
        w.qualifiedLeads += item.qualifiedLeads || item.conversions || 0;
        w.siteVisits += item.siteVisits || 0;
        w.conversions += item.conversions || item.dealsClosed || 0;
        w.revenue += item.revenue || 0;
        w.spend += (item as any).spend || 0;
      });

      return Array.from(weekMap.values()).map(w => ({
        ...w,
        conversionRate: w.leads > 0 ? parseFloat(((w.qualifiedLeads / w.leads) * 100).toFixed(2)) : 0,
        siteVisitConversionRate: w.qualifiedLeads > 0 ? parseFloat(((w.siteVisits / w.qualifiedLeads) * 100).toFixed(2)) : 0,
        targetRevenue: Math.round(w.revenue * 1.1),
        cpl: w.leads > 0 && w.spend > 0 ? Math.round(w.spend / w.leads) : 0,
        cac: w.conversions > 0 && w.spend > 0 ? Math.round(w.spend / w.conversions) : 0,
      }));
    }

    if (selectedRange === 'monthly') {
      const monthMap = new Map<string, any>();
      salesData.forEach(item => {
        let label = item.date;
        try {
          const d = new Date(item.date);
          if (!isNaN(d.getTime())) {
            label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
        } catch {}

        if (!monthMap.has(label)) {
          monthMap.set(label, { date: label, displayDate: label, leads: 0, qualifiedLeads: 0, siteVisits: 0, conversions: 0, revenue: 0, spend: 0 });
        }
        const m = monthMap.get(label);
        m.leads += item.leads || 0;
        m.qualifiedLeads += item.qualifiedLeads || item.conversions || 0;
        m.siteVisits += item.siteVisits || 0;
        m.conversions += item.conversions || item.dealsClosed || 0;
        m.revenue += item.revenue || 0;
        m.spend += (item as any).spend || 0;
      });

      return Array.from(monthMap.values()).map(m => ({
        ...m,
        conversionRate: m.leads > 0 ? parseFloat(((m.qualifiedLeads / m.leads) * 100).toFixed(2)) : 0,
        siteVisitConversionRate: m.qualifiedLeads > 0 ? parseFloat(((m.siteVisits / m.qualifiedLeads) * 100).toFixed(2)) : 0,
        targetRevenue: Math.round(m.revenue * 1.1),
        cpl: m.leads > 0 && m.spend > 0 ? Math.round(m.spend / m.leads) : 0,
        cac: m.conversions > 0 && m.spend > 0 ? Math.round(m.spend / m.conversions) : 0,
      }));
    }

    if (selectedRange === 'quarterly') {
      const qtrMap = new Map<string, any>();
      salesData.forEach(item => {
        let label = item.date;
        try {
          const d = new Date(item.date);
          if (!isNaN(d.getTime())) {
            const q = Math.floor(d.getMonth() / 3) + 1;
            label = `Q${q} ${d.getFullYear()}`;
          }
        } catch {}

        if (!qtrMap.has(label)) {
          qtrMap.set(label, { date: label, displayDate: label, leads: 0, qualifiedLeads: 0, siteVisits: 0, conversions: 0, revenue: 0, spend: 0 });
        }
        const qObj = qtrMap.get(label);
        qObj.leads += item.leads || 0;
        qObj.qualifiedLeads += item.qualifiedLeads || item.conversions || 0;
        qObj.siteVisits += item.siteVisits || 0;
        qObj.conversions += item.conversions || item.dealsClosed || 0;
        qObj.revenue += item.revenue || 0;
        qObj.spend += (item as any).spend || 0;
      });

      return Array.from(qtrMap.values()).map(q => ({
        ...q,
        conversionRate: q.leads > 0 ? parseFloat(((q.qualifiedLeads / q.leads) * 100).toFixed(2)) : 0,
        siteVisitConversionRate: q.qualifiedLeads > 0 ? parseFloat(((q.siteVisits / q.qualifiedLeads) * 100).toFixed(2)) : 0,
        targetRevenue: Math.round(q.revenue * 1.1),
        cpl: q.leads > 0 && q.spend > 0 ? Math.round(q.spend / q.leads) : 0,
        cac: q.conversions > 0 && q.spend > 0 ? Math.round(q.spend / q.conversions) : 0,
      }));
    }

    if (selectedRange === 'yearly') {
      const yrMap = new Map<string, any>();
      salesData.forEach(item => {
        let label = item.date;
        try {
          const d = new Date(item.date);
          if (!isNaN(d.getTime())) {
            label = `FY ${d.getFullYear()}`;
          }
        } catch {}

        if (!yrMap.has(label)) {
          yrMap.set(label, { date: label, displayDate: label, leads: 0, qualifiedLeads: 0, siteVisits: 0, conversions: 0, revenue: 0, spend: 0 });
        }
        const yObj = yrMap.get(label);
        yObj.leads += item.leads || 0;
        yObj.qualifiedLeads += item.qualifiedLeads || item.conversions || 0;
        yObj.siteVisits += item.siteVisits || 0;
        yObj.conversions += item.conversions || item.dealsClosed || 0;
        yObj.revenue += item.revenue || 0;
        yObj.spend += (item as any).spend || 0;
      });

      return Array.from(yrMap.values()).map(y => ({
        ...y,
        conversionRate: y.leads > 0 ? parseFloat(((y.qualifiedLeads / y.leads) * 100).toFixed(2)) : 0,
        siteVisitConversionRate: y.qualifiedLeads > 0 ? parseFloat(((y.siteVisits / y.qualifiedLeads) * 100).toFixed(2)) : 0,
        targetRevenue: Math.round(y.revenue * 1.1),
        cpl: y.leads > 0 && y.spend > 0 ? Math.round(y.spend / y.leads) : 0,
        cac: y.conversions > 0 && y.spend > 0 ? Math.round(y.spend / y.conversions) : 0,
      }));
    }

    // Custom date range filtering
    const filtered = salesData.filter(item => {
      if (!item.date) return true;
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      return true;
    });

    return filtered.map(item => {
      const leads = item.leads || 0;
      const qualifiedLeads = item.qualifiedLeads || item.conversions || 0;
      const siteVisits = item.siteVisits || 0;
      const conversionRate = leads > 0 ? parseFloat(((qualifiedLeads / leads) * 100).toFixed(2)) : 0;
      const siteVisitConversionRate = qualifiedLeads > 0 ? parseFloat(((siteVisits / qualifiedLeads) * 100).toFixed(2)) : 0;
      return {
        ...item,
        displayDate: formatDate(item.date),
        leads,
        qualifiedLeads,
        siteVisits,
        conversionRate,
        siteVisitConversionRate,
        targetRevenue: Math.round((item.revenue || 0) * 1.1),
        cpl: leads > 0 && (item as any).spend ? Math.round(((item as any).spend || 0) / leads) : 0,
        cac: item.conversions > 0 && (item as any).spend ? Math.round(((item as any).spend || 0) / item.conversions) : 0,
      };
    });
  }, [salesData, selectedRange, startDate, endDate]);

  const totals = React.useMemo(() => {
    const totalLeads = chartData.reduce((acc, d) => acc + (d.leads || 0), 0);
    const totalPushed = chartData.reduce((acc, d) => acc + (d.qualifiedLeads || d.pushed || 0), 0);
    const totalSiteVisits = chartData.reduce((acc, d) => acc + (d.siteVisits || 0), 0);
    const totalConversions = chartData.reduce((acc, d) => acc + (d.conversions || 0), 0);
    const totalRevenue = chartData.reduce((acc, d) => acc + (d.revenue || 0), 0);
    const avgConvRate = totalLeads > 0 ? ((totalPushed / totalLeads) * 100).toFixed(2) : '0.00';
    const avgSiteVisitRate = totalPushed > 0 ? ((totalSiteVisits / totalPushed) * 100).toFixed(2) : '0.00';
    const avgCpl = chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + (d.cpl || 0), 0) / chartData.length) : 0;
    const avgCac = chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + (d.cac || 0), 0) / chartData.length) : 0;
    return { totalLeads, totalPushed, totalSiteVisits, totalConversions, totalRevenue, avgConvRate, avgSiteVisitRate, avgCpl, avgCac };
  }, [chartData]);

  const pieData = React.useMemo(() => {
    if (metricMode === 'revenue_trend') {
      const totalPushed = totals.totalPushed;
      const siteVisits = totals.totalSiteVisits;
      const pendingVisit = Math.max(0, totalPushed - siteVisits);
      return [
        { name: 'Site Visits Conducted', value: siteVisits, fill: '#f59e0b', percentage: totalPushed > 0 ? ((siteVisits / totalPushed) * 100).toFixed(1) : '0', actualCount: siteVisits, subtitle: `${siteVisits} visits conducted` },
        { name: 'Pushed (Awaiting Visit)', value: pendingVisit, fill: '#8b5cf6', percentage: totalPushed > 0 ? ((pendingVisit / totalPushed) * 100).toFixed(1) : '0', actualCount: pendingVisit, subtitle: `${pendingVisit} leads awaiting site visit` }
      ];
    } else if (metricMode === 'leads_conversions') {
      const totalLeads = totals.totalLeads;
      const totalPushed = totals.totalPushed;
      const unpushed = Math.max(0, totalLeads - totalPushed);
      return [
        { name: 'Leads Pushed to Sales', value: totalPushed, fill: '#8b5cf6', percentage: totalLeads > 0 ? ((totalPushed / totalLeads) * 100).toFixed(1) : '0', actualCount: totalPushed, subtitle: `${totalPushed} pushed to sales` },
        { name: 'Unpushed Presales Leads', value: unpushed, fill: '#6366f1', percentage: totalLeads > 0 ? ((unpushed / totalLeads) * 100).toFixed(1) : '0', actualCount: unpushed, subtitle: `${unpushed} presales leads` }
      ];
    } else if (metricMode === 'multi_kpi') {
      const totalLeads = totals.totalLeads;
      const totalPushed = totals.totalPushed;
      const totalVisits = totals.totalSiteVisits;
      const totalBookings = totals.totalConversions;

      const unpushed = Math.max(0, totalLeads - totalPushed);
      const awaitingVisit = Math.max(0, totalPushed - totalVisits);
      const awaitingBooking = Math.max(0, totalVisits - totalBookings);
      const bookings = totalBookings;

      return [
        {
          name: 'Presales (Unpushed)',
          value: unpushed,
          fill: '#6366f1',
          percentage: totalLeads > 0 ? ((unpushed / totalLeads) * 100).toFixed(1) : '0',
          actualCount: totals.totalLeads,
          subtitle: `Unpushed: ${unpushed.toLocaleString()} | Total Created: ${totals.totalLeads.toLocaleString()}`
        },
        {
          name: 'Pushed (Awaiting Visit)',
          value: awaitingVisit,
          fill: '#8b5cf6',
          percentage: totalLeads > 0 ? ((awaitingVisit / totalLeads) * 100).toFixed(1) : '0',
          actualCount: totals.totalPushed,
          subtitle: `In Sales: ${awaitingVisit.toLocaleString()} | Total Pushed: ${totals.totalPushed.toLocaleString()}`
        },
        {
          name: 'Site Visits Conducted',
          value: awaitingBooking,
          fill: '#f59e0b',
          percentage: totalLeads > 0 ? ((awaitingBooking / totalLeads) * 100).toFixed(1) : '0',
          actualCount: totals.totalSiteVisits,
          subtitle: `Visits Done: ${totals.totalSiteVisits.toLocaleString()} | Awaiting Booking: ${awaitingBooking.toLocaleString()}`
        },
        {
          name: 'Bookings Generated',
          value: bookings,
          fill: '#10b981',
          percentage: totalLeads > 0 ? ((bookings / totalLeads) * 100).toFixed(1) : '0',
          actualCount: totals.totalConversions,
          subtitle: `Closed Bookings: ${totals.totalConversions.toLocaleString()} units`
        }
      ];
    } else {
      const totalPushed = totals.totalPushed;
      const siteVisits = totals.totalSiteVisits;
      const pendingVisit = Math.max(0, totalPushed - siteVisits);
      return [
        { name: 'Site Visits Conducted', value: siteVisits, fill: '#f59e0b', percentage: totalPushed > 0 ? ((siteVisits / totalPushed) * 100).toFixed(1) : '0', actualCount: siteVisits, subtitle: `${siteVisits} site visits` },
        { name: 'Pushed (Awaiting Visit)', value: pendingVisit, fill: '#ec4899', percentage: totalPushed > 0 ? ((pendingVisit / totalPushed) * 100).toFixed(1) : '0', actualCount: pendingVisit, subtitle: `${pendingVisit} awaiting visit` }
      ];
    }
  }, [metricMode, totals]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
            <span>{label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold capitalize">
              {selectedRange} View
            </span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-medium">
              <span style={{ color: entry.color }} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-100">
                {entry.name.includes('Revenue') || entry.name.includes('Target')
                  ? `₹${Number(entry.value).toLocaleString('en-IN')}`
                  : entry.name.includes('Rate')
                  ? `${entry.value}%`
                  : entry.name.includes('CPL') || entry.name.includes('CAC')
                  ? `₹${Number(entry.value).toLocaleString('en-IN')}`
                  : entry.name.includes('ROI')
                  ? `${entry.value}x`
                  : Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header & Range Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Interactive Marketing Performance Trends
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Recharts KPI Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unified pipeline trends combining <strong>Lead Created Date</strong>, <strong>Assign to Sales Date</strong>, <strong>Site Visit Date</strong> & <strong>Booking Date</strong> across Daily, Weekly, Monthly, Quarterly, and Yearly timeframes.
          </p>
        </div>

        {/* Time Granularity Selector Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto max-w-full">
            {[
              { id: 'daily', label: '📆 Daily' },
              { id: 'weekly', label: '📅 Weekly' },
              { id: 'monthly', label: '📊 Monthly' },
              { id: 'quarterly', label: '📈 Quarterly' },
              { id: 'yearly', label: '🏆 Yearly' },
              { id: 'custom', label: '⚙️ Custom' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setSelectedRange(range.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedRange === range.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs if Custom is Selected */}
          {selectedRange === 'custom' && (
            <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-950/30 p-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-500">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-500">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Leads Created</div>
          <div className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            {totals.totalLeads.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Leads Pushed</div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {totals.totalPushed.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Push Rate %</div>
          <div className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">
            {totals.avgConvRate}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-slate-800/60 border border-cyan-100 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bookings</div>
          <div className="text-base font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
            {totals.totalConversions.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-slate-800/60 border border-amber-100 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue</div>
          <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 truncate">
            ₹{(totals.totalRevenue / 100000).toFixed(1)}L
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-50/60 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg CPL</div>
          <div className="text-base font-black text-sky-600 dark:text-sky-400 mt-0.5">
            ₹{totals.avgCpl}
          </div>
        </div>
      </div>

      {/* KPI Trendline Metric Selector & Interactive Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'leads_conversions', label: '📈 Leads Created vs Leads Pushed' },
            { id: 'revenue_trend', label: '📍 Leads Pushed vs Site Visits' },
            { id: 'conversion_rate', label: '⚡ Conversion Rate %' },
            { id: 'cpl_cac', label: '💵 CPL & CAC Efficiency' },
            { id: 'multi_kpi', label: '📊 Multi-KPI Overlay' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setMetricMode(mode.id as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap ${
                metricMode === mode.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Chart View Toggle & Feature Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartViewType('pie')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                chartViewType === 'pie'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Pie Chart</span>
            </button>
            <button
              onClick={() => setChartViewType('trend')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                chartViewType === 'trend'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Day-Wise Trend</span>
            </button>
          </div>

          {chartViewType === 'trend' && (
            <>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTargetLine}
                  onChange={(e) => setShowTargetLine(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Target Line</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBrush}
                  onChange={(e) => setShowBrush(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Zoom Slider</span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Main Interactive Recharts Chart Area */}
      <div className="h-[340px] w-full pt-2">
        {chartViewType === 'pie' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center h-full">
            {/* Pie Chart Canvas with Custom High-Visibility Slice Labels */}
            <div className="lg:col-span-7 h-72 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                    label={({ cx, cy, midAngle, outerRadius, name, value, percentage, fill, index }: any) => {
                      if (!value || value <= 0) return null;
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 26;
                      let x = cx + radius * Math.cos(-midAngle * RADIAN);
                      let y = cy + radius * Math.sin(-midAngle * RADIAN);

                      if (value < (totals.totalLeads * 0.15)) {
                        y += (index % 2 === 0 ? -10 : 10);
                      }

                      let displayLabel = name;
                      if (name.includes('Site Visits')) displayLabel = 'Site Visits';
                      else if (name.includes('Bookings')) displayLabel = 'Bookings';
                      else if (name.includes('Pushed')) displayLabel = 'Pushed';
                      else if (name.includes('Presales')) displayLabel = 'Presales';

                      return (
                        <text
                          x={x}
                          y={y}
                          fill={fill}
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-[11px] font-extrabold drop-shadow-xs"
                        >
                          {`${displayLabel}: ${Number(value).toLocaleString()} (${percentage}%)`}
                        </text>
                      );
                    }}
                    labelLine={({ points, value }: any) => {
                      if (!value || value <= 0) return null;
                      if (!points || points.length < 2) return null;
                      return <path d={`M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="2 2" />;
                    }}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} stroke="#ffffff" className="dark:stroke-slate-900" strokeWidth={2.5} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${Number(val).toLocaleString()} records (${item?.payload?.percentage || 0}%)`,
                      name
                    ]}
                  />
                  <Legend formatter={(val) => <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{val}</span>} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Overlay showing Total Actual Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {metricMode === 'revenue_trend' ? 'Total Pushed' : metricMode === 'leads_conversions' ? 'Total Leads' : 'Total Pipeline'}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {metricMode === 'revenue_trend'
                    ? totals.totalPushed.toLocaleString()
                    : metricMode === 'leads_conversions'
                    ? totals.totalLeads.toLocaleString()
                    : totals.totalLeads.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-emerald-500 mt-0.5">
                  {metricMode === 'revenue_trend'
                    ? `${totals.avgSiteVisitRate}% Visit Rate`
                    : metricMode === 'leads_conversions'
                    ? `${totals.avgConvRate}% Push Rate`
                    : `${totals.avgSiteVisitRate}% Visit Rate`}
                </span>
              </div>
            </div>

            {/* Side Panel showing Exact Actual Numbers & Percentages */}
            <div className="lg:col-span-5 space-y-3 bg-slate-50/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span>Actual Number Breakdown</span>
                <span className="text-[10px] text-slate-400 font-normal">Active Timeframe</span>
              </div>
              <div className="space-y-2">
                {pieData.map((slice, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: slice.fill }} />
                      <div className="truncate">
                        <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{slice.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">{slice.subtitle || `${slice.percentage}% share`}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100">{Number(slice.value).toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {slice.actualCount !== undefined ? `Stage Total: ${slice.actualCount.toLocaleString()}` : 'Count'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {metricMode === 'leads_conversions' ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#6366f1" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#ec4899" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>} />
                <Area yAxisId="left" type="monotone" dataKey="leads" name="Leads Created (Enquiry Date)" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" />
                <Bar yAxisId="left" dataKey="qualifiedLeads" name="Leads Pushed (Assigned Date)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={22} />
                <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="Push Rate (% Pushed/Created)" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4 }} />
                {showTargetLine && (
                  <ReferenceLine yAxisId="left" y={200} label={{ value: 'Daily Target Pushed Benchmark', fill: '#10b981', fontSize: 10 }} stroke="#10b981" strokeDasharray="3 3" />
                )}
                {showBrush && <Brush dataKey="displayDate" height={24} stroke="#6366f1" />}
              </ComposedChart>
            ) : metricMode === 'revenue_trend' ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPushedBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#8b5cf6" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>} />
                <Area yAxisId="left" type="monotone" dataKey="qualifiedLeads" name="Total Leads Pushed (Assign Date)" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPushedBg)" />
                <Bar yAxisId="left" dataKey="siteVisits" name="Total Site Visits (Visit Date)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={22} />
                <Line yAxisId="right" type="monotone" dataKey="siteVisitConversionRate" name="Site Visit Conversion % (Visits ÷ Pushed)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                {showTargetLine && (
                  <ReferenceLine yAxisId="right" y={30} label={{ value: 'Target Conversion Rate (30%)', fill: '#f59e0b', fontSize: 10 }} stroke="#f59e0b" strokeDasharray="3 3" />
                )}
                {showBrush && <Brush dataKey="displayDate" height={24} stroke="#8b5cf6" />}
              </ComposedChart>
            ) : metricMode === 'conversion_rate' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#ec4899" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>} />
                <Line type="monotone" dataKey="conversionRate" name="Conversion Rate (%)" stroke="#ec4899" strokeWidth={3} dot={{ r: 5, fill: '#ec4899' }} activeDot={{ r: 7 }} />
                {showTargetLine && (
                  <ReferenceLine y={3.5} label={{ value: 'Target Conversion Rate (3.5%)', fill: '#ec4899', fontSize: 10 }} stroke="#ec4899" strokeDasharray="3 3" />
                )}
                {showBrush && <Brush dataKey="displayDate" height={24} stroke="#ec4899" />}
              </LineChart>
            ) : metricMode === 'cpl_cac' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#38bdf8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>} />
                <Line type="monotone" dataKey="cpl" name="Cost Per Lead (CPL ₹)" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="cac" name="Customer Acquisition Cost (CAC ₹)" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4 }} />
                {showTargetLine && (
                  <ReferenceLine y={400} label={{ value: 'Max CPL Benchmark (₹400)', fill: '#0284c7', fontSize: 10 }} stroke="#0284c7" strokeDasharray="3 3" />
                )}
                {showBrush && <Brush dataKey="displayDate" height={24} stroke="#0284c7" />}
              </LineChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#6366f1" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>} />
                <Line type="monotone" dataKey="leads" name="Inbound Leads" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="qualifiedLeads" name="Qualified Leads" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="siteVisits" name="Site Visits" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="conversions" name="Bookings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                {showBrush && <Brush dataKey="displayDate" height={24} stroke="#6366f1" />}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  dateFilter,
  setDateFilter,
  onNavigateToTab,
  onTriggerAIAnalysis
}) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSection>('marketing');
  const [activeSubTab, setActiveSubTab] = useState<'performance' | 'unqualified' | 'sales_lost' | 'funnel'>('performance');
  const [channelChartMetric, setChannelChartMetric] = useState<'leads' | 'revenue'>('leads');

  if (!metrics) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium">Loading CMO Analytics Engine...</p>
      </div>
    );
  }

  const { sales, funnel, campaigns, channels, regions, summary, marketingDashboard } = metrics;

  // Fallback defaults if marketingDashboard is undefined
  const mData = marketingDashboard || {
    totalLeadsCreated: summary.totalLeads || 0,
    totalLeadsPushedToSales: summary.totalQualified || 0,
    totalUnqualifiedPresalesStage: 0,
    siteVisitsConverted: 0,
    siteVisitConversionRate: 0,
    pushedToLost: 0,
    pushedToLostRate: 0,
    campaignWisePerformance: [],
    projectWisePerformance: [],
    sourceWisePerformance: [],
    sourceWiseUnqualified: [],
    campaignWiseUnqualified: [],
    stageWiseDistribution: [],
    unqualifiedReasons: [],
    lostReasons: [],
    projectWiseLostLeads: [],
    teamMemberWiseLostLeads: [],
    totalSalesforceBookings: { count: summary.totalConversions || 0, value: summary.totalRevenue || 0, syncTime: new Date().toISOString() }
  };

  const projectLost = mData.projectWiseLostLeads || [];
  const teamLost = mData.teamMemberWiseLostLeads || [];
  const totalPushedToLost = mData.pushedToLost ?? 0;
  const lostRate = mData.pushedToLostRate ?? 0;

  return (
    <div className="w-full p-4 md:p-6 space-y-6 text-slate-900 dark:text-slate-100">
      {/* Top Professional Polish AI Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-7 rounded-2xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Salesforce & CRM Sync
            </span>
            <span className="text-xs text-slate-300">• Daily / Monthly / Quarterly / Yearly Reports Active</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Marketing, Presales & Sales Executive Dashboard
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Real-time lifecycle tracking: Inbound Lead Creation → Presales Screening → Pushed to Sales → Site Visit Done → Pushed to Lost Leads → Salesforce Bookings.
          </p>

          {/* Active CMO Profile Highlight Badge */}
          <div className="pt-2 flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={user?.avatar || '/ombir_photo.svg'}
                alt={user?.name || 'Ombir Yadav'}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400 shadow-xl ring-2 ring-purple-500/40 bg-slate-800"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full shadow-xs"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">{user?.name || 'Ombir Yadav'}</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[9px] font-extrabold uppercase tracking-wider">
                  CMO Executive
                </span>
              </div>
              <div className="text-[11px] text-indigo-200/90 font-mono flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Logged in Mail ID: <strong>{user?.email || 'ombir@omangentic.com'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={onTriggerAIAnalysis}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>Generate AI Report Audit</span>
          </button>
          <button
            onClick={() => onNavigateToTab('chat')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer"
          >
            <span>Ask AI CMO Advisor</span>
          </button>
        </div>
      </div>

      {/* Section Navigation Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          {[
            { id: 'marketing' as DashboardSection, label: 'Marketing Dashboard', icon: Target, badge: 'Core' },
            { id: 'presales' as DashboardSection, label: 'Presales Section', icon: ShieldCheck, badge: 'Screening' },
            { id: 'sales' as DashboardSection, label: 'Sales Section', icon: Briefcase, badge: 'Bookings' },
            { id: 'all' as DashboardSection, label: 'All Lifecycle Summary', icon: Layers, badge: 'Overview' }
          ].map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id);
                  if (sec.id === 'sales') setActiveSubTab('sales_lost');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{sec.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sec.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 font-medium">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Showing <strong className="text-slate-800 dark:text-slate-200 capitalize">{activeSection}</strong> Metrics</span>
        </div>
      </div>

      {/* Primary KPI Cards Grid for Marketing & Presales & Sales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Leads Created */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Leads Created</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {mData.totalLeadsCreated.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600 font-semibold">+14.2%</span> inbound organic & paid
          </p>
        </div>

        {/* 2. Total Leads Pushed to Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pushed / Assigned to Sales</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {mData.totalLeadsPushedToSales.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {((mData.totalLeadsPushedToSales / (mData.totalLeadsCreated || 1)) * 100).toFixed(1)}%
            </span> assigned to Sales Managers
          </p>
        </div>

        {/* 3. Site Visit Done */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Site Visit Done</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {mData.siteVisitsConverted.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            <span className="font-semibold text-emerald-600">{mData.siteVisitConversionRate}%</span> conversion from Sales
          </p>
        </div>

        {/* 4. Pushed to Lost */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-800 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pushed to Lost</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {totalPushedToLost.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            <span className="font-semibold text-rose-500">{lostRate}%</span> lost in Sales pipeline
          </p>
        </div>

        {/* 5. Salesforce Bookings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Salesforce Bookings</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {mData.totalSalesforceBookings.count} <span className="text-xs font-normal text-slate-500">deals</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium text-emerald-600 dark:text-emerald-400 font-bold">
            ₹{(mData.totalSalesforceBookings.value / 100000).toFixed(2)} Lakhs value
          </p>
        </div>
      </div>

      {/* Salesforce Bookings Highlight Box */}
      <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base text-white">Salesforce Recorded Bookings</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified CRM Contracts
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Closed-won deals verified and synced directly with Salesforce REST API endpoints.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 bg-white/10 px-6 py-3 rounded-xl border border-white/15">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Total Booking Value</div>
            <div className="text-xl font-black text-emerald-300">
              ₹{(mData.totalSalesforceBookings.value || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Deals Recorded</div>
            <div className="text-xl font-black text-white">
              {mData.totalSalesforceBookings.count} <span className="text-xs font-normal text-slate-300">deals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Data Visualization Component: Historical Trends for Leads and Conversions */}
      <HistoricalTrendsChart salesData={sales} dateFilter={dateFilter} setDateFilter={setDateFilter} />

      {/* Sub-Tabs for Deep Dive Views */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'performance', label: 'Campaign & Source Performance' },
          { id: 'sales_lost', label: 'Lost Lead Analysis (Project & Team Wise)' },
          { id: 'unqualified', label: 'Unqualified & Lost Reasons Breakdown' },
          { id: 'funnel', label: 'Stage-Wise Lead Distribution' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB TAB: PROJECT-WISE & TEAM MEMBER-WISE LOST LEADS */}
      {activeSubTab === 'sales_lost' && (
        <div className="space-y-8">
          {/* 1. Project-Wise Lost Leads */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-500" />
                  Project-Wise Lost Leads Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Granular tracking of leads assigned, site visits completed, and lost leads per property project
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold shrink-0 self-start sm:self-auto">
                Total Lost Leads: {projectLost.reduce((a, b) => a + b.lostLeads, 0).toLocaleString()}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Project Name</th>
                    <th className="pb-3 font-semibold">Total Leads Assigned</th>
                    <th className="pb-3 font-semibold">Site Visit Done</th>
                    <th className="pb-3 font-semibold">Pushed to Lost</th>
                    <th className="pb-3 font-semibold">Lost Rate %</th>
                    <th className="pb-3 font-semibold">Primary Lost Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {[...projectLost].sort((a, b) => b.totalAssigned - a.totalAssigned).map(prj => (
                    <tr key={prj.projectName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">{prj.projectName}</td>
                      <td className="py-3.5 font-medium">{prj.totalAssigned.toLocaleString()}</td>
                      <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{prj.siteVisitsDone.toLocaleString()}</td>
                      <td className="py-3.5 font-bold text-rose-600 dark:text-rose-400">{prj.lostLeads.toLocaleString()}</td>
                      <td className="py-3.5 font-bold">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {prj.lostRate}%
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">{prj.topReason}</td>
                    </tr>
                  ))}
                  {projectLost.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                        No lost lead project records in uploaded data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Team Member-Wise Lost Leads & Performance */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  Team Member-Wise Lost Leads & Conversion
                </h3>
                <p className="text-xs text-slate-500">
                  Performance breakdown by Sales Manager / Executive showing leads assigned, site visits, lost leads, and booking wins
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Sales Team Member</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Total Assigned</th>
                    <th className="pb-3 font-semibold">Site Visit Done</th>
                    <th className="pb-3 font-semibold">Pushed to Lost</th>
                    <th className="pb-3 font-semibold">Bookings Won</th>
                    <th className="pb-3 font-semibold">Win Rate %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {[...teamLost].sort((a, b) => b.totalAssigned - a.totalAssigned).map(mem => (
                    <tr key={mem.memberId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">{mem.memberName}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {mem.role}
                        </span>
                      </td>
                      <td className="py-3.5 font-medium">{mem.totalAssigned.toLocaleString()}</td>
                      <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{mem.siteVisitsDone.toLocaleString()}</td>
                      <td className="py-3.5 font-bold text-rose-600 dark:text-rose-400">{mem.lostLeads.toLocaleString()}</td>
                      <td className="py-3.5 font-bold text-indigo-600 dark:text-indigo-400">{mem.bookings.toLocaleString()}</td>
                      <td className="py-3.5 font-bold">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {mem.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {teamLost.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                        No team member sales performance records in uploaded data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 1: CAMPAIGN & SOURCE PERFORMANCE */}
      {activeSubTab === 'performance' && (
        <div className="space-y-8">
          {/* Campaign-Wise Performance Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Campaign-Wise Performance
                </h3>
                <p className="text-xs text-slate-500">
                  Granular tracking from total leads created down to site visits converted and Salesforce bookings per campaign.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Campaign Name</th>
                    <th className="pb-3 font-semibold">Project</th>
                    <th className="pb-3 font-semibold">Channel</th>
                    <th className="pb-3 font-semibold">Total Leads</th>
                    <th className="pb-3 font-semibold">Presales Unqualified</th>
                    <th className="pb-3 font-semibold">Pushed / Assigned to Sales</th>
                    <th className="pb-3 font-semibold">Site Visits</th>
                    <th className="pb-3 font-semibold">Salesforce Bookings</th>
                    <th className="pb-3 font-semibold">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {[...(mData.campaignWisePerformance || [])].sort((a, b) => b.totalLeads - a.totalLeads).map(cmp => (
                    <tr key={cmp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">{cmp.name}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
                          {cmp.projectName || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                          {cmp.channel}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">{cmp.totalLeads.toLocaleString()}</td>
                      <td className="py-3.5 font-medium">
                        <span className="text-rose-600 dark:text-rose-400 font-bold">{cmp.unqualifiedPresales.toLocaleString()}</span>
                        <span className="text-[10px] font-semibold text-rose-500/80 dark:text-rose-400/80 ml-1.5">
                          ({cmp.totalLeads > 0 ? ((cmp.unqualifiedPresales / cmp.totalLeads) * 100).toFixed(1) : '0.0'}%)
                        </span>
                      </td>
                      <td className="py-3.5 font-medium">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{cmp.pushedToSales.toLocaleString()}</span>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 ml-1.5">
                          ({cmp.totalLeads > 0 ? ((cmp.pushedToSales / cmp.totalLeads) * 100).toFixed(1) : '0.0'}%)
                        </span>
                      </td>
                      <td className="py-3.5 font-medium">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{cmp.siteVisits.toLocaleString()}</span>
                        <span className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 ml-1.5">
                          ({cmp.totalLeads > 0 ? ((cmp.siteVisits / cmp.totalLeads) * 100).toFixed(1) : '0.0'}%)
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                        {cmp.bookings} <span className="text-[10px] font-normal text-slate-400">(₹{(cmp.bookingValue/1000).toFixed(0)}k)</span>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {cmp.roi}x
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!mData.campaignWisePerformance || mData.campaignWisePerformance.length === 0) && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400 font-medium">
                        No campaign data uploaded yet. Upload a report to view live campaign performance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project-Wise Performance Breakdown (Beside / Alongside Channel Breakdown) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  Project-Wise Performance Breakdown
                </h3>
                <p className="text-xs text-slate-500">Real estate & campaign ROI breakdown per project portfolio</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 self-start">
                {(mData.projectWisePerformance || []).length} Active Projects
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Project Name</th>
                    <th className="pb-3 font-semibold">Top Channel</th>
                    <th className="pb-3 font-semibold">Total Leads</th>
                    <th className="pb-3 font-semibold">Unqualified</th>
                    <th className="pb-3 font-semibold">Pushed to Sales</th>
                    <th className="pb-3 font-semibold">Site Visits</th>
                    <th className="pb-3 font-semibold">Bookings</th>
                    <th className="pb-3 font-semibold">Booking Revenue (₹)</th>
                    <th className="pb-3 font-semibold">Project ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {[...(mData.projectWisePerformance || [])].sort((a, b) => b.totalLeads - a.totalLeads).map(p => (
                    <tr key={p.project} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{p.project}</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.topChannel || 'Direct'}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{p.totalLeads.toLocaleString()}</td>
                      <td className="py-3 font-semibold">
                        <span className="text-rose-500 font-bold">{p.unqualifiedPresales.toLocaleString()}</span>
                        <span className="text-[10px] font-medium text-rose-500/80 dark:text-rose-400/80 ml-1.5">
                          ({p.totalLeads > 0 ? ((p.unqualifiedPresales / p.totalLeads) * 100).toFixed(1) : '0.0'}%)
                        </span>
                      </td>
                      <td className="py-3 font-medium">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{p.pushedToSales.toLocaleString()}</span>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 ml-1.5">
                          ({p.totalLeads > 0 ? ((p.pushedToSales / p.totalLeads) * 100).toFixed(1) : '0.0'}%)
                        </span>
                      </td>
                      <td className="py-3 font-medium">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.siteVisits.toLocaleString()}</span>
                        <span className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 ml-1.5">
                          ({p.totalLeads > 0 ? ((p.siteVisits / p.totalLeads) * 100).toFixed(1) : '0.0'}%)
                        </span>
                      </td>
                      <td className="py-3 font-bold text-indigo-600 dark:text-indigo-400">{p.bookings}</td>
                      <td className="py-3 font-extrabold text-amber-600 dark:text-amber-400">₹{(p.revenue / 100000).toFixed(2)} Lakhs</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {p.roi}x
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!mData.projectWisePerformance || mData.projectWisePerformance.length === 0) && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400 font-medium">
                        No project data uploaded yet. Upload a report to view live project performance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Source-Wise Performance Table & Visual Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <span className="truncate">Channel & Source-Wise Performance Breakdown</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4 truncate">Marketing source breakdown across leads, site visits, and booking revenue</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold whitespace-nowrap">Lead Source</th>
                      <th className="pb-3 font-semibold whitespace-nowrap">Total Leads</th>
                      <th className="pb-3 font-semibold whitespace-nowrap">Presales Unqualified</th>
                      <th className="pb-3 font-semibold whitespace-nowrap">Pushed / Assigned</th>
                      <th className="pb-3 font-semibold whitespace-nowrap">Site Visits</th>
                      <th className="pb-3 font-semibold whitespace-nowrap">Bookings Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {[...(mData.sourceWisePerformance || [])].sort((a, b) => b.totalLeads - a.totalLeads).map(src => (
                      <tr key={src.source} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{src.source}</td>
                        <td className="py-3 font-medium whitespace-nowrap">{src.totalLeads.toLocaleString()}</td>
                        <td className="py-3 font-semibold text-rose-500 whitespace-nowrap">
                          <span>{src.unqualifiedPresales.toLocaleString()}</span>
                          <span className="text-[10px] font-medium text-rose-500/80 dark:text-rose-400/80 ml-1.5">
                            ({src.totalLeads > 0 ? ((src.unqualifiedPresales / src.totalLeads) * 100).toFixed(1) : '0.0'}%)
                          </span>
                        </td>
                        <td className="py-3 font-medium whitespace-nowrap">
                          <span>{src.pushedToSales.toLocaleString()}</span>
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 ml-1.5">
                            ({src.totalLeads > 0 ? ((src.pushedToSales / src.totalLeads) * 100).toFixed(1) : '0.0'}%)
                          </span>
                        </td>
                        <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          <span>{src.siteVisits.toLocaleString()}</span>
                          <span className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 ml-1.5">
                            ({src.totalLeads > 0 ? ((src.siteVisits / src.totalLeads) * 100).toFixed(1) : '0.0'}%)
                          </span>
                        </td>
                        <td className="py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">₹{src.revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {(!mData.sourceWisePerformance || mData.sourceWisePerformance.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                          No channel source data uploaded yet. Upload a report to view live source breakdown.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Source Revenue / Leads Donut Chart Card */}
            <div className="xl:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base tracking-tight whitespace-nowrap flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                    Source & Distribution
                  </h3>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => setChannelChartMetric('leads')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        channelChartMetric === 'leads'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Total Leads
                    </button>
                    <button
                      onClick={() => setChannelChartMetric('revenue')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        channelChartMetric === 'revenue'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Revenue (₹)
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4 truncate">
                  Channel contribution ranked by {channelChartMetric === 'revenue' ? 'Sales Revenue' : 'Total Leads Created'}
                </p>
              </div>

              {/* Flex / Grid for Donut Chart + Custom Scrollable Legend */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center min-w-0">
                {/* Donut Chart with Center KPI Ring */}
                <div className="md:col-span-5 h-52 sm:h-56 w-full relative flex items-center justify-center min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mData.sourceWisePerformance || []}
                        dataKey={channelChartMetric === 'revenue' ? 'revenue' : 'totalLeads'}
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                      >
                        {(mData.sourceWisePerformance || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                        formatter={(val: any, name: any, item: any) => [
                          channelChartMetric === 'revenue'
                            ? `₹${Number(val).toLocaleString('en-IN')} (${item?.payload?.totalLeads || 0} leads)`
                            : `${Number(val).toLocaleString()} leads`,
                          item?.payload?.source || 'Channel'
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Overlay Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      {channelChartMetric === 'revenue' ? 'Total Revenue' : 'Total Leads'}
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      {(() => {
                        if (channelChartMetric === 'revenue') {
                          const tot = (mData.sourceWisePerformance || []).reduce((sum, item) => sum + (item.revenue || 0), 0);
                          return tot > 0 ? `₹${(tot / 100000).toFixed(1)}L` : '₹0';
                        }
                        const totLeads = (mData.sourceWisePerformance || []).reduce((sum, item) => sum + (item.totalLeads || 0), 0);
                        return totLeads.toLocaleString();
                      })()}
                    </span>
                  </div>
                </div>

                {/* Custom Scrollable Legend */}
                <div className="md:col-span-7 max-h-56 overflow-y-auto pr-1.5 space-y-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-3 md:pt-0 md:pl-4 min-w-0">
                  {(() => {
                    const activeTotal = (mData.sourceWisePerformance || []).reduce(
                      (sum, item) => sum + (channelChartMetric === 'revenue' ? (item.revenue || 0) : (item.totalLeads || 0)),
                      0
                    );
                    return (mData.sourceWisePerformance || []).map((item, idx) => {
                      const color = COLORS[idx % COLORS.length];
                      const itemVal = channelChartMetric === 'revenue' ? (item.revenue || 0) : (item.totalLeads || 0);
                      const pct = activeTotal > 0 ? ((itemVal / activeTotal) * 100).toFixed(1) : '0';
                      return (
                        <div
                          key={item.source}
                          className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all min-w-0"
                        >
                          <div className="flex items-center justify-between text-xs font-bold mb-1 min-w-0 gap-2">
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: color }} />
                              <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs" title={item.source}>
                                {item.source}
                              </span>
                            </div>
                            <div className="text-right shrink-0 whitespace-nowrap">
                              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                                {channelChartMetric === 'revenue'
                                  ? `₹${(item.revenue || 0).toLocaleString('en-IN')}`
                                  : `${(item.totalLeads || 0).toLocaleString()} leads`}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1 font-semibold">({pct}%)</span>
                            </div>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-full h-1.5 bg-slate-200/70 dark:bg-slate-700/70 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(2, parseFloat(pct))}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {(!mData.sourceWisePerformance || mData.sourceWisePerformance.length === 0) && (
                    <div className="text-xs text-slate-400 text-center py-6">No channel data available</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB TAB 2: UNQUALIFIED & LOST REASONS */}
      {activeSubTab === 'unqualified' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Source-Wise Unqualified Leads */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-500" />
                    Source-Wise Unqualified Leads
                  </h3>
                  <p className="text-xs text-slate-500">Unqualified lead counts and rejection percentage per channel source</p>
                </div>
              </div>

              <div className="space-y-3">
                {[...(mData.sourceWiseUnqualified || [])].sort((a, b) => b.totalLeads - a.totalLeads).map(src => (
                  <div key={src.source} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span>{src.source}</span>
                      <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                        {src.unqualifiedLeads.toLocaleString()} leads ({src.unqualifiedRate}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, src.unqualifiedRate * 2.5)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>Total Leads: {src.totalLeads.toLocaleString()}</span>
                      <span>Site Visits: {src.siteVisits.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {(!mData.sourceWiseUnqualified || mData.sourceWiseUnqualified.length === 0) && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No source unqualified records available.</p>
                )}
              </div>
            </div>

            {/* Campaign-Wise Unqualified Leads */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    <Filter className="w-5 h-5 text-amber-500" />
                    Campaign-Wise Unqualified Leads
                  </h3>
                  <p className="text-xs text-slate-500">Audit of ad campaign targeting efficiency and drop-off</p>
                </div>
              </div>

              <div className="space-y-3">
                {[...(mData.campaignWiseUnqualified || [])].sort((a, b) => b.totalLeads - a.totalLeads).map(cmp => (
                  <div key={cmp.campaignId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="truncate max-w-[200px]">{cmp.campaignName}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                        {cmp.unqualifiedLeads.toLocaleString()} ({cmp.unqualifiedRate}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, cmp.unqualifiedRate * 2.5)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>Channel: {cmp.channel}</span>
                      <span>Total Created: {cmp.totalLeads.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {(!mData.campaignWiseUnqualified || mData.campaignWiseUnqualified.length === 0) && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No campaign unqualified records available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Unqualified Reasons & Lost Reasons Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unqualified Reasons */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                Presales Unqualified Reasons
              </h3>
              <p className="text-xs text-slate-500 mb-4">Primary reasons logged by Presales team during screening</p>

              <div className="space-y-3">
                {mData.unqualifiedReasons.map(item => (
                  <div key={item.reason} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.reason}</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">
                        {item.count.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!mData.unqualifiedReasons || mData.unqualifiedReasons.length === 0) && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No unqualified reasons logged in dataset.</p>
                )}
              </div>
            </div>

            {/* Lost Reasons */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Sales Deal Lost Reasons
              </h3>
              <p className="text-xs text-slate-500 mb-4">Primary reasons why qualified leads were lost in Sales stage</p>

              <div className="space-y-3">
                {mData.lostReasons.map(item => (
                  <div key={item.reason} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.reason}</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">
                        {item.count.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!mData.lostReasons || mData.lostReasons.length === 0) && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No lost reasons logged in dataset.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: STAGE-WISE LEAD DISTRIBUTION */}
      {activeSubTab === 'funnel' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Stage-Wise Lead Distribution Pipeline
            </h3>
            <p className="text-xs text-slate-500">
              End-to-end lifecycle distribution from initial lead creation through Presales, Sales Manager assignment, Site Visits, and Salesforce Contract Bookings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mData.stageWiseDistribution.map((stg, idx) => (
              <div
                key={stg.stage}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                    <span className="truncate">{stg.stage}</span>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stg.color || COLORS[idx % COLORS.length] }}></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {stg.count.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                    {stg.percentage}% of total created
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  {stg.description}
                </p>
              </div>
            ))}
          </div>

          {/* Bar Chart Visualizer for Pipeline */}
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mData.stageWiseDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} tickFormatter={val => val.split('.')[1] || val} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(val: any) => [Number(val).toLocaleString(), 'Lead Count']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {mData.stageWiseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
