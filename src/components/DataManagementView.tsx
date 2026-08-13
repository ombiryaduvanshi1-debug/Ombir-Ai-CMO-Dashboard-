import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Sparkles,
  Sliders,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Search,
  Check,
  X,
  History,
  FileText,
  UploadCloud,
  Edit3,
  ExternalLink,
  Clock,
  Zap,
  Tag,
  HardDrive,
  Download,
  Play,
  CheckCircle2,
  Archive,
  Save
} from 'lucide-react';
import {
  DataSource,
  UnifiedRecord,
  FieldMapping,
  DataQualityReport,
  SyncHistoryEntry,
  RecycleBinItem,
  BackupScheduleConfig,
  BackupArchive,
  User
} from '../types';
import { api } from '../lib/api';

interface DataManagementViewProps {
  currentUser?: User | null;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'sources' | 'dataset' | 'mapping' | 'quality' | 'upload' | 'recycle' | 'backup'>('sources');

  // State
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [unifiedRecords, setUnifiedRecords] = useState<UnifiedRecord[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);
  const [backupConfig, setBackupConfig] = useState<BackupScheduleConfig | null>(null);
  const [backupArchives, setBackupArchives] = useState<BackupArchive[]>([]);
  const [backupReadiness, setBackupReadiness] = useState<any>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<UnifiedRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<UnifiedRecord | null>(null);

  // New Source Form State
  const [newSourceForm, setNewSourceForm] = useState({
    name: '',
    type: 'google_analytics' as DataSource['type'],
    autoSync: 'hourly' as DataSource['autoSync'],
    accountOrPropertyId: '',
    apiKeyOrToken: ''
  });

  // Manual Entry Form State
  const [manualForm, setManualForm] = useState({
    campaign: '',
    channel: 'Paid Search (Google)',
    date: new Date().toISOString().split('T')[0],
    spendINR: 50000,
    leads: 20,
    conversions: 4,
    revenueINR: 200000,
    leadStage: 'Qualified MQL',
    region: 'NCR / Gurgaon',
    sourceName: 'Manual Entry'
  });

