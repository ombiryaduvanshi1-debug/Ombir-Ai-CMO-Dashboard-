import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
  Plus,
  TrendingUp,
  PieChart as PieIcon,
  Check,
  Table,
  Users,
  UserCheck,
  Building,
  PhoneCall,
  Award,
  Search,
  Filter,
  ArrowUpRight,
  BarChart2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ExecutiveReport } from '../types';
import { api } from '../lib/api';
import { ROICalculatorWidget } from './ROICalculatorWidget';
import { mockPresalesMembersReportData, mockSalesManagerReportData } from '../data/teamReportsData';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

const mockProjectWiseReportData = [
  {
    id: 'prj-01',
    projectName: 'Aura Heights',
    location: 'Sector 62, Gurgaon',
    type: 'Luxury Residential',
    topChannel: 'Google Ads',
    totalLeads: 3850,
    presalesUnqualified: 710,
    pushedToSales: 2420,
    siteVisits: 1020,
    bookings: 112,
    totalRevenueINR: 280000000,
    spendINR: 1840000,
    roi: 4.8
  },
  {
    id: 'prj-02',
    projectName: 'Grand Skylight',
    location: 'Golf Course Road, Gurgaon',
    type: 'Commercial Towers',
    topChannel: 'Meta Ads',
    totalLeads: 3200,
    presalesUnqualified: 680,
    pushedToSales: 2050,
    siteVisits: 890,
    bookings: 94,
    totalRevenueINR: 235000000,
    spendINR: 1520000,
    roi: 4.2
  },
  {
    id: 'prj-03',
    projectName: 'Emerald Towers',
    location: 'Whitefield, Bengaluru',
    type: 'Premium Apartments',
    topChannel: 'LinkedIn Ads',
    totalLeads: 2800,
    presalesUnqualified: 590,
    pushedToSales: 1820,
    siteVisits: 760,
    bookings: 82,
    totalRevenueINR: 205000000,
    spendINR: 1410000,
    roi: 3.9
  },
  {
    id: 'prj-04',
    projectName: 'Greenfield Residency',
    location: 'Gachibowli, Hyderabad',
    type: 'Gated Villa Community',
    topChannel: 'Organic SEO',
    totalLeads: 2600,
    presalesUnqualified: 620,
    pushedToSales: 1650,
    siteVisits: 680,
    bookings: 72,
    totalRevenueINR: 180000000,
    spendINR: 1120000,
    roi: 4.5
  },
  {
    id: 'prj-05',
    projectName: 'Royal Palms Estate',
    location: 'ECR, Chennai',
    type: 'Beachfront Plots & Condos',
    topChannel: 'Email Nurture',
    totalLeads: 2400,
    presalesUnqualified: 650,
    pushedToSales: 1480,
    siteVisits: 490,
    bookings: 52,
    totalRevenueINR: 130000000,
    spendINR: 980000,
    roi: 3.6
  }
];

