import {
  User,
  ActivityLog,
  SalesMetric,
  LeadFunnelStage,
  CampaignMetric,
  ChannelMetric,
  RegionalMetric,
  CSVUploadRecord,
  CRMConnection,
  GoogleAnalyticsMetric,
  ChatMessage,
  AIInsight,
  ExecutiveReport,
  PerformanceAlert,
  MarketingDashboardMetrics,
  AnomalyDetectionConfig,
  DetectedAnomalyItem,
  CRMRecord,
  CommandSearchResult,
  DataSource,
  FieldMapping,
  UnifiedRecord,
  SyncHistoryEntry,
  DataQualityReport,
  RecycleBinItem,
  BackupScheduleConfig,
  BackupArchive,
  DataSynopsis
} from '../types';

const getHeaders = () => {
  const token = localStorage.getItem('cmo_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (email: string, password?: string, rememberMe?: boolean) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('cmo_auth_token', data.token);
    }
    return data;
  },

  forgotPassword: async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to process password reset request.');
    }
    return data as { success: boolean; message: string; resetToken?: string; resetUrl?: string };
  },

  verifyResetToken: async (token: string) => {
    const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Password reset token is invalid or expired.');
    }
    return data as { valid: boolean; email: string };
  },

  resetPassword: async (params: { token: string; newPassword: string; confirmPassword: string }) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update password.');
    }
    return data as { success: boolean; message: string };
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('cmo_auth_token');
    if (!token) return null;
    const res = await fetch('/api/auth/me', { headers: getHeaders() });
    if (!res.ok) {
      localStorage.removeItem('cmo_auth_token');
      return null;
    }
    const data = await res.json();
    return data.user as User;
  },

  // Admin Users
  getUsers: async () => {
    const res = await fetch('/api/users', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return (await res.json()).users as User[];
  },

  createUser: async (userData: { name?: string; email: string; password?: string; phone?: string; role: string; avatar?: string; status?: string }) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user');
    }
    return (await res.json()).user as User;
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }
    return (await res.json()).user as User;
  },

  generateUserResetLink: async (id: string) => {
    const res = await fetch(`/api/users/${id}/reset-link`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate reset link');
    }
    return await res.json() as { success: boolean; message: string; resetToken: string; resetUrl: string };
  },

  getSmtpConfig: async () => {
    const res = await fetch('/api/admin/smtp', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch SMTP config');
    return (await res.json()).smtp;
  },

  updateSmtpConfig: async (updates: any) => {
    const res = await fetch('/api/admin/smtp', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to save SMTP settings');
    return await res.json();
  },

  testSmtpConfig: async () => {
    const res = await fetch('/api/admin/smtp/test', {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to send test email');
    return await res.json();
  },

  deleteUser: async (id: string) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return await res.json();
  },

  getActivityLogs: async () => {
    const res = await fetch('/api/activity-logs', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch logs');
    return (await res.json()).logs as ActivityLog[];
  },

  // Dashboard Metrics
  getMetrics: async (params?: { dateRange?: string; campaignId?: string; channel?: string; project?: string }) => {
    const query = new URLSearchParams();
    if (params?.dateRange) query.append('dateRange', params.dateRange);
    if (params?.campaignId) query.append('campaignId', params.campaignId);
    if (params?.channel) query.append('channel', params.channel);
    if (params?.project) query.append('project', params.project);

    const res = await fetch(`/api/metrics?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return await res.json() as {
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
      marketingDashboard: MarketingDashboardMetrics;
    };
  },

  getAlerts: async () => {
    const res = await fetch('/api/alerts', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).alerts as PerformanceAlert[];
  },

  dismissAlert: async (id: string) => {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to dismiss alert');
    return (await res.json()).alerts as PerformanceAlert[];
  },

  clearAlerts: async () => {
    const res = await fetch('/api/alerts/clear', {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear alerts');
    return (await res.json()).alerts as PerformanceAlert[];
  },

  // Anomaly Detection System
  scanAnomalies: async (sensitivity?: number) => {
    const url = sensitivity ? `/api/anomalies/scan?sensitivity=${sensitivity}` : '/api/anomalies/scan';
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to run anomaly detection scan');
    return await res.json() as {
      sensitivity: number;
      lookbackDays: number;
      scannedAt: string;
      scannedMetricsCount: number;
      anomalies: DetectedAnomalyItem[];
      newAlertsGenerated: number;
      alerts: PerformanceAlert[];
    };
  },

  getAnomalyConfig: async () => {
    const res = await fetch('/api/anomalies/config', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch anomaly config');
    return (await res.json()).config as AnomalyDetectionConfig;
  },

  updateAnomalyConfig: async (updates: Partial<AnomalyDetectionConfig>) => {
    const res = await fetch('/api/anomalies/config', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update anomaly config');
    return (await res.json()).config as AnomalyDetectionConfig;
  },

  // AI Insights
  runAIAnalysis: async (customPrompt?: string) => {
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ customPrompt })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.details || 'AI Analysis failed');
    }
    const data = await res.json();
    return data.analysis as AIInsight;
  },

  // AI Chat
  getChatHistory: async () => {
    const res = await fetch('/api/chat/history', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).history as ChatMessage[];
  },

  sendChatMessage: async (message: string, rawDatabase?: { fileName: string; content: string; recordCount?: number }) => {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, rawDatabase })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return (await res.json()).message as ChatMessage;
  },

  // CSV & Excel Upload
  uploadCSV: async (fileName: string, records: any[], mappedFields: Record<string, string>, uploadMode: 'replace' | 'append' = 'replace', section: string = 'LEAD') => {
    const res = await fetch('/api/upload/csv', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fileName, records, mappedFields, uploadMode, section })
    });
    if (!res.ok) {
      let errMsg = `Upload failed (Status ${res.status})`;
      try {
        const errData = await res.json();
        if (errData.error) errMsg = errData.error;
        else if (errData.message) errMsg = errData.message;
      } catch (e) {
        if (res.status === 413) {
          errMsg = 'Spreadsheet payload size is too large (413 Payload Too Large). Try uploading in smaller batches or contact system admin.';
        } else if (res.status === 401) {
          errMsg = 'Session expired or authentication token missing. Please sign in again.';
        }
      }
      throw new Error(errMsg);
    }
    return await res.json();
  },

  fetchGoogleSheetData: async (sheetUrl: string) => {
    const res = await fetch('/api/upload/google-sheet', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sheetUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch Google Sheet data');
    return data as { headers: string[]; rows: Record<string, string>[]; recordCount: number };
  },

  getUploadHistory: async () => {
    const res = await fetch('/api/upload/list', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).uploads as CSVUploadRecord[];
  },

  getActiveDataset: async () => {
    const res = await fetch('/api/upload/active-dataset', { headers: getHeaders() });
    if (!res.ok) return null;
    return (await res.json()).activeDataset as { fileName: string; recordCount: number; sampleRows?: any[] } | null;
  },

  getDataSynopsis: async () => {
    const res = await fetch('/api/upload/synopsis', { headers: getHeaders() });
    if (!res.ok) return null;
    return (await res.json()).synopsis as DataSynopsis;
  },

  clearActiveDataset: async () => {
    const res = await fetch('/api/upload/active-dataset', {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear active dataset');
    return await res.json();
  },

  clearAllUploadedDatasets: async () => {
    const res = await fetch('/api/upload/all', {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear all datasets');
    return await res.json();
  },

  deleteUploadedDataset: async (id: string) => {
    const res = await fetch(`/api/upload/dataset/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete dataset');
    return await res.json();
  },

  batchUploadCSV: async (items: Array<{ fileName: string; records: any[]; mappedFields: Record<string, string>; section: string }>, uploadMode: 'replace' | 'append' = 'replace') => {
    const res = await fetch('/api/upload/batch', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items, uploadMode })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || err.message || 'Batch upload failed');
    }
    return await res.json();
  },

  // CRM Integrations
  getCRMConnections: async () => {
    const res = await fetch('/api/crm/connections', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).connections as CRMConnection[];
  },

  connectCRM: async (params: { id: string; instanceUrl?: string; apiKey?: string; autoSync?: boolean; syncIntervalMinutes?: number }) => {
    const res = await fetch('/api/crm/connect', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to update CRM settings');
    return (await res.json()).connection as CRMConnection;
  },

  syncCRM: async (id: string) => {
    const res = await fetch('/api/crm/sync', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error('Failed to sync CRM data');
    return await res.json();
  },

  // Google Analytics 4
  getGAData: async () => {
    const res = await fetch('/api/ga/data', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch GA4 metrics');
    return (await res.json()).gaData as GoogleAnalyticsMetric;
  },

  connectGA: async (params: { propertyId?: string; measurementId?: string; propertyName?: string; apiKey?: string }) => {
    const res = await fetch('/api/ga/connect', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to connect Google Analytics 4');
    return (await res.json()).gaData as GoogleAnalyticsMetric;
  },

  syncGA: async () => {
    const res = await fetch('/api/ga/sync', {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to sync Google Analytics 4');
    return await res.json() as { message: string; gaData: GoogleAnalyticsMetric; syncedEvents: number };
  },

  analyzeGA: async () => {
    const res = await fetch('/api/ga/analyze', {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to analyze GA4 metrics');
    return await res.json() as { analysis: string; gaData: GoogleAnalyticsMetric };
  },

  // Reports
  getReports: async () => {
    const res = await fetch('/api/reports', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).reports as ExecutiveReport[];
  },

  generateReport: async (title: string, period: string) => {
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, period })
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return (await res.json()).report as ExecutiveReport;
  },

  // Global Command Search
  globalSearch: async (query: string) => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
    if (!res.ok) return { crmRecords: [], chatHistory: [], reports: [] };
    return (await res.json()) as CommandSearchResult;
  },

  getCRMRecords: async () => {
    const res = await fetch('/api/crm/records', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).records as CRMRecord[];
  },

  // Data Management & Unified Data Layer
  getDataSources: async () => {
    const res = await fetch('/api/data-management/sources', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).sources as DataSource[];
  },

  addDataSource: async (source: Partial<DataSource>) => {
    const res = await fetch('/api/data-management/sources', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(source)
    });
    if (!res.ok) throw new Error('Failed to add data source');
    return (await res.json()).source as DataSource;
  },

  updateDataSource: async (id: string, updates: Partial<DataSource>) => {
    const res = await fetch(`/api/data-management/sources/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update data source');
    return (await res.json()).source as DataSource;
  },

  syncDataSource: async (id: string) => {
    const res = await fetch(`/api/data-management/sources/${id}/sync`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to sync data source');
    return await res.json() as { source: DataSource; syncEntry: SyncHistoryEntry };
  },

  deleteDataSource: async (id: string) => {
    const res = await fetch(`/api/data-management/sources/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to disconnect data source');
    return await res.json();
  },

  getUnifiedRecords: async (filters?: { sourceId?: string; channel?: string; stage?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (filters?.sourceId) query.set('sourceId', filters.sourceId);
    if (filters?.channel) query.set('channel', filters.channel);
    if (filters?.stage) query.set('stage', filters.stage);
    if (filters?.search) query.set('search', filters.search);

    const res = await fetch(`/api/data-management/unified-records?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).records as UnifiedRecord[];
  },

  addUnifiedRecord: async (record: Partial<UnifiedRecord>) => {
    const res = await fetch('/api/data-management/unified-records', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record)
    });
    if (!res.ok) throw new Error('Failed to add unified record');
    return (await res.json()).record as UnifiedRecord;
  },

  updateUnifiedRecord: async (id: string, updates: Partial<UnifiedRecord> & { sourceOfTruth?: string }) => {
    const res = await fetch(`/api/data-management/unified-records/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update unified record');
    return (await res.json()).record as UnifiedRecord;
  },

  deleteUnifiedRecord: async (id: string) => {
    const res = await fetch(`/api/data-management/unified-records/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete unified record');
    return await res.json();
  },

  getFieldMappings: async (sourceId?: string) => {
    const res = await fetch(`/api/data-management/mappings?sourceId=${sourceId || 'all'}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).mappings as FieldMapping[];
  },

  approveFieldMapping: async (id: string, isApproved: boolean) => {
    const res = await fetch(`/api/data-management/mappings/${id}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ isApproved })
    });
    if (!res.ok) throw new Error('Failed to approve mapping');
    return (await res.json()).mapping as FieldMapping;
  },

  getDataQualityReport: async () => {
    const res = await fetch('/api/data-management/quality', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load quality report');
    return (await res.json()).quality as DataQualityReport;
  },

  getSyncHistory: async () => {
    const res = await fetch('/api/data-management/sync-history', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).history as SyncHistoryEntry[];
  },

  getRecycleBin: async () => {
    const res = await fetch('/api/data-management/recycle-bin', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).recycleBin as RecycleBinItem[];
  },

  restoreRecycleBinRecord: async (id: string) => {
    const res = await fetch(`/api/data-management/recycle-bin/${id}/restore`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to restore record');
    return await res.json();
  },

  permanentDeleteRecycleBinRecord: async (id: string) => {
    const res = await fetch(`/api/data-management/recycle-bin/${id}/permanent`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to permanently delete record');
    return await res.json();
  },

  ingestMultiSourceData: async (sourceName: string, sourceType: string, records: any[]) => {
    const res = await fetch('/api/data-management/ingest', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sourceName, sourceType, records })
    });
    if (!res.ok) throw new Error('Failed to ingest data');
    return await res.json();
  },

  // Automated Weekly Data Backup & Disaster Recovery
  getBackupConfig: async () => {
    const res = await fetch('/api/data-management/backups/config', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load backup configuration');
    return await res.json() as {
      config: BackupScheduleConfig;
      readiness: {
        recoveryReadinessScore: number;
        totalArchivesCount: number;
        completedArchivesCount: number;
        totalBackupStorageBytes: number;
        lastSuccessfulBackupAt: string;
        nextScheduledBackupAt: string;
        backupTarget: string;
      };
    };
  },

  updateBackupConfig: async (config: Partial<BackupScheduleConfig>) => {
    const res = await fetch('/api/data-management/backups/config', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update backup schedule');
    return await res.json() as { message: string; config: BackupScheduleConfig };
  },

  getBackupArchives: async () => {
    const res = await fetch('/api/data-management/backups', { headers: getHeaders() });
    if (!res.ok) return [];
    return (await res.json()).archives as BackupArchive[];
  },

  createBackupArchive: async (params?: { name?: string; type?: 'weekly_auto' | 'manual_snapshot' | 'pre_sync_backup' }) => {
    const res = await fetch('/api/data-management/backups/create', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params || {})
    });
    if (!res.ok) throw new Error('Failed to create backup snapshot');
    return (await res.json()).archive as BackupArchive;
  },

  restoreBackupArchive: async (id: string) => {
    const res = await fetch(`/api/data-management/backups/${id}/restore`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to restore system from backup');
    return await res.json() as { success: boolean; message: string; restoredRecordCount: number };
  },

  deleteBackupArchive: async (id: string) => {
    const res = await fetch(`/api/data-management/backups/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete backup archive');
    return await res.json();
  },

  downloadBackupArchiveUrl: (id: string) => `/api/data-management/backups/${id}/download`
};