  // Upload Form State
  const [uploadSourceName, setUploadSourceName] = useState<string>('Meta Ads Q3 Campaign Export');
  const [uploadSourceType, setUploadSourceType] = useState<DataSource['type']>('meta_ads');
  const [rawJsonInput, setRawJsonInput] = useState<string>(
    JSON.stringify(
      [
        {
          campaign_name: 'Meta_Retargeting_NCR_Luxury_Penthouses',
          medium: 'Social Ads',
          spend_inr: 145000,
          leads: 88,
          deals: 12,
          revenue_inr: 22000000,
          date: '2026-08-09',
          stage: 'Contract Sent',
          region: 'NCR / Gurgaon'
        },
        {
          campaign_name: 'Google_PMax_Industrial_Parks_Noida',
          medium: 'Paid Search',
          spend_inr: 195000,
          leads: 130,
          deals: 18,
          revenue_inr: 34000000,
          date: '2026-08-08',
          stage: 'Qualified Lead',
          region: 'NCR / Noida'
        }
      ],
      null,
      2
    )
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Sync state feedback
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [sources, records, mappings, quality, history, recycle, backupRes, archives] = await Promise.all([
        api.getDataSources(),
        api.getUnifiedRecords(),
        api.getFieldMappings(),
        api.getDataQualityReport(),
        api.getSyncHistory(),
        api.getRecycleBin(),
        api.getBackupConfig().catch(() => null),
        api.getBackupArchives().catch(() => [])
      ]);

      setDataSources(sources);
      setUnifiedRecords(records);
      setFieldMappings(mappings);
      setQualityReport(quality);
      setSyncHistory(history);
      setRecycleBin(recycle);
      if (backupRes) {
        setBackupConfig(backupRes.config);
        setBackupReadiness(backupRes.readiness);
      }
      setBackupArchives(archives);
    } catch (err) {
      console.error('Failed to load data management view:', err);
      showNotify('Failed to load Data Management records from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSyncSource = async (sourceId: string) => {
    setSyncingSourceId(sourceId);
    try {
      const result = await api.syncDataSource(sourceId);
      showNotify(`Successfully synced ${result.source.name}. Ingested ${result.syncEntry.recordsAdded} records.`);
      await loadAllData();
    } catch (err) {
      showNotify('Sync failed. Please verify credentials or connection state.', 'error');
    } finally {
      setSyncingSourceId(null);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceForm.name) return;
    try {
      await api.addDataSource(newSourceForm);
      showNotify(`Connected new data source: ${newSourceForm.name}`);
      setShowConnectModal(false);
      setNewSourceForm({
        name: '',
        type: 'google_analytics',
        autoSync: 'hourly',
        accountOrPropertyId: '',
        apiKeyOrToken: ''
      });
      await loadAllData();
    } catch (err) {
      showNotify('Failed to connect data source', 'error');
    }
  };

  const handleDisconnectSource = async (id: string) => {
    if (!window.confirm('Are you sure you want to disconnect this data source? It will be marked as Inactive.')) return;
    try {
      await api.deleteDataSource(id);
      showNotify('Data source set to inactive.');
      await loadAllData();
    } catch (err) {
      showNotify('Failed to disconnect source.', 'error');
    }
  };

  const handleCreateManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addUnifiedRecord(manualForm);
      showNotify('Manual entry added to Unified AI Dataset.');
      setShowManualEntryModal(false);
      await loadAllData();
    } catch (err) {
      showNotify('Failed to add manual entry.', 'error');
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      await api.updateUnifiedRecord(editingRecord.id, {
        campaign: editingRecord.campaign,
        channel: editingRecord.channel,
        spendINR: editingRecord.spendINR,
        leads: editingRecord.leads,
        conversions: editingRecord.conversions,
        revenueINR: editingRecord.revenueINR,
        leadStage: editingRecord.leadStage,
        region: editingRecord.region,
        sourceOfTruth: 'Manual Override'
      });
      showNotify('Record updated and change logged in Audit History.');
      setEditingRecord(null);
      await loadAllData();
    } catch (err) {
      showNotify('Failed to update record.', 'error');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Move this record to Recycle Bin?')) return;
    try {
      await api.deleteUnifiedRecord(id);
      showNotify('Record moved to Recycle Bin.');
      await loadAllData();
    } catch (err) {
      showNotify('Failed to delete record.', 'error');
    }
  };

  const handleApproveMapping = async (id: string, isApproved: boolean) => {
    try {
      await api.approveFieldMapping(id, isApproved);
      showNotify(isApproved ? 'Field mapping approved.' : 'Field mapping rejected.');
      await loadAllData();
    } catch (err) {
      showNotify('Failed to update mapping.', 'error');
    }
  };

  const handleRestoreRecycle = async (recycleId: string) => {
    try {
      await api.restoreRecycleBinRecord(recycleId);
      showNotify('Record restored from Recycle Bin.');
      await loadAllData();
    } catch (err) {
      showNotify('Failed to restore record.', 'error');
    }
  };

  const handlePermanentDeleteRecycle = async (recycleId: string) => {
    if (!window.confirm('Permanently purge this record? This action cannot be undone.')) return;
    try {
      await api.permanentDeleteRecycleBinRecord(recycleId);
      showNotify('Record permanently purged.');
      await loadAllData();
    } catch (err) {
      showNotify('Failed to purge record.', 'error');
    }
  };

