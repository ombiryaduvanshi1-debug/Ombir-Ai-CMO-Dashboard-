import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Upload,
  FileSpreadsheet,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Calendar
} from 'lucide-react';
import Papa from 'papaparse';

interface ChannelBudget {
  channel: string;
  spend: number;
  leads: number;
  conversions: number;
  revenue: number;
}

export const ROICalculatorWidget: React.FC = () => {
  // Time Period State
  const [timePeriod, setTimePeriod] = useState<'daily' | 'monthly' | 'yearly' | 'all_time' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');

  // Calculator state
  const [baseSpend, setBaseSpend] = useState<number>(150000);
  const [baseLeads, setBaseLeads] = useState<number>(600);
  const [conversionRate, setConversionRate] = useState<number>(5.0); // %
  const [avgDealValue, setAvgDealValue] = useState<number>(25000);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [channelBudgets, setChannelBudgets] = useState<ChannelBudget[]>([
    { channel: 'Google Search Ads', spend: 60000, leads: 240, conversions: 12, revenue: 300000 },
    { channel: 'Meta Paid Social', spend: 45000, leads: 210, conversions: 10, revenue: 250000 },
    { channel: 'LinkedIn B2B Ads', spend: 30000, leads: 90, conversions: 5, revenue: 125000 },
    { channel: 'Email Marketing', spend: 15000, leads: 60, conversions: 3, revenue: 75000 }
  ]);
  const [pushedLeadAnimation, setPushedLeadAnimation] = useState<boolean>(false);
  const [lastPushMessage, setLastPushMessage] = useState<string | null>(null);

  // Scale marketing spend & leads based on selected time period
  const periodMultiplier = useMemo(() => {
    switch (timePeriod) {
      case 'daily':
        return 1 / 30;
      case 'monthly':
        return 1;
      case 'yearly':
        return 12;
      case 'all_time':
        return 36;
      case 'custom':
        return 0.5; // 15 days default simulation
      default:
        return 1;
    }
  }, [timePeriod]);

  const marketingSpend = useMemo(() => {
    return Math.round(baseSpend * periodMultiplier);
  }, [baseSpend, periodMultiplier]);

  const totalLeads = useMemo(() => {
    return Math.max(1, Math.round(baseLeads * periodMultiplier));
  }, [baseLeads, periodMultiplier]);

  // Calculations
  const calculatedConversions = useMemo(() => {
    return Math.round(totalLeads * (conversionRate / 100));
  }, [totalLeads, conversionRate]);

  const grossRevenue = useMemo(() => {
    return calculatedConversions * avgDealValue;
  }, [calculatedConversions, avgDealValue]);

  const netProfit = useMemo(() => {
    return grossRevenue - marketingSpend;
  }, [grossRevenue, marketingSpend]);

  const roiPercentage = useMemo(() => {
    if (marketingSpend <= 0) return 0;
    return ((netProfit) / marketingSpend) * 100;
  }, [netProfit, marketingSpend]);

  const roiMultiplier = useMemo(() => {
    if (marketingSpend <= 0) return 0;
    return (grossRevenue / marketingSpend).toFixed(2);
  }, [grossRevenue, marketingSpend]);

  const costPerLead = useMemo(() => {
    if (totalLeads <= 0) return 0;
    return marketingSpend / totalLeads;
  }, [marketingSpend, totalLeads]);

  const costPerAcquisition = useMemo(() => {
    if (calculatedConversions <= 0) return 0;
    return marketingSpend / calculatedConversions;
  }, [marketingSpend, calculatedConversions]);

  // Handle Excel/CSV upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let totalSpendFromCSV = 0;
        let totalLeadsFromCSV = 0;
        let totalConversionsFromCSV = 0;
        let totalRevenueFromCSV = 0;
        const parsedChannels: ChannelBudget[] = [];

        results.data.forEach((row: any) => {
          // Normalize column headers
          const keys = Object.keys(row);
          const channelKey = keys.find(k => k.toLowerCase().includes('channel') || k.toLowerCase().includes('campaign') || k.toLowerCase().includes('name')) || keys[0];
          const spendKey = keys.find(k => k.toLowerCase().includes('spend') || k.toLowerCase().includes('budget') || k.toLowerCase().includes('cost'));
          const leadsKey = keys.find(k => k.toLowerCase().includes('lead') || k.toLowerCase().includes('click') || k.toLowerCase().includes('target'));
          const convKey = keys.find(k => k.toLowerCase().includes('conv') || k.toLowerCase().includes('customer') || k.toLowerCase().includes('sale'));
          const revKey = keys.find(k => k.toLowerCase().includes('rev') || k.toLowerCase().includes('sales') || k.toLowerCase().includes('return'));

          const channelName = row[channelKey] || 'Campaign Channel';
          const spendVal = parseFloat(String(row[spendKey] || 0).replace(/[^0-9.]/g, '')) || 0;
          const leadsVal = parseInt(String(row[leadsKey] || 0).replace(/[^0-9]/g, '')) || 0;
          const convVal = parseInt(String(row[convKey] || 0).replace(/[^0-9]/g, '')) || 0;
          const revVal = parseFloat(String(row[revKey] || 0).replace(/[^0-9.]/g, '')) || 0;

          if (spendVal > 0 || leadsVal > 0) {
            totalSpendFromCSV += spendVal;
            totalLeadsFromCSV += leadsVal;
            totalConversionsFromCSV += convVal;
            totalRevenueFromCSV += revVal;

            parsedChannels.push({
              channel: channelName,
              spend: spendVal,
              leads: leadsVal || 50,
              conversions: convVal || Math.round(leadsVal * 0.05),
              revenue: revVal || (convVal || Math.round(leadsVal * 0.05)) * 2000
            });
          }
        });

        if (totalSpendFromCSV > 0) {
          setBaseSpend(Math.round(totalSpendFromCSV / periodMultiplier));
        }
        if (totalLeadsFromCSV > 0) {
          setBaseLeads(Math.round(totalLeadsFromCSV / periodMultiplier));
        }
        if (totalLeadsFromCSV > 0 && totalConversionsFromCSV > 0) {
          const calcRate = parseFloat(((totalConversionsFromCSV / totalLeadsFromCSV) * 100).toFixed(2));
          if (calcRate > 0) setConversionRate(calcRate);
        }
        if (totalConversionsFromCSV > 0 && totalRevenueFromCSV > 0) {
          setAvgDealValue(Math.round(totalRevenueFromCSV / totalConversionsFromCSV));
        }

        if (parsedChannels.length > 0) {
          setChannelBudgets(parsedChannels);
        }

        setLastPushMessage(`Successfully imported budget & lead metrics from "${file.name}"!`);
        setTimeout(() => setLastPushMessage(null), 4000);
      },
      error: (err) => {
        console.error('Error parsing file:', err);
      }
    });
  };

  // Push Lead action
  const handlePushLead = (amount: number = 1) => {
    setBaseLeads(prev => prev + Math.max(1, Math.round(amount / periodMultiplier)));
    setPushedLeadAnimation(true);
    setTimeout(() => setPushedLeadAnimation(false), 800);

    const incrementalConversions = Math.max(1, Math.round(amount * (conversionRate / 100)));
    const incrementalRevenue = incrementalConversions * avgDealValue;

    setLastPushMessage(`+${amount} Lead(s) Pushed! Re-calculated CPL: ₹${(marketingSpend / (totalLeads + amount)).toFixed(2)} & Est. Revenue: +₹${incrementalRevenue.toLocaleString('en-IN')}`);
    setTimeout(() => setLastPushMessage(null), 4000);
  };

  // Download Sample Excel/CSV Budget Template
  const handleDownloadSampleCSV = () => {
    const csvData = [
      ['Channel', 'Budget_Spend_INR', 'Target_Leads', 'Conversions', 'Expected_Revenue_INR'],
      ['Google Search Ads', '120000', '480', '24', '600000'],
      ['Meta Social Ads', '85000', '390', '18', '450000'],
      ['LinkedIn B2B', '60000', '150', '9', '225000'],
      ['SEO & Content', '35000', '280', '14', '350000'],
      ['Email Marketing', '20000', '120', '8', '200000']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_marketing_budget_leads_inr.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetDefaults = () => {
    setBaseSpend(150000);
    setBaseLeads(600);
    setConversionRate(5.0);
    setAvgDealValue(25000);
    setUploadedFileName(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Calculator className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
              Marketing ROI & Cost Per Lead (CPL) Calculator
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Excel / CSV Upload Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Calculate instant Return on Investment (ROI), Cost Per Lead (CPL), and Customer Acquisition Costs (CPA) from marketing spend and lead pushes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDefaults}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Reset to defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDownloadSampleCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sample Excel CSV</span>
          </button>
        </div>
      </div>

      {/* Time Period & Date Range Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
            <Calendar className="w-4 h-4 text-indigo-500" /> Time Horizon:
          </span>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'monthly', label: 'Month-Wise' },
              { id: 'yearly', label: 'Yearly' },
              { id: 'all_time', label: 'All Time' },
              { id: 'custom', label: 'Custom Range' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setTimePeriod(p.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timePeriod === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Selector if Custom is selected */}
        {timePeriod === 'custom' && (
          <div className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">End Date:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Push Lead / Upload Notification Toast */}
      {lastPushMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{lastPushMessage}</span>
          </div>
        </div>
      )}

      {/* Primary KPI Outputs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* ROI Metric Card */}
        <div className={`p-4 rounded-2xl border transition-all ${
          roiPercentage >= 0
            ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30'
            : 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-red-500/30'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Marketing ROI</span>
            <TrendingUp className={`w-4 h-4 ${roiPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl md:text-3xl font-black ${roiPercentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {roiPercentage.toFixed(1)}%
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              ({roiMultiplier}x return)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Net Profit: ₹{netProfit.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Cost Per Lead (CPL) Card */}
        <div className={`p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 transition-all ${
          pushedLeadAnimation ? 'ring-2 ring-indigo-500 shadow-lg scale-105' : ''
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Cost Per Lead (CPL)</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            ₹{costPerLead.toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Total Inbound Leads: {totalLeads.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Cost Per Acquisition (CPA) Card */}
        <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Cost Per Acquisition (CAC)</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400">
            ₹{costPerAcquisition.toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Conversions: {calculatedConversions.toLocaleString('en-IN')} customers
          </p>
        </div>

        {/* Gross Revenue Card */}
        <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Est. Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400">
            ₹{grossRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Avg Deal Size: ₹{avgDealValue.toLocaleString('en-IN')}
          </p>
        </div>

      </div>

      {/* Controls & Inputs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Left Column: Excel/CSV File Upload & Push Lead Action */}
        <div className="space-y-4">
          
          {/* Excel/CSV File Upload Box */}
          <div className="p-5 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-slate-800/30 hover:border-indigo-400 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Upload Budget & Lead Spreadsheet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Import Excel or CSV budget sheets to auto-fill spend & lead volumes.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20">
                <Upload className="w-4 h-4" />
                <span>{uploadedFileName ? 'Change Budget File' : 'Choose Excel / CSV File'}</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadedFileName && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate max-w-[200px]">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  {uploadedFileName}
                </span>
              )}
            </div>
          </div>

          {/* Interactive "Push Lead" Trigger Box */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Push Live Lead Simulator
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instantly push new leads into the pipeline to watch CPL and ROI update live.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => handlePushLead(1)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Push +1 Lead</span>
              </button>

              <button
                onClick={() => handlePushLead(25)}
                className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95"
              >
                +25 Leads
              </button>

              <button
                onClick={() => handlePushLead(100)}
                className="py-2.5 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/20 active:scale-95"
              >
                +100 Leads
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Scenario Sliders & Direct Inputs */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Adjust Campaign Variables</span>
            <span className="text-[11px] font-normal text-slate-500">Live ROI Forecast</span>
          </h4>

          {/* Marketing Spend Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Total Marketing Budget Spend (₹)</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">₹{marketingSpend.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="5000"
              max="1000000"
              step="5000"
              value={marketingSpend}
              onChange={(e) => setBaseSpend(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Total Leads Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Total Inbound Leads</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{totalLeads.toLocaleString('en-IN')} leads</span>
            </div>
            <input
              type="range"
              min="10"
              max="5000"
              step="10"
              value={totalLeads}
              onChange={(e) => setBaseLeads(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Lead Conversion Rate % Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Lead-to-Customer Conversion Rate (%)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{conversionRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="25.0"
              step="0.5"
              value={conversionRate}
              onChange={(e) => setConversionRate(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Average Deal Size / Customer LTV (₹) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Average Customer Deal Value (₹)</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">₹{avgDealValue.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="200000"
              step="1000"
              value={avgDealValue}
              onChange={(e) => setAvgDealValue(Number(e.target.value))}
              className="w-full accent-amber-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

        </div>

      </div>

      {/* Multi-Channel Budget & CPL Breakdown Table */}
      {channelBudgets.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Channel Budget & Cost Per Lead Breakdown</span>
            <span className="text-[10px] text-slate-400">{channelBudgets.length} Channels Imported</span>
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-2.5 font-bold">Marketing Channel</th>
                  <th className="p-2.5 font-bold">Budget Spend (₹)</th>
                  <th className="p-2.5 font-bold">Leads</th>
                  <th className="p-2.5 font-bold">Est. CPL (₹)</th>
                  <th className="p-2.5 font-bold">Conversions</th>
                  <th className="p-2.5 font-bold">Channel Revenue (₹)</th>
                  <th className="p-2.5 font-bold">Channel ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {channelBudgets.map((ch, idx) => {
                  const chCpl = ch.leads > 0 ? (ch.spend / ch.leads).toFixed(2) : '0.00';
                  const chRoi = ch.spend > 0 ? ((ch.revenue - ch.spend) / ch.spend * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{ch.channel}</td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300 font-semibold">₹{ch.spend.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-bold">{ch.leads.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-slate-900 dark:text-slate-100 font-bold">₹{chCpl}</td>
                      <td className="p-2.5 text-emerald-600 font-semibold">{ch.conversions}</td>
                      <td className="p-2.5 text-amber-600 font-bold">₹{ch.revenue.toLocaleString('en-IN')}</td>
                      <td className={`p-2.5 font-bold ${Number(chRoi) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {chRoi}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
