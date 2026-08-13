import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Zap,
  Target,
  DollarSign,
  ShieldAlert,
  BrainCircuit,
  Sliders
} from 'lucide-react';
import { AIInsight } from '../types';
import { api } from '../lib/api';

export const AIInsightsView: React.FC = () => {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [customFocus, setCustomFocus] = useState('');

  const fetchInsights = async (prompt?: string) => {
    setLoading(true);
    try {
      const data = await api.runAIAnalysis(prompt || customFocus);
      setInsight(data);
    } catch (e) {
      console.error('Failed to run AI analysis', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-purple-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Gemini 3.6 Flash Engine
            </span>
            <span className="text-xs text-slate-400">• Continuous LLM Performance Auditing</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Automated CMO Strategic Analysis
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            AI-driven anomaly detection, root cause breakdown, and ROI growth recommendations derived from CRM and campaign data.
          </p>
        </div>

        <button
          onClick={() => fetchInsights()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Run Analysis</span>
        </button>
      </div>

      {/* Custom Focus Prompt Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <Sliders className="w-5 h-5 text-indigo-500 shrink-0" />
        <input
          type="text"
          value={customFocus}
          onChange={e => setCustomFocus(e.target.value)}
          placeholder="Specify a focus area (e.g., 'Analyze Q3 Paid Search CAC spikes and budget optimization')..."
          className="flex-1 bg-slate-100 dark:bg-slate-800/80 text-xs rounded-xl px-4 py-2 border border-transparent focus:border-indigo-500 outline-none"
        />
        <button
          onClick={() => fetchInsights(customFocus)}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 disabled:opacity-50"
        >
          Analyze Focus Area
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Synthesizing Multi-Channel Metrics & CRM Pipeline...
          </p>
          <p className="text-xs text-slate-400 mt-1">Detecting anomalies, CAC deviations, and budget allocation scenarios.</p>
        </div>
      ) : insight ? (
        <div className="space-y-8">
          {/* Executive Summary Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Executive Strategy Summary
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {insight.summary}
            </p>
          </div>

          {/* Anomaly Detection Section */}
          {insight.anomaliesDetected && insight.anomaliesDetected.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  Detected Anomalies & Root Causes
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
                  {insight.anomaliesDetected.length} Critical
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insight.anomaliesDetected.map((an, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-rose-900 dark:text-rose-200">{an.metric}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                        {an.deviation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                      <strong className="text-slate-800 dark:text-slate-100">Probable Root Cause:</strong> {an.cause}
                    </p>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1.5 pt-2 border-t border-rose-200/60 dark:border-rose-900/50">
                      <Zap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{an.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insights List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              Key Marketing Insights & Findings
            </h3>
            <div className="space-y-3">
              {insight.keyInsights.map((ki, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{ki}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              Prioritized Strategic Action Plan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insight.actionableRecommendations.map((act, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        act.priority === 'high'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {act.priority} Priority
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {act.impact}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">{act.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{act.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    <span className="uppercase tracking-wider opacity-80">Category: {act.category}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