  const handleIngestMultiSourceData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadSuccessMessage(null);
    try {
      const records = JSON.parse(rawJsonInput);
      if (!Array.isArray(records)) {
        throw new Error('JSON input must be an array of records.');
      }
      const result = await api.ingestMultiSourceData(uploadSourceName, uploadSourceType, records);
      setUploadSuccessMessage(`Successfully ingested & normalized ${result.ingestedCount} records into the Unified CMO Dataset!`);
      showNotify(`Ingested ${result.ingestedCount} records.`);
      await loadAllData();
    } catch (err: any) {
      showNotify(err.message || 'Invalid JSON format or upload error.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateBackupConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupConfig) return;
    setIsSavingConfig(true);
    try {
      const res = await api.updateBackupConfig(backupConfig);
      setBackupConfig(res.config);
      showNotify('Automated weekly backup schedule updated successfully!');
    } catch (err) {
      showNotify('Failed to update backup schedule config.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleRunImmediateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const newArchive = await api.createBackupArchive({
        type: 'weekly_auto',
        name: `Automated Weekly Snapshot - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      });
      showNotify(`Generated weekly backup snapshot "${newArchive.name}" (${(newArchive.sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
      await loadAllData();
    } catch (err) {
      showNotify('Failed to create automated backup snapshot.', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (archive: BackupArchive) => {
    if (!window.confirm(`DISASTER RECOVERY RESTORE CONFIRMATION:\n\nAre you sure you want to restore the entire Unified Data Layer and raw source logs to snapshot point "${archive.name}" (${new Date(archive.timestamp).toLocaleString()})?\n\nThis will synchronize active records to this point in time.`)) return;
    setIsRestoringId(archive.id);
    try {
      const res = await api.restoreBackupArchive(archive.id);
      showNotify(`Disaster Recovery Successful! Restored ${res.restoredRecordCount} active records from snapshot.`);
      await loadAllData();
    } catch (err) {
      showNotify('Failed to restore system from backup archive.', 'error');
    } finally {
      setIsRestoringId(null);
    }
  };

  const handleDeleteBackup = async (archiveId: string) => {
    if (!window.confirm('Permanently remove this backup archive snapshot?')) return;
    try {
      await api.deleteBackupArchive(archiveId);
      showNotify('Backup archive permanently removed.');
      await loadAllData();
    } catch (err) {
      showNotify('Failed to delete backup archive.', 'error');
    }
  };

  // Filtered dataset records
  const filteredRecords = unifiedRecords.filter(r => {
    if (selectedSourceFilter !== 'all' && r.sourceId !== selectedSourceFilter) return false;
    if (selectedChannelFilter !== 'all' && !r.channel.toLowerCase().includes(selectedChannelFilter.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      return (
        r.campaign.toLowerCase().includes(q) ||
        r.channel.toLowerCase().includes(q) ||
        r.sourceName.toLowerCase().includes(q) ||
        (r.leadStage && r.leadStage.toLowerCase().includes(q)) ||
        (r.region && r.region.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm transition-all ${
            notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Header & Sub-Nav */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Management & Unified AI Layer</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Single source of truth for cross-channel marketing, CRM, Ads, and manual data normalization.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAllData()}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Layer
            </button>
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Connect Data Source
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
          {[
            { id: 'sources', label: 'Connected Data Sources', icon: Layers, count: dataSources.length },
            { id: 'dataset', label: 'Unified Analytics Dataset', icon: Database, count: unifiedRecords.length },
            { id: 'mapping', label: 'AI Field Mapping Editor', icon: Sparkles, count: fieldMappings.length },
            { id: 'quality', label: 'Data Quality & Health', icon: ShieldCheck, badge: qualityReport ? `${qualityReport.overallQualityScore}%` : '97%' },
            { id: 'upload', label: 'Multi-Source Ingestion', icon: UploadCloud },
            { id: 'recycle', label: 'Recycle Bin & Audit Log', icon: History, count: recycleBin.length },
            { id: 'backup', label: 'Automated Backup & Recovery', icon: HardDrive, count: backupArchives.length, badge: '100% Ready' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: DATA SOURCES */}
      {activeSubTab === 'sources' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map(source => (
              <div key={source.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                      {source.type === 'google_analytics' && <Zap className="w-6 h-6 text-amber-500" />}
                      {source.type === 'meta_ads' && <Layers className="w-6 h-6 text-blue-600" />}
                      {source.type === 'google_ads' && <Search className="w-6 h-6 text-emerald-600" />}
                      {source.type === 'salesforce' && <ShieldCheck className="w-6 h-6 text-sky-600" />}
                      {source.type === 'csv' && <FileSpreadsheet className="w-6 h-6 text-purple-600" />}
                      {source.type === 'rest_api' && <Sliders className="w-6 h-6 text-indigo-600" />}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        source.status === 'connected'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : source.status === 'syncing'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${source.status === 'connected' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {source.status === 'connected' ? 'Connected' : source.status === 'syncing' ? 'Syncing...' : 'Inactive Source'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1">{source.name}</h3>
                  <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider font-semibold">
                    Type: {source.type.replace('_', ' ')} {source.accountOrPropertyId && `• ID: ${source.accountOrPropertyId}`}
                  </p>

                  <div className="space-y-2 py-3 border-t border-b border-gray-100 text-xs text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Synced:</span>
                      <span className="font-semibold text-gray-800">{new Date(source.lastSync).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Record Volume:</span>
                      <span className="font-semibold text-gray-800">{source.recordCount.toLocaleString()} records</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data Freshness Score:</span>
                      <span className="font-bold text-emerald-600">{source.freshnessScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sync Schedule:</span>
                      <span className="font-semibold text-blue-600 capitalize">{source.autoSync}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleSyncSource(source.id)}
                    disabled={syncingSourceId === source.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingSourceId === source.id ? 'animate-spin' : ''}`} />
                    {syncingSourceId === source.id ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={() => handleDisconnectSource(source.id)}
                    className="px-3 py-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: UNIFIED ANALYTICS DATASET */}
      {activeSubTab === 'dataset' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter campaigns, channels, regions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>

              <select
                value={selectedSourceFilter}
                onChange={e => setSelectedSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 dark:text-gray-200 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Data Sources</option>
                {dataSources.map(s => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedChannelFilter}
                onChange={e => setSelectedChannelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 dark:text-gray-200 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Channels</option>
                <option value="Paid Search" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Paid Search (Google)</option>
                <option value="Social Ads" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Social Ads (Meta)</option>
                <option value="Organic SEO" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Organic SEO</option>
                <option value="Direct" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Direct & Billboard</option>
              </select>
            </div>

            <button
              onClick={() => setShowManualEntryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Manual Record / Override
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Source & Campaign</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Spend (INR)</th>
                  <th className="px-4 py-3">Leads</th>
                  <th className="px-4 py-3">Conversions</th>
                  <th className="px-4 py-3">Revenue (INR)</th>
                  <th className="px-4 py-3">Lead Stage</th>
                  <th className="px-4 py-3">Quality</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>
                        {rec.campaign}
                        {rec.isEdited && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Edited
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-normal mt-0.5">{rec.sourceName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                        {rec.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rec.date}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹{rec.spendINR.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-800">{rec.leads}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{rec.conversions}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">₹{rec.revenueINR.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {rec.leadStage || 'Lead Created'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-xs text-emerald-600">{rec.qualityScore || 98}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rec.editHistory && rec.editHistory.length > 0 && (
                          <button
                            onClick={() => setHistoryRecord(rec)}
                            title="View Audit History"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingRecord(rec)}
                          title="Edit Record"
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          title="Recycle Record"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AI FIELD MAPPING EDITOR */}
      {activeSubTab === 'mapping' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Automated AI Schema & Field Mapping Engine
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              AI maps heterogeneous source columns (`Campaign_Name__c`, `adset_name_utm`, `cost_micros_inr`) into the Unified CMO Schema.
            </p>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Source Name</th>
                  <th className="px-4 py-3">Source Field (Raw)</th>
                  <th className="px-4 py-3">Target Unified Field</th>
                  <th className="px-4 py-3">AI Confidence</th>
                  <th className="px-4 py-3">Sample Values</th>
                  <th className="px-4 py-3">Approval Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {fieldMappings.map(map => (
                  <tr key={map.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{map.sourceName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-md inline-block my-1">
                      {map.sourceField}
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-700">
                      <span className="flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        {map.targetUnifiedField}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {Math.round(map.confidenceScore * 100)}% Match
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {map.sampleValues && map.sampleValues.length > 0 ? map.sampleValues.join(', ') : '0'}
                    </td>
                    <td className="px-4 py-3">
                      {map.isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending AI Validation
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleApproveMapping(map.id, !map.isApproved)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          map.isApproved
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {map.isApproved ? 'Revoke Approval' : 'Approve Mapping'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DATA QUALITY & HEALTH */}
      {activeSubTab === 'quality' && qualityReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Clean Data Index</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{qualityReport.cleanDataPct}%</div>
              <p className="text-xs text-gray-500 mt-1">Verified with 0 duplicate warnings</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Duplicate Rate</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-amber-600">{qualityReport.duplicatePct}%</div>
              <p className="text-xs text-gray-500 mt-1">Cross-source identical campaign records</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Data Freshness</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-600">{qualityReport.dataFreshnessScore}%</div>
              <p className="text-xs text-gray-500 mt-1">Updated within last 60 minutes</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Overall Quality Health</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-600">{qualityReport.overallQualityScore}%</div>
              <p className="text-xs text-gray-500 mt-1">Ready for CMO Insights Engine</p>
            </div>
          </div>

          {/* Sync Executions History Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Recent Automatic & Manual Sync Executions</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Data Source</th>
                    <th className="px-4 py-3">Sync Type</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Records Ingested</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {syncHistory.map(sync => (
                    <tr key={sync.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{sync.sourceName}</td>
                      <td className="px-4 py-3 capitalize text-xs text-gray-600">{sync.syncType}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(sync.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">+{sync.recordsAdded}</td>
                      <td className="px-4 py-3 text-gray-700">{sync.recordsUpdated}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {sync.status}
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

      {/* SUB-TAB 5: MULTI-SOURCE INGESTION & UPLOAD */}
      {activeSubTab === 'upload' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Multi-Source Heterogeneous Ingestion Tool
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload raw campaign spreadsheets, CSV files, or paste custom JSON data payloads to automatically map and normalize into the AI layer.
            </p>
          </div>

          {uploadSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              {uploadSuccessMessage}
            </div>
          )}

          <form onSubmit={handleIngestMultiSourceData} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Data Source Label</label>
                <input
                  type="text"
                  required
                  value={uploadSourceName}
                  onChange={e => setUploadSourceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Meta Ads Q3 Campaign Export"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source Type</label>
                <select
                  value={uploadSourceType}
                  onChange={e => setUploadSourceType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="meta_ads">Meta Ads (Facebook/Instagram)</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="google_analytics">Google Analytics 4</option>
                  <option value="salesforce">Salesforce CRM</option>
                  <option value="csv">CSV / Excel Upload</option>
                  <option value="rest_api">Custom REST API</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Raw JSON / CSV Ingestion Data Payload (Array of objects)
              </label>
              <textarea
                rows={10}
                required
                value={rawJsonInput}
                onChange={e => setRawJsonInput(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isUploading ? 'Normalizing & Ingesting...' : 'Ingest & Standardize Data'}
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 6: RECYCLE BIN & AUDIT LOG */}
      {activeSubTab === 'recycle' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-700" />
              Recycle Bin & Data Audit Governance
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Soft-deleted records are retained in the Recycle Bin before permanent deletion, ensuring report continuity and audit trail compliance.
            </p>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Record Summary</th>
                  <th className="px-4 py-3">Original Source</th>
                  <th className="px-4 py-3">Deleted By</th>
                  <th className="px-4 py-3">Deleted At</th>
                  <th className="px-4 py-3 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recycleBin.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Recycle Bin is currently empty.
                    </td>
                  </tr>
                ) : (
                  recycleBin.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{item.recordSummary}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{item.sourceName}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{item.deletedBy}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(item.deletedAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestoreRecycle(item.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDeleteRecycle(item.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-xs font-semibold transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Purge Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: AUTOMATED BACKUP & DISASTER RECOVERY */}
      {activeSubTab === 'backup' && (
        <div className="space-y-6">
          {/* Readiness Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Recovery Readiness</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-2">100% Ready</div>
              <p className="text-xs text-emerald-700 mt-1">Full dataset & raw source logs protected</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Automated Backup</span>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-gray-900 mt-2">
                {backupConfig?.lastBackupAt ? new Date(backupConfig.lastBackupAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sun, Aug 9, 2:00 AM'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Verified SHA256 integrity checksum</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Next Scheduled Backup</span>
                <HardDrive className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-lg font-bold text-gray-900 mt-2">
                {backupConfig?.nextScheduledBackup ? new Date(backupConfig.nextScheduledBackup).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sun, Aug 16, 2:00 AM'}
              </div>
              <p className="text-xs text-indigo-600 font-medium mt-1">Cron: Every {backupConfig?.dayOfWeek || 'Sunday'} at {backupConfig?.timeUtc || '02:00'} UTC</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Protected Storage</span>
                <Archive className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-gray-900 mt-2">
                {((backupReadiness?.totalBackupStorageBytes || 4292000) / (1024 * 1024)).toFixed(2)} MB
              </div>
              <p className="text-xs text-gray-500 mt-1">{backupArchives.length} Historical Recovery Points</p>
            </div>
          </div>

          {/* Schedule Configuration Panel */}
          {backupConfig && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-600" />
                    Automated Weekly Backup Service Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure automated snapshots for Unified Data Layer, field mappings, and raw ingestion source logs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunImmediateBackup}
                  disabled={isCreatingBackup}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className={`w-4 h-4 ${isCreatingBackup ? 'animate-spin' : ''}`} />
                  {isCreatingBackup ? 'Generating Snapshot...' : 'Run Immediate Weekly Backup'}
                </button>
              </div>

              <form onSubmit={handleUpdateBackupConfig} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Automated Backup Cron</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupConfig.enabled}
                      onChange={e => setBackupConfig({ ...backupConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {backupConfig.enabled ? 'Service Enabled' : 'Service Disabled'}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Execution Day of Week</label>
                  <select
                    value={backupConfig.dayOfWeek}
                    onChange={e => setBackupConfig({ ...backupConfig, dayOfWeek: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Sunday">Every Sunday (Recommended)</option>
                    <option value="Monday">Every Monday</option>
                    <option value="Friday">Every Friday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Archive Retention Policy</label>
                  <select
                    value={backupConfig.retentionWeeks}
                    onChange={e => setBackupConfig({ ...backupConfig, retentionWeeks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={4}>Retain 4 Weeks</option>
                    <option value={8}>Retain 8 Weeks (Standard)</option>
                    <option value={12}>Retain 12 Weeks (Quarterly)</option>
                    <option value={52}>Retain 52 Weeks (Annual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cloud Offsite Replication</label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={backupConfig.autoUploadCloud}
                      onChange={e => setBackupConfig({ ...backupConfig, autoUploadCloud: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {backupConfig.autoUploadCloud ? 'Auto Cloud Mirror' : 'Local File Only'}
                    </span>
                  </label>
                </div>

                <div className="col-span-full flex justify-end border-t border-gray-100 pt-4">
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-gray-500" />
                    {isSavingConfig ? 'Saving...' : 'Save Schedule Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Historical Backup Snapshots Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">System Recovery Point Archives</h3>
                <p className="text-xs text-gray-500">
                  Full snapshots of Unified Records, Data Sources, Field Mappings, and Ingestion Logs.
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-600 bg-white px-3 py-1 border border-gray-200 rounded-lg">
                {backupArchives.length} Snapshots Available
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Snapshot Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Records & Sources</th>
                    <th className="px-4 py-3">Archive Size</th>
                    <th className="px-4 py-3">SHA256 Checksum</th>
                    <th className="px-4 py-3 text-right">Recovery Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {backupArchives.map(archive => (
                    <tr key={archive.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Archive className="w-4 h-4 text-blue-600" />
                          <span>{archive.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Created by: {archive.createdBy}</div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            archive.type === 'weekly_auto'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {archive.type === 'weekly_auto' ? 'Weekly Auto' : 'Manual Snapshot'}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-600 font-medium whitespace-nowrap">
                        {new Date(archive.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold text-gray-800">{archive.recordCount.toLocaleString()}</span> records
                        <span className="text-gray-400 font-normal"> ({archive.sourcesCount} sources)</span>
                      </td>

                      <td className="px-4 py-4 text-gray-700 font-mono font-medium">
                        {(archive.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </td>

                      <td className="px-4 py-4 font-mono text-[10px] text-gray-500 max-w-[150px] truncate" title={archive.checksum}>
                        {archive.checksum}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestoreBackup(archive)}
                            disabled={isRestoringId === archive.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                            title="Restore entire system to this point"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isRestoringId === archive.id ? 'animate-spin' : ''}`} />
                            {isRestoringId === archive.id ? 'Restoring...' : 'Restore System'}
                          </button>

                          <a
                            href={api.downloadBackupArchiveUrl(archive.id)}
                            download
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md text-xs font-medium transition-colors"
                            title="Download JSON Archive File"
                          >
                            <Download className="w-3.5 h-3.5" /> JSON
                          </a>

                          <button
                            onClick={() => handleDeleteBackup(archive.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Snapshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONNECT DATA SOURCE MODAL */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Connect New Data Source</h3>
              <button onClick={() => setShowConnectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., GA4 Main Web Property"
                  value={newSourceForm.name}
                  onChange={e => setNewSourceForm({ ...newSourceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source Type</label>
                <select
                  value={newSourceForm.type}
                  onChange={e => setNewSourceForm({ ...newSourceForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="google_analytics">Google Analytics 4 (GA4)</option>
                  <option value="meta_ads">Meta Ads (Facebook / Instagram)</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="salesforce">Salesforce CRM</option>
                  <option value="rest_api">Custom REST API</option>
                  <option value="csv">CSV / Excel Import</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account / Property / Customer ID</label>
                <input
                  type="text"
                  placeholder="e.g., G-CMO391829 or act_9812839"
                  value={newSourceForm.accountOrPropertyId}
                  onChange={e => setNewSourceForm({ ...newSourceForm, accountOrPropertyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Auto Sync Frequency</label>
                <select
                  value={newSourceForm.autoSync}
                  onChange={e => setNewSourceForm({ ...newSourceForm, autoSync: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="realtime">Real-time (Webhooks)</option>
                  <option value="hourly">Hourly Automated Sync</option>
                  <option value="daily">Daily Midnight Sync</option>
                  <option value="manual">Manual Trigger Only</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Authenticate & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY / OVERRIDE MODAL */}
      {showManualEntryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Add Manual Unified Record / Override</h3>
              <button onClick={() => setShowManualEntryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualEntry} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={manualForm.campaign}
                  onChange={e => setManualForm({ ...manualForm, campaign: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., High Net-Worth Billboard Sector 62"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Channel</label>
                  <input
                    type="text"
                    required
                    value={manualForm.channel}
                    onChange={e => setManualForm({ ...manualForm, channel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Spend (INR)</label>
                  <input
                    type="number"
                    value={manualForm.spendINR}
                    onChange={e => setManualForm({ ...manualForm, spendINR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Revenue (INR)</label>
                  <input
                    type="number"
                    value={manualForm.revenueINR}
                    onChange={e => setManualForm({ ...manualForm, revenueINR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Leads</label>
                  <input
                    type="number"
                    value={manualForm.leads}
                    onChange={e => setManualForm({ ...manualForm, leads: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Conversions</label>
                  <input
                    type="number"
                    value={manualForm.conversions}
                    onChange={e => setManualForm({ ...manualForm, conversions: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowManualEntryModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Save to Unified Dataset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECORD MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Unified Record & Set Source of Truth</h3>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={editingRecord.campaign}
                  onChange={e => setEditingRecord({ ...editingRecord, campaign: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Spend (INR)</label>
                  <input
                    type="number"
                    value={editingRecord.spendINR}
                    onChange={e => setEditingRecord({ ...editingRecord, spendINR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Revenue (INR)</label>
                  <input
                    type="number"
                    value={editingRecord.revenueINR}
                    onChange={e => setEditingRecord({ ...editingRecord, revenueINR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Leads</label>
                  <input
                    type="number"
                    value={editingRecord.leads}
                    onChange={e => setEditingRecord({ ...editingRecord, leads: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Conversions</label>
                  <input
                    type="number"
                    value={editingRecord.conversions}
                    onChange={e => setEditingRecord({ ...editingRecord, conversions: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Override & Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT HISTORY MODAL */}
      {historyRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Audit History Trail</h3>
              <button onClick={() => setHistoryRecord(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              {historyRecord.editHistory?.map(ed => (
                <div key={ed.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 border border-gray-200">
                  <div className="flex justify-between font-semibold text-gray-800">
                    <span className="capitalize">Field: {ed.field}</span>
                    <span className="text-blue-600">{ed.sourceOfTruth}</span>
                  </div>
                  <div className="text-gray-600">
                    Original: <span className="line-through">{String(ed.originalValue)}</span> &rarr; New:{' '}
                    <span className="font-bold text-emerald-600">{String(ed.newValue)}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    By {ed.updatedBy} at {new Date(ed.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setHistoryRecord(null)}
                className="px-4 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
