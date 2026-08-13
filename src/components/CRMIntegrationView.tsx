import React, { useState, useEffect } from 'react';
import {
  Workflow,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sliders,
  Key,
  Globe,
  Database,
  ArrowRight,
  Clock,
  Shield,
  Layers,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { CRMConnection, CRMRecord } from '../types';
import { api } from '../lib/api';

export const CRMIntegrationView: React.FC = () => {
  const [connections, setConnections] = useState<CRMConnection[]>([]);
  const [crmRecords, setCrmRecords] = useState<CRMRecord[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<CRMConnection | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [instanceUrlInput, setInstanceUrlInput] = useState('');
  const [autoSyncInput, setAutoSyncInput] = useState(true);
  const [syncIntervalInput, setSyncIntervalInput] = useState(15);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filters for CRM Records table
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const loadData = async () => {
    try {
      const [connData, recordsData] = await Promise.all([
        api.getCRMConnections().catch(() => []),
        api.getCRMRecords().catch(() => [])
      ]);
      setConnections(connData);
      setCrmRecords(recordsData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncNow = async (id: string) => {
    setSyncingId(id);
    setStatusMessage(null);
    try {
      const res = await api.syncCRM(id);
      setStatusMessage(`Sync successful! Pulled ${res.syncedLeads} new leads & ${res.syncedDeals} deals.`);
      loadData();
    } catch (err) {
      console.error(err);
      setStatusMessage('Sync failed. Please check API key/instance URL.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleOpenConfig = (conn: CRMConnection) => {
    setSelectedConfig(conn);
    setApiKeyInput(conn.apiKey || '');
    setInstanceUrlInput(conn.instanceUrl || '');
    setAutoSyncInput(conn.autoSync);
    setSyncIntervalInput(conn.syncIntervalMinutes || 15);
  };

  const handleSaveConfig = async () => {
    if (!selectedConfig) return;
    try {
      await api.connectCRM({
        id: selectedConfig.id,
        apiKey: apiKeyInput,
        instanceUrl: instanceUrlInput,
        autoSync: autoSyncInput,
        syncIntervalMinutes: syncIntervalInput
      });
      setSelectedConfig(null);
      loadData();
      setStatusMessage(`Updated settings for ${selectedConfig.name}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered CRM Records
  const filteredRecords = crmRecords.filter(rec => {
    const matchesSearch =
      !searchQuery ||
      rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.company && rec.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.email && rec.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProvider = providerFilter === 'all' || rec.provider === providerFilter;
    const matchesType = typeFilter === 'all' || rec.type === typeFilter;
    return matchesSearch && matchesProvider && matchesType;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 md:p-8 space-y-6 sm:space-y-8 overflow-x-hidden text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-xl border border-amber-500/20 w-full overflow-hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Bi-Directional REST Connectors
            </span>
            <span className="text-xs text-slate-400">• Enterprise CRM Pipeline Sync</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
            <Workflow className="w-6 h-6 text-amber-400 shrink-0" />
            CRM Integration & Pipeline Connectors
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Synchronize leads, qualified opportunities, deals, and campaign spend directly with Salesforce, Zoho CRM, and HubSpot.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2 break-words">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* CRM Connectors Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {connections.map(conn => {
          const isConnected = conn.status === 'connected';
          const isSyncing = syncingId === conn.id;

          return (
            <div
              key={conn.id}
              className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-amber-500/40 transition-all w-full min-w-0"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    {conn.provider === 'google_analytics' ? <Globe className="w-5 h-5 text-amber-500" /> : <Workflow className="w-5 h-5 text-amber-500" />}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {conn.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1 truncate">{conn.name}</h3>
                <p className="text-xs text-slate-500 truncate mb-4">{conn.instanceUrl || 'Not configured'}</p>

                <div className="space-y-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Synced Leads:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{conn.totalSyncedLeads.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Synced Deals:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{conn.totalSyncedDeals.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Last Synced:</span>
                    <span className="font-medium text-slate-600 dark:text-slate-400 truncate">
                      {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button
                  onClick={() => handleSyncNow(conn.id)}
                  disabled={isSyncing || !isConnected}
                  className="flex-1 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  onClick={() => handleOpenConfig(conn)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700"
                  title="Configure REST Settings"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Synced CRM Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-6 space-y-4 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-500" />
              Synced CRM Records & Opportunities ({filteredRecords.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live normalized lead and pipeline records ingested from connected CRM accounts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search leads, companies..."
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <select
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Providers</option>
              <option value="salesforce" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Salesforce</option>
              <option value="zoho" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Zoho CRM</option>
              <option value="hubspot" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">HubSpot</option>
            </select>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 min-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3">Contact / Lead</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Stage / Status</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{rec.name}</div>
                      {rec.company && <div className="text-[11px] text-slate-500">{rec.company}</div>}
                    </td>
                    <td className="py-2.5 px-3 capitalize">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {rec.provider}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 capitalize font-medium">{rec.type}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {rec.statusOrStage}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {rec.valueINR ? `₹${rec.valueINR.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{rec.assignedTo || 'Unassigned'}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">{rec.lastActivity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No CRM records found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Modal */}
      {selectedConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 my-auto">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500 shrink-0" />
              <span>Configure {selectedConfig.name} Connection</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Instance Base URL</label>
                <input
                  type="text"
                  value={instanceUrlInput}
                  onChange={e => setInstanceUrlInput(e.target.value)}
                  placeholder="https://your-instance.my.salesforce.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">OAuth Bearer Token / API Key</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="sf_oauth_token_..."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enable Auto-Sync Schedule</span>
                <input
                  type="checkbox"
                  checked={autoSyncInput}
                  onChange={e => setAutoSyncInput(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              {autoSyncInput && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sync Interval (Minutes)</label>
                  <select
                    value={syncIntervalInput}
                    onChange={e => setSyncIntervalInput(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-slate-100"
                  >
                    <option value={15} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Every 15 Minutes</option>
                    <option value={30} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Every 30 Minutes</option>
                    <option value={60} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Every 1 Hour</option>
                    <option value={1440} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Every 24 Hours</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedConfig(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 shadow-md shadow-amber-600/20"
              >
                Save & Authenticate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