export const ReportsView: React.FC = () => {
  const [reports, setReports] = useState<ExecutiveReport[]>([]);
  const [activeReport, setActiveReport] = useState<ExecutiveReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState('Q3 Executive CMO Brief & Performance Audit');
  const [reportPeriod, setReportPeriod] = useState('Q3 2026');
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Tab State: 'executive' | 'presales' | 'sales_managers' | 'project_wise'
  const [activeTab, setActiveTab] = useState<'executive' | 'presales' | 'sales_managers' | 'project_wise'>('executive');

  // Search filter states
  const [presalesSearch, setPresalesSearch] = useState('');
  const [salesManagerSearch, setSalesManagerSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const loadReports = async () => {
    try {
      const data = await api.getReports();
      setReports(data);
      if (data.length > 0) setActiveReport(data[0]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const newReport = await api.generateReport(reportTitle, reportPeriod);
      setReports(prev => [newReport, ...prev]);
      setActiveReport(newReport);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Helper to trigger CSV download
  const triggerCSVDownload = (rows: string[][], fileName: string) => {
    const csvContent = rows
      .map(r =>
        r
          .map(cell => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotification(`Exported "${fileName}" successfully!`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  const handleExportPresalesCSV = () => {
    const rows: string[][] = [];
    rows.push(['PRESALES MEMBER-WISE TOTAL LEAD PERFORMANCE REPORT']);
    rows.push(['Report Period', reportPeriod]);
    rows.push(['Date Generated', new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['Presales Member', 'Role', 'Total Handled Leads', 'Total Leads Pushed', 'Unqualified Leads', 'Site Visits Scheduled', 'Push Rate (%)', 'Avg Response (min)', 'Status']);

    mockPresalesMembersReportData.forEach(m => {
      rows.push([
        m.name,
        m.role,
        m.totalLeadsHandled.toString(),
        m.totalLeadsPushed.toString(),
        m.unqualifiedLeads.toString(),
        m.siteVisitsScheduled.toString(),
        `${m.pushRatePct}%`,
        `${m.avgResponseTimeMin} min`,
        m.status
      ]);
    });

    triggerCSVDownload(rows, `presales_member_lead_report_${reportPeriod.toLowerCase().replace(/\s+/g, '_')}.csv`);
  };

  const handleExportSalesManagerCSV = () => {
    const rows: string[][] = [];
    rows.push(['SALES MANAGER-WISE TOTAL LEAD & BOOKING REPORT']);
    rows.push(['Report Period', reportPeriod]);
    rows.push(['Date Generated', new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['Sales Manager', 'Region / Team Desk', 'Total Leads Assigned', 'Total Site Visits Conducted', 'Total Deals Booked', 'Total Revenue (₹)', 'Avg Ticket Size (₹)', 'Visit-to-Booking Rate (%)', 'Lead-to-Booking Rate (%)', 'Target Achievement (%)']);

    mockSalesManagerReportData.forEach(sm => {
      rows.push([
        sm.name,
        sm.regionOrTeam,
        sm.totalLeadsAssigned.toString(),
        sm.totalSiteVisitsVisited.toString(),
        sm.totalLeadsBooked.toString(),
        `₹${sm.totalRevenueINR.toLocaleString('en-IN')}`,
        `₹${sm.avgTicketSizeINR.toLocaleString('en-IN')}`,
        `${sm.visitToBookingRatePct}%`,
        `${sm.overallLeadToBookingRatePct}%`,
        `${sm.targetAchievementPct}%`
      ]);
    });

    triggerCSVDownload(rows, `sales_manager_lead_report_${reportPeriod.toLowerCase().replace(/\s+/g, '_')}.csv`);
  };

  const handleExportExcel = () => {
    if (activeTab === 'presales') {
      handleExportPresalesCSV();
      return;
    }
    if (activeTab === 'sales_managers') {
      handleExportSalesManagerCSV();
      return;
    }

    if (!activeReport) return;

    const rows: string[][] = [];

    // Title & Metadata Header
    rows.push(['AI CMO DASHBOARD - FULL EXECUTIVE & TEAM REPORT EXPORT']);
    rows.push(['Report Title', activeReport.title]);
    rows.push(['Time Period', activeReport.period]);
    rows.push(['Generated By', activeReport.author]);
    rows.push(['Date Generated', new Date(activeReport.generatedAt).toLocaleString()]);
    rows.push(['Document ID', activeReport.id]);
    rows.push([]);

    // 1. Executive Summary Table
    rows.push(['=== 1. EXECUTIVE KPI SUMMARY METRICS ===']);
    rows.push(['Metric Description', 'Value']);
    rows.push(['Total Revenue (₹)', `₹${activeReport.totalRevenue.toLocaleString('en-IN')}`]);
    rows.push(['Total Campaign Spend (₹)', `₹${activeReport.totalSpend.toLocaleString('en-IN')}`]);
    rows.push(['Net Profit Revenue (₹)', `₹${(activeReport.totalRevenue - activeReport.totalSpend).toLocaleString('en-IN')}`]);
    rows.push(['Overall ROI Ratio', `${activeReport.overallROI}x`]);
    rows.push(['Total Inbound Leads Created', activeReport.totalLeads ? activeReport.totalLeads.toLocaleString() : '14,850']);
    rows.push(['Total Sales Conversions', activeReport.totalConversions ? activeReport.totalConversions.toLocaleString() : '342']);
    rows.push([]);

    // 2. Executive Narrative Summary
    rows.push(['=== 2. EXECUTIVE NARRATIVE ===']);
    rows.push(['Narrative', activeReport.summary]);
    rows.push([]);

    // 3. Strategic AI Insights List
    rows.push(['=== 3. STRATEGIC AI RECOMMENDATIONS ===']);
    activeReport.aiInsightsSummary.forEach((insight, idx) => {
      rows.push([`Recommendation #${idx + 1}`, insight]);
    });
    rows.push([]);

    // 4. Campaign Performance Breakdown Table
    rows.push(['=== 4. CAMPAIGN PERFORMANCE & SPEND BREAKDOWN ===']);
    rows.push(['Campaign Name', 'Channel', 'Spend (₹)', 'Revenue (₹)', 'Net Profit (₹)', 'ROI (x)', 'Leads', 'Conversions', 'CAC (₹)']);
    activeReport.topCampaigns.forEach(c => {
      const net = c.revenue - c.spend;
      rows.push([
        c.name,
        c.channel,
        c.spend.toString(),
        c.revenue.toString(),
        net.toString(),
        `${c.roi}x`,
        c.leads ? c.leads.toString() : '0',
        c.conversions ? c.conversions.toString() : '0',
        c.cac ? `₹${c.cac}` : '₹0'
      ]);
    });
    rows.push([]);

    // 5. Presales Member-Wise Breakdown
    rows.push(['=== 5. PRESALES MEMBER-WISE TOTAL LEAD PERFORMANCE ===']);
    rows.push(['Presales Member', 'Role', 'Total Handled Leads', 'Total Leads Pushed', 'Unqualified Leads', 'Site Visits Scheduled', 'Push Rate (%)']);
    mockPresalesMembersReportData.forEach(m => {
      rows.push([
        m.name,
        m.role,
        m.totalLeadsHandled.toString(),
        m.totalLeadsPushed.toString(),
        m.unqualifiedLeads.toString(),
        m.siteVisitsScheduled.toString(),
        `${m.pushRatePct}%`
      ]);
    });
    rows.push([]);

    // 6. Sales Manager-Wise Breakdown
    rows.push(['=== 6. SALES MANAGER-WISE TOTAL LEAD & BOOKING PERFORMANCE ===']);
    rows.push(['Sales Manager', 'Region/Desk', 'Total Leads Assigned', 'Site Visits Conducted', 'Deals Booked', 'Total Revenue (₹)', 'Visit-to-Booking Rate (%)']);
    mockSalesManagerReportData.forEach(sm => {
      rows.push([
        sm.name,
        sm.regionOrTeam,
        sm.totalLeadsAssigned.toString(),
        sm.totalSiteVisitsVisited.toString(),
        sm.totalLeadsBooked.toString(),
        `₹${sm.totalRevenueINR.toLocaleString('en-IN')}`,
        `${sm.visitToBookingRatePct}%`
      ]);
    });
    rows.push([]);

    // 7. Project-Wise Breakdown
    rows.push(['=== 7. PROJECT-WISE TOTAL LEAD & REVENUE PERFORMANCE ===']);
    rows.push(['Project Name', 'Location', 'Top Lead Channel', 'Total Leads', 'Presales Unqualified', 'Pushed to Sales', 'Site Visits', 'Bookings', 'Total Revenue (₹)', 'ROI (x)']);
    mockProjectWiseReportData.forEach(p => {
      rows.push([
        p.projectName,
        p.location,
        p.topChannel,
        p.totalLeads.toString(),
        p.presalesUnqualified.toString(),
        p.pushedToSales.toString(),
        p.siteVisits.toString(),
        p.bookings.toString(),
        `₹${p.totalRevenueINR.toLocaleString('en-IN')}`,
        `${p.roi}x`
      ]);
    });

    const fileName = `${activeReport.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${activeReport.period.toLowerCase().replace(/\s+/g, '_')}.csv`;
    triggerCSVDownload(rows, fileName);
  };

  const handleExportProjectReportCSV = () => {
    const rows = [
      ['Project Name', 'Location', 'Project Type', 'Top Lead Channel', 'Total Leads', 'Presales Unqualified', 'Pushed to Sales', 'Site Visits', 'Bookings', 'Total Revenue (Cr ₹)', 'Spend (₹)', 'ROI (x)'],
      ...mockProjectWiseReportData.map(p => [
        p.projectName,
        p.location,
        p.type,
        p.topChannel,
        p.totalLeads.toString(),
        p.presalesUnqualified.toString(),
        p.pushedToSales.toString(),
        p.siteVisits.toString(),
        p.bookings.toString(),
        (p.totalRevenueINR / 10000000).toFixed(2),
        p.spendINR.toString(),
        `${p.roi}x`
      ])
    ];
    triggerCSVDownload(rows, `Project_Wise_Performance_Report_${reportPeriod.replace(/\s+/g, '_')}.csv`);
    setExportNotification('Exported Project-Wise Report CSV successfully!');
    setTimeout(() => setExportNotification(null), 4000);
  };

  // Filtered datasets for active searches
  const filteredPresalesMembers = mockPresalesMembersReportData.filter(m =>
    m.name.toLowerCase().includes(presalesSearch.toLowerCase()) ||
    m.role.toLowerCase().includes(presalesSearch.toLowerCase())
  );

  const filteredSalesManagers = mockSalesManagerReportData.filter(sm =>
    sm.name.toLowerCase().includes(salesManagerSearch.toLowerCase()) ||
    sm.regionOrTeam.toLowerCase().includes(salesManagerSearch.toLowerCase())
  );

  // Totals for Presales
  const presalesTotals = mockPresalesMembersReportData.reduce(
    (acc, m) => {
      acc.handled += m.totalLeadsHandled;
      acc.pushed += m.totalLeadsPushed;
      acc.unqualified += m.unqualifiedLeads;
      acc.visitsScheduled += m.siteVisitsScheduled;
      return acc;
    },
    { handled: 0, pushed: 0, unqualified: 0, visitsScheduled: 0 }
  );

  // Totals for Sales Managers
  const salesManagerTotals = mockSalesManagerReportData.reduce(
    (acc, sm) => {
      acc.assigned += sm.totalLeadsAssigned;
      acc.visited += sm.totalSiteVisitsVisited;
      acc.booked += sm.totalLeadsBooked;
      acc.revenue += sm.totalRevenueINR;
      return acc;
    },
    { assigned: 0, visited: 0, booked: 0, revenue: 0 }
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 print:p-0 print:m-0">
      {/* Toast Notification for Download */}
      {exportNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce print:hidden">
          <div className="p-1 rounded-full bg-emerald-500 text-white">
            <Check className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold">{exportNotification}</p>
        </div>
      )}

      {/* Header - Hidden on Print */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/20 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Executive Reporting Module
            </span>
            <span className="text-xs text-slate-400">• PDF & Excel Export Ready</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Downloadable CMO Performance Reports
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Synthesize revenue metrics, campaign ROIs, data visualizations, and AI executive recommendations into downloadable PDF and Excel documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={!activeReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.csv)</span>
          </button>

          <button
            onClick={handlePrintPDF}
            disabled={!activeReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Interactive ROI Calculator & Excel Budget Upload Widget */}
      <div className="print:hidden">
        <ROICalculatorWidget />
      </div>

      {/* Sub-Report Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 print:hidden">
        <button
          onClick={() => setActiveTab('executive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'executive'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. CMO Executive Brief</span>
        </button>

        <button
          onClick={() => setActiveTab('presales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'presales'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>2. Presales Member-Wise Report</span>
        </button>

        <button
          onClick={() => setActiveTab('sales_managers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sales_managers'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span>3. Sales Manager-Wise Report</span>
        </button>

        <button
          onClick={() => setActiveTab('project_wise')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'project_wise'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Building className="w-4 h-4 text-indigo-400" />
          <span>4. Project-Wise Lead & Revenue Report</span>
        </button>
      </div>

      {/* VIEW TAB 2: PRESALES MEMBER WISE REPORT */}
      {activeTab === 'presales' && (
        <div className="space-y-6 print:block">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Presales Analytics Report
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Presales Member-Wise Total Lead Performance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track total leads handled, pushed to sales, unqualified leads, and scheduled site visits per team member.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search presales member..."
                  value={presalesSearch}
                  onChange={e => setPresalesSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleExportPresalesCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Presales Report (.csv)</span>
              </button>
            </div>
          </div>

          {/* Presales Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Leads Handled</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{presalesTotals.handled.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500 font-medium">100% Inbound Presales Queue</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Leads Pushed</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{presalesTotals.pushed.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600/80 font-bold">
                {Math.round((presalesTotals.pushed / presalesTotals.handled) * 100)}% Overall Push Rate
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Unqualified Leads</span>
              <p className="text-xl font-black text-rose-500 mt-1">{presalesTotals.unqualified.toLocaleString()}</p>
              <span className="text-[10px] text-rose-500/80 font-bold">
                {Math.round((presalesTotals.unqualified / presalesTotals.handled) * 100)}% Unqualified Rate
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Site Visits Scheduled</span>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{presalesTotals.visitsScheduled.toLocaleString()}</p>
              <span className="text-[10px] text-indigo-500 font-medium">Ready for On-Site Walkthrough</span>
            </div>
          </div>

          {/* Recharts Bar Chart - Presales Performance */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
              Presales Member Lead Comparison (Handled vs Pushed vs Unqualified)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockPresalesMembersReportData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(val: any) => Number(val).toLocaleString()} />
                  <Legend formatter={(val) => <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{val}</span>} />
                  <Bar dataKey="totalLeadsHandled" name="Leads Handled" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalLeadsPushed" name="Leads Pushed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unqualifiedLeads" name="Unqualified" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Presales Member Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Presales Member Metrics Breakdown</h3>
              <span className="text-xs text-slate-400">{filteredPresalesMembers.length} Members</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3.5">Presales Member</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Total Handled</th>
                    <th className="p-3.5">Total Pushed</th>
                    <th className="p-3.5">Unqualified</th>
                    <th className="p-3.5">Visits Scheduled</th>
                    <th className="p-3.5">Push Rate</th>
                    <th className="p-3.5">Avg Response</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPresalesMembers.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                        <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        <span>{m.name}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">{m.role}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{m.totalLeadsHandled.toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">{m.totalLeadsPushed.toLocaleString()}</td>
                      <td className="p-3.5 font-semibold text-rose-500">{m.unqualifiedLeads.toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">{m.siteVisitsScheduled.toLocaleString()}</td>
                      <td className="p-3.5 font-extrabold text-emerald-600">{m.pushRatePct}%</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">{m.avgResponseTimeMin} min</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'Top Performer'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: SALES MANAGER WISE REPORT */}
      {activeTab === 'sales_managers' && (
        <div className="space-y-6 print:block">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Sales Leadership Report
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sales Manager-Wise Lead, Visit & Booking Report</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track leads assigned, site visits conducted, deals booked, revenue generated, and conversion rates by Sales Manager.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sales manager..."
                  value={salesManagerSearch}
                  onChange={e => setSalesManagerSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleExportSalesManagerCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Sales Manager Report (.csv)</span>
              </button>
            </div>
          </div>

          {/* Sales Manager Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Leads Assigned</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{salesManagerTotals.assigned.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500 font-medium">Assigned to Sales Desk</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Site Visits Conducted</span>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{salesManagerTotals.visited.toLocaleString()}</p>
              <span className="text-[10px] text-indigo-500 font-bold">
                {Math.round((salesManagerTotals.visited / salesManagerTotals.assigned) * 100)}% Visit Conversion
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Deals Booked</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{salesManagerTotals.booked.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600/80 font-bold">
                {((salesManagerTotals.booked / salesManagerTotals.visited) * 100).toFixed(1)}% Visit-to-Booking Rate
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Booking Revenue</span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{(salesManagerTotals.revenue / 10000000).toFixed(2)} Cr</p>
              <span className="text-[10px] text-slate-500 font-medium">₹{salesManagerTotals.revenue.toLocaleString('en-IN')} Total Value</span>
            </div>
          </div>

          {/* Recharts Bar Chart - Sales Manager Performance */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-500" />
              Sales Manager Comparison (Assigned vs Site Visited vs Booked Deals)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockSalesManagerReportData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(val: any) => Number(val).toLocaleString()} />
                  <Legend formatter={(val) => <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{val}</span>} />
                  <Bar dataKey="totalLeadsAssigned" name="Assigned Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalSiteVisitsVisited" name="Site Visited" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalLeadsBooked" name="Deals Booked" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Manager Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Sales Manager Metrics Breakdown</h3>
              <span className="text-xs text-slate-400">{filteredSalesManagers.length} Sales Managers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3.5">Sales Manager</th>
                    <th className="p-3.5">Region / Team Desk</th>
                    <th className="p-3.5">Assigned Leads</th>
                    <th className="p-3.5">Site Visited</th>
                    <th className="p-3.5">Deals Booked</th>
                    <th className="p-3.5">Total Revenue (₹)</th>
                    <th className="p-3.5">Visit-to-Booking %</th>
                    <th className="p-3.5">Lead-to-Booking %</th>
                    <th className="p-3.5">Target %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSalesManagers.map(sm => (
                    <tr key={sm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                        <img src={sm.avatar} alt={sm.name} className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        <span>{sm.name}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">{sm.regionOrTeam}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{sm.totalLeadsAssigned.toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">{sm.totalSiteVisitsVisited.toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">{sm.totalLeadsBooked.toLocaleString()}</td>
                      <td className="p-3.5 font-extrabold text-amber-600 dark:text-amber-400">₹{(sm.totalRevenueINR / 100000).toFixed(2)} Lakhs</td>
                      <td className="p-3.5 font-bold text-emerald-600">{sm.visitToBookingRatePct}%</td>
                      <td className="p-3.5 font-bold text-indigo-600">{sm.overallLeadToBookingRatePct}%</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sm.targetAchievementPct >= 100
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {sm.targetAchievementPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 1: EXECUTIVE CMO REPORT & PRINT LAYOUT */}
      {activeTab === 'executive' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
          {/* Left Column: Report Selection & Generator Controls (Hidden on Print) */}
          <div className="space-y-6 print:hidden">
          {/* Report Generator Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              Build Executive Brief
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Period Focus</label>
              <select
                value={reportPeriod}
                onChange={e => setReportPeriod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1"
              >
                <option value="Q3 2026">Q3 2026 (Current)</option>
                <option value="Q2 2026">Q2 2026</option>
                <option value="YTD 2026">YTD 2026</option>
              </select>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isGenerating ? 'Synthesizing Data...' : 'Generate AI Report'}</span>
            </button>
          </div>

          {/* Archived Reports List */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Report Archive
            </h3>

            <div className="space-y-2">
              {reports.map(rep => (
                <button
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    activeReport?.id === rep.id
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-100 font-bold'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <p className="truncate">{rep.title}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-normal mt-1">
                    <span>{rep.period}</span>
                    <span>{new Date(rep.generatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Printable Executive Report Document */}
        <div className="lg:col-span-2 print:w-full">
          {activeReport ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 print:border-none print:shadow-none print:p-0">
              {/* Document Header Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
                <span className="text-xs font-semibold text-slate-500">Document ID: {activeReport.id}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>

                  <button
                    onClick={handlePrintPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold transition-all shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>

              {/* Printable Brief Body */}
              <div className="space-y-6">
                <div className="border-b-2 border-indigo-600 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">AI CMO Executive Brief</span>
                    <span className="text-xs font-semibold text-slate-500">{activeReport.period}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{activeReport.title}</h1>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <img
                        src="/ombir_photo.svg"
                        alt={activeReport.author}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30 bg-slate-800"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Prepared by <strong>{activeReport.author}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">{new Date(activeReport.generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* 1. Key Numbers Summary Cards & Table */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">1. Executive Performance Summary Metrics</h3>
                  <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Revenue</span>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">₹{activeReport.totalRevenue.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Spend</span>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">₹{activeReport.totalSpend.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Overall ROI</span>
                      <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{activeReport.overallROI}x</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Conversions</span>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{activeReport.totalConversions}</p>
                    </div>
                  </div>
                </div>

                {/* Executive Summary Paragraph */}
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">2. Executive Performance Narrative</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {activeReport.summary}
                  </p>
                </div>

                {/* Strategic Insights */}
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">3. Strategic AI Recommendations</h3>
                  <ul className="space-y-2">
                    {activeReport.aiInsightsSummary.map((ins, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50/60 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recharts Data Visualization Section inside Report */}
                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    4. Campaign Spend vs Revenue Visual Analysis
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Recharts Bar Chart */}
                    <div className="md:col-span-2 h-64 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeReport.topCampaigns} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="name" fontSize={10} tickLine={false} />
                          <YAxis fontSize={10} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                          <Legend formatter={(val) => <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{val}</span>} />
                          <Bar dataKey="spend" name="Spend (₹)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Recharts Pie Chart */}
                    <div className="h-64 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">Revenue Share by Campaign</div>
                      <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                          <Pie
                            data={activeReport.topCampaigns}
                            dataKey="revenue"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={55}
                            innerRadius={25}
                          >
                            {activeReport.topCampaigns.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Top Campaign Table */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-500" />
                    5. Detailed Campaign Performance Breakdown Table
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-2.5 font-bold">Campaign</th>
                          <th className="p-2.5 font-bold">Project</th>
                          <th className="p-2.5 font-bold">Channel</th>
                          <th className="p-2.5 font-bold">Spend</th>
                          <th className="p-2.5 font-bold">Revenue</th>
                          <th className="p-2.5 font-bold">Net Profit</th>
                          <th className="p-2.5 font-bold">ROI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {activeReport.topCampaigns.map((c, idx) => {
                          const projects = ['Aura Heights', 'Grand Skylight', 'Emerald Towers', 'Greenfield Residency', 'Royal Palms Estate'];
                          return (
                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
                                  {projects[idx % projects.length]}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">{c.channel}</td>
                              <td className="p-2.5 text-amber-600 font-semibold">₹{c.spend.toLocaleString('en-IN')}</td>
                              <td className="p-2.5 font-bold text-emerald-600">₹{c.revenue.toLocaleString('en-IN')}</td>
                              <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">₹{(c.revenue - c.spend).toLocaleString('en-IN')}</td>
                              <td className="p-2.5 font-bold text-indigo-600">{c.roi}x</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 6: Presales Member Lead Summary */}
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    6. Presales Member-Wise Total Lead Breakdown
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-2.5 font-bold">Presales Member</th>
                          <th className="p-2.5 font-bold">Role</th>
                          <th className="p-2.5 font-bold">Total Handled</th>
                          <th className="p-2.5 font-bold">Pushed to Sales</th>
                          <th className="p-2.5 font-bold">Unqualified</th>
                          <th className="p-2.5 font-bold">Visits Scheduled</th>
                          <th className="p-2.5 font-bold">Push Rate %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {mockPresalesMembersReportData.map(m => (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{m.name}</td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-300">{m.role}</td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{m.totalLeadsHandled.toLocaleString()}</td>
                            <td className="p-2.5 font-bold text-emerald-600">{m.totalLeadsPushed.toLocaleString()}</td>
                            <td className="p-2.5 font-semibold text-rose-500">{m.unqualifiedLeads.toLocaleString()}</td>
                            <td className="p-2.5 font-bold text-indigo-600">{m.siteVisitsScheduled.toLocaleString()}</td>
                            <td className="p-2.5 font-extrabold text-emerald-600">{m.pushRatePct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 7: Sales Manager Lead & Booking Summary */}
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    7. Sales Manager-Wise Total Lead, Visit & Booking Report
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-2.5 font-bold">Sales Manager</th>
                          <th className="p-2.5 font-bold">Region / Desk</th>
                          <th className="p-2.5 font-bold">Assigned Leads</th>
                          <th className="p-2.5 font-bold">Site Visited</th>
                          <th className="p-2.5 font-bold">Deals Booked</th>
                          <th className="p-2.5 font-bold">Total Revenue (₹)</th>
                          <th className="p-2.5 font-bold">Visit-to-Booking %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {mockSalesManagerReportData.map(sm => (
                          <tr key={sm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{sm.name}</td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-300">{sm.regionOrTeam}</td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{sm.totalLeadsAssigned.toLocaleString()}</td>
                            <td className="p-2.5 font-bold text-indigo-600">{sm.totalSiteVisitsVisited.toLocaleString()}</td>
                            <td className="p-2.5 font-bold text-emerald-600">{sm.totalLeadsBooked.toLocaleString()}</td>
                            <td className="p-2.5 font-extrabold text-amber-600">₹{(sm.totalRevenueINR / 100000).toFixed(2)} Lakhs</td>
                            <td className="p-2.5 font-bold text-emerald-600">{sm.visitToBookingRatePct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 8: Project-Wise Lead & Revenue Summary */}
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-500" />
                    8. Project-Wise Lead & Revenue Performance
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-2.5 font-bold">Project Name</th>
                          <th className="p-2.5 font-bold">Top Channel</th>
                          <th className="p-2.5 font-bold">Total Leads</th>
                          <th className="p-2.5 font-bold">Pushed to Sales</th>
                          <th className="p-2.5 font-bold">Site Visits</th>
                          <th className="p-2.5 font-bold">Bookings</th>
                          <th className="p-2.5 font-bold">Revenue (Cr ₹)</th>
                          <th className="p-2.5 font-bold">ROI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {mockProjectWiseReportData.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{p.projectName}</td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-300">{p.topChannel}</td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{p.totalLeads.toLocaleString()}</td>
                            <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">{p.pushedToSales.toLocaleString()}</td>
                            <td className="p-2.5 font-bold text-emerald-600">{p.siteVisits.toLocaleString()}</td>
                            <td className="p-2.5 font-bold text-indigo-600">{p.bookings}</td>
                            <td className="p-2.5 font-extrabold text-amber-600">₹{(p.totalRevenueINR / 10000000).toFixed(2)} Cr</td>
                            <td className="p-2.5 font-bold text-emerald-600">{p.roi}x</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">Select or generate a report to preview.</div>
          )}
        </div>
      </div>
      )}

      {/* VIEW TAB 4: PROJECT-WISE LEAD & REVENUE REPORT */}
      {activeTab === 'project_wise' && (
        <div className="space-y-6 print:block">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Project Portfolio Report
                </span>
                <span className="text-xs text-slate-400">• {reportPeriod} Audit</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-500" />
                Project-Wise Lead & Revenue Performance Audit
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive breakdown of marketing spend, site visits, bookings, and revenue across active real estate projects
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportProjectReportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Project Report (.csv)</span>
              </button>
              <button
                onClick={handlePrintPDF}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Total Active Projects</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{mockProjectWiseReportData.length}</div>
              <div className="text-[11px] text-emerald-500 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> 100% Portfolio Operational
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Top Performing Project</div>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 truncate">Aura Heights</div>
              <div className="text-[11px] text-slate-400 mt-1">₹28.00 Cr Revenue (4.8x ROI)</div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Total Project Leads</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {mockProjectWiseReportData.reduce((acc, p) => acc + p.totalLeads, 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-indigo-500 font-medium mt-1">Across 5 Primary Channels</div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Total Portfolio Revenue</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                ₹{(mockProjectWiseReportData.reduce((acc, p) => acc + p.totalRevenueINR, 0) / 10000000).toFixed(2)} Cr
              </div>
              <div className="text-[11px] text-emerald-500 font-medium mt-1">Overall Portfolio ROI: 4.3x</div>
            </div>
          </div>

          {/* Search Filter & Table */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-500" />
                Project-Wise Performance Metrics
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by project name or location..."
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 outline-none border border-transparent focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-3 font-bold">Project Name</th>
                    <th className="p-3 font-bold">Location</th>
                    <th className="p-3 font-bold">Top Lead Channel</th>
                    <th className="p-3 font-bold">Total Leads</th>
                    <th className="p-3 font-bold">Unqualified</th>
                    <th className="p-3 font-bold">Pushed to Sales</th>
                    <th className="p-3 font-bold">Site Visits</th>
                    <th className="p-3 font-bold">Bookings</th>
                    <th className="p-3 font-bold">Booking Revenue (₹)</th>
                    <th className="p-3 font-bold">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mockProjectWiseReportData
                    .filter(p => p.projectName.toLowerCase().includes(projectSearch.toLowerCase()) || p.location.toLowerCase().includes(projectSearch.toLowerCase()))
                    .map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>{p.projectName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{p.location}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                            {p.topChannel}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.totalLeads.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-rose-500">
                          <span>{p.presalesUnqualified.toLocaleString()}</span>
                          <span className="text-[10px] font-normal text-rose-500/80 dark:text-rose-400/80 ml-1">
                            ({p.totalLeads > 0 ? ((p.presalesUnqualified / p.totalLeads) * 100).toFixed(1) : '0.0'}%)
                          </span>
                        </td>
                        <td className="p-3 font-medium">
                          <span>{p.pushedToSales.toLocaleString()}</span>
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 ml-1">
                            ({p.totalLeads > 0 ? ((p.pushedToSales / p.totalLeads) * 100).toFixed(1) : '0.0'}%)
                          </span>
                        </td>
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                          <span>{p.siteVisits.toLocaleString()}</span>
                          <span className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 ml-1">
                            ({p.totalLeads > 0 ? ((p.siteVisits / p.totalLeads) * 100).toFixed(1) : '0.0'}%)
                          </span>
                        </td>
                        <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{p.bookings}</td>
                        <td className="p-3 font-extrabold text-amber-600 dark:text-amber-400">₹{(p.totalRevenueINR / 10000000).toFixed(2)} Cr</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {p.roi}x
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

