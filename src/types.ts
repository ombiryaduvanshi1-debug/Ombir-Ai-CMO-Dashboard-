export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  passwordHash?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  createdBy?: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
  emailVerified?: boolean;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  category: 'auth' | 'data_upload' | 'crm_sync' | 'ai_analysis' | 'admin' | 'report';
}

export interface SalesMetric {
  date: string;
  revenue: number;
  dealsClosed: number;
  avgDealSize: number;
  pipelineValue: number;
  targetRevenue: number;
  leads?: number;
  qualifiedLeads?: number;
  siteVisits?: number;
  conversions?: number;
  conversionRate?: number;
}

export interface LeadFunnelStage {
  stage: string;
  count: number;
  conversionRate: number; // percentage from previous stage
  dropoffRate: number;
  value: number;
}

export interface CampaignMetric {
  id: string;
  name: string;
  channel: 'Google Ads' | 'Meta Ads' | 'LinkedIn' | 'Organic Search' | 'Email' | 'Salesforce CRM' | 'Zoho CRM';
  status: 'active' | 'paused' | 'completed';
  spend: number;
  revenue: number;
  leads: number;
  qualifiedLeads: number;
  conversions: number;
  roi: number; // e.g. 3.4 for 340%
  cpl: number; // cost per lead
  cac: number; // customer acquisition cost
  ctr: number; // click through rate %
  startDate: string;
  endDate?: string;
}

export interface ChannelMetric {
  channel: string;
  spend: number;
  revenue: number;
  roi: number;
  leads: number;
  conversions: number;
  sharePct: number;
}

export interface RegionalMetric {
  id: string;
  region: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  revenue: number;
  leads: number;
  topChannel: string;
  growthPct: number;
}

export interface CSVUploadRecord {
  id: string;
  fileName: string;
  uploadedAt: string;
  recordCount: number;
  uploadedBy: string;
  mappedFields: Record<string, string>;
  status: 'processed' | 'processing' | 'failed';
  previewRows: Record<string, any>[];
  records?: Record<string, any>[];
}

export interface BackupArchive {
  id: string;
  name: string;
  createdAt?: string;
  createdBy?: string;
  fileCount?: number;
  totalRecords?: number;
  sizeBytes?: number;
  data?: any;
  backupData?: any;
  status?: 'completed' | 'in_progress' | 'failed' | 'restored' | 'verified' | string;
  timestamp?: string;
  type?: 'full' | 'incremental' | 'auto' | string;
  checksum?: string;
  recordCount?: number;
  sourcesCount?: number;
  retentionDays?: number;
}

export interface CRMConnection {
  id: string;
  provider: 'salesforce' | 'zoho' | 'hubspot' | 'google_analytics';
  name: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  instanceUrl?: string;
  apiKey?: string;
  measurementId?: string;
  propertyId?: string;
  lastSyncedAt?: string;
  autoSync: boolean;
  syncIntervalMinutes: number;
  totalSyncedLeads: number;
  totalSyncedDeals: number;
  syncedCampaignsCount: number;
}

export interface GoogleAnalyticsMetric {
  propertyId: string;
  measurementId: string;
  propertyName: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSyncedAt?: string;
  realtimeActiveUsers: number;
  totalUsersToday: number;
  sessionsToday: number;
  bounceRatePct: number;
  avgEngagementTimeSec: number;
  pageviewsToday: number;
  trafficSources: {
    source: string;
    users: number;
    sessions: number;
    conversions: number;
    conversionRatePct: number;
  }[];
  topLandingPages: {
    path: string;
    views: number;
    activeTimeSec: number;
    conversions: number;
  }[];
  conversionsByEvent: {
    eventName: string;
    count: number;
    valueINR: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestions?: string[];
  attachment?: {
    fileName: string;
    recordCount?: number;
    sampleText?: string;
  };
  metricsContext?: {
    revenue?: string;
    topCampaign?: string;
    cacChange?: string;
  };
  chartData?: {
    pieCharts?: {
      title: string;
      data: { name: string; value: number; percentage?: number }[];
    }[];
    barCharts?: {
      title: string;
      data: { name: string; leads?: number; visits?: number; revenue?: number; count?: number }[];
    }[];
    kpiCards?: {
      label: string;
      value: string;
      change?: string;
      subtext?: string;
    }[];
  };
}

export interface AIInsight {
  summary: string;
  keyInsights: string[];
  actionableRecommendations: {
    title: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
    category: 'budget' | 'targeting' | 'conversion' | 'channel';
    description: string;
  }[];
  anomaliesDetected: {
    metric: string;
    deviation: string;
    cause: string;
    recommendation: string;
  }[];
  generatedAt: string;
}

export interface ExecutiveReport {
  id: string;
  title: string;
  generatedAt: string;
  period: string;
  author: string;
  summary: string;
  totalRevenue: number;
  totalSpend: number;
  overallROI: number;
  totalLeads: number;
  totalConversions: number;
  aiInsightsSummary: string[];
  topCampaigns: CampaignMetric[];
  status: 'ready' | 'generating';
}

export interface PerformanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'positive';
  title: string;
  message: string;
  timestamp: string;
  actionLabel?: string;
  actionUrl?: string;
  metric?: string;
  deviationPct?: number;
  currentValue?: number;
  baselineValue?: number;
  zScore?: number;
  read?: boolean;
}

export interface AnomalyDetectionConfig {
  sensitivity: number; // Z-score threshold (e.g. 1.5, 2.0, 2.5)
  lookbackDays: number; // Historical baseline period
  autoScanIntervalMinutes: number; // 0 for manual, or 15/30/60
  autoScanEnabled: boolean;
  monitoredMetrics: {
    revenue: boolean;
    leads: boolean;
    conversions: boolean;
    conversionRate: boolean;
    cpl: boolean;
    cac: boolean;
    roi: boolean;
  };
  pushToastNotifications: boolean;
}

export interface DetectedAnomalyItem {
  id: string;
  metric: string;
  category: 'revenue' | 'leads' | 'conversions' | 'conversion_rate' | 'cpl' | 'cac' | 'roi' | 'campaign';
  type: 'critical' | 'warning' | 'positive';
  title: string;
  currentValue: number;
  baselineValue: number;
  unit: 'currency' | 'percentage' | 'number';
  zScore: number;
  deviationPct: number;
  detectedAt: string;
  timeframe: string;
  probableCause: string;
  recommendedAction: string;
  channel?: string;
  campaignName?: string;
}

export type TimePeriod = 'daily' | 'monthly' | 'quarterly' | 'yearly';
export type DashboardSection = 'all' | 'marketing' | 'presales' | 'sales';

export interface UnqualifiedReasonItem {
  reason: string;
  count: number;
  percentage: number;
  stage: 'presales' | 'sales' | 'all';
}

export interface LostReasonItem {
  reason: string;
  count: number;
  percentage: number;
}

export interface SourceUnqualifiedItem {
  source: string;
  totalLeads: number;
  unqualifiedLeads: number;
  unqualifiedRate: number;
  siteVisits: number;
  bookings: number;
}

export interface CampaignUnqualifiedItem {
  campaignId: string;
  campaignName: string;
  channel: string;
  totalLeads: number;
  unqualifiedLeads: number;
  unqualifiedRate: number;
  siteVisits: number;
  bookings: number;
}

export interface StageDistributionItem {
  stage: string;
  count: number;
  percentage: number;
  description?: string;
  color?: string;
}

export interface CampaignPerformanceDetail {
  id: string;
  name: string;
  channel: string;
  projectName?: string;
  totalLeads: number;
  pushedToSales: number; // Combined Pushed to Sales / Assigned to Sales Managers
  unqualifiedPresales: number;
  siteVisits: number;
  bookings: number;
  bookingValue: number;
  spend: number;
  roi: number;
}

export interface ProjectPerformanceDetail {
  project: string;
  totalLeads: number;
  pushedToSales: number;
  unqualifiedPresales: number;
  siteVisits: number;
  bookings: number;
  revenue: number;
  spend: number;
  roi: number;
  topChannel: string;
}

export interface SourcePerformanceDetail {
  source: string;
  totalLeads: number;
  pushedToSales: number; // Combined Pushed to Sales / Assigned to Sales Managers
  unqualifiedPresales: number;
  siteVisits: number;
  bookings: number;
  revenue: number;
}

export interface ProjectLostLeadItem {
  projectName: string;
  totalAssigned: number;
  siteVisitsDone: number;
  lostLeads: number;
  lostRate: number;
  topReason: string;
}

export interface TeamMemberLostLeadItem {
  memberId: string;
  memberName: string;
  role: string;
  totalAssigned: number;
  siteVisitsDone: number;
  lostLeads: number;
  bookings: number;
  conversionRate: number;
}

export interface PresalesMemberReportItem {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  totalLeadsHandled: number;
  totalLeadsPushed: number; // Pushed to Sales / Sales Ready
  unqualifiedLeads: number;
  siteVisitsScheduled: number;
  pushRatePct: number;
  avgResponseTimeMin: number;
  avgCallDurationSec: number;
  status: 'Active' | 'Top Performer' | 'On Leave';
}

export interface SalesManagerReportItem {
  id: string;
  name: string;
  avatar?: string;
  regionOrTeam: string;
  totalLeadsAssigned: number;
  totalSiteVisitsVisited: number; // Visited site
  totalLeadsBooked: number; // Deals booked
  totalRevenueINR: number;
  avgTicketSizeINR: number;
  visitToBookingRatePct: number;
  overallLeadToBookingRatePct: number;
  targetAchievementPct: number;
}

export interface MarketingDashboardMetrics {
  totalLeadsCreated: number;
  totalLeadsPushedToSales: number; // Combined Pushed to Sales / Assigned to Sales Managers
  totalUnqualifiedPresalesStage: number;
  siteVisitsConverted: number; // Pushed to Site Visit Done
  siteVisitConversionRate: number;
  pushedToLost: number; // Pushed to Lost leads
  pushedToLostRate: number;
  campaignWisePerformance: CampaignPerformanceDetail[];
  projectWisePerformance: ProjectPerformanceDetail[];
  sourceWisePerformance: SourcePerformanceDetail[];
  sourceWiseUnqualified: SourceUnqualifiedItem[];
  campaignWiseUnqualified: CampaignUnqualifiedItem[];
  stageWiseDistribution: StageDistributionItem[];
  unqualifiedReasons: UnqualifiedReasonItem[];
  lostReasons: LostReasonItem[];
  projectWiseLostLeads: ProjectLostLeadItem[];
  teamMemberWiseLostLeads: TeamMemberLostLeadItem[];
  totalSalesforceBookings: {
    count: number;
    value: number;
    syncTime: string;
  };
}

export type DashboardFilter = {
  dateRange: TimePeriod | '7d' | '30d' | '90d' | 'qtd' | 'ytd';
  campaignId: string;
  channel: string;
  section?: DashboardSection;
};

export interface CRMRecord {
  id: string;
  name: string;
  type: 'lead' | 'deal' | 'contact' | 'account';
  provider: 'salesforce' | 'zoho' | 'hubspot';
  company?: string;
  email?: string;
  phone?: string;
  statusOrStage: string;
  valueINR?: number;
  assignedTo?: string;
  lastActivity: string;
}

export interface CommandSearchResult {
  crmRecords: CRMRecord[];
  chatHistory: ChatMessage[];
  reports: ExecutiveReport[];
}

export type DataSourceType = 'google_analytics' | 'meta_ads' | 'google_ads' | 'salesforce' | 'csv' | 'json' | 'manual_entry' | 'rest_api';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  status: 'connected' | 'syncing' | 'failed' | 'inactive';
  lastSync: string;
  recordCount: number;
  freshnessScore: number;
  autoSync: 'hourly' | 'daily' | 'weekly' | 'manual';
  apiKeyOrToken?: string;
  accountOrPropertyId?: string;
  fieldMappingsCount: number;
  errorLog?: string;
}

export interface FieldMapping {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceField: string;
  targetUnifiedField: 'campaign' | 'channel' | 'spend' | 'leads' | 'conversions' | 'revenue' | 'date' | 'leadStage' | 'region';
  confidenceScore: number;
  isApproved: boolean;
  sampleValues?: string[];
}

export interface EditHistoryEntry {
  id: string;
  field: string;
  originalValue: any;
  newValue: any;
  updatedBy: string;
  timestamp: string;
  sourceOfTruth: 'CRM' | 'Ads' | 'Manual Override' | 'AI Auto-Clean';
}

export interface UnifiedRecord {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: DataSourceType;
  campaign: string;
  channel: string;
  date: string;
  spendINR: number;
  leads: number;
  conversions: number;
  revenueINR: number;
  leadStage?: string;
  region?: string;
  isEdited?: boolean;
  editHistory?: EditHistoryEntry[];
  status: 'active' | 'recycled';
  qualityScore?: number;
  hasDuplicateWarning?: boolean;
}

export interface SyncHistoryEntry {
  id: string;
  sourceId: string;
  sourceName: string;
  syncType: 'auto' | 'manual' | 'file_upload';
  timestamp: string;
  recordsAdded: number;
  recordsUpdated: number;
  failedRecords: number;
  duplicatesCount: number;
  status: 'success' | 'failed' | 'partial';
  errorLog?: string;
}

export interface DataQualityReport {
  cleanDataPct: number;
  duplicatePct: number;
  missingFieldsPct: number;
  errorRecordsPct: number;
  overallQualityScore: number;
  totalUnifiedRecords: number;
  activeSourcesCount: number;
  dataFreshnessScore: number;
}

export interface RecycleBinItem {
  id: string;
  recordId: string;
  sourceName: string;
  recordSummary: string;
  deletedBy: string;
  deletedAt: string;
  recordData: UnifiedRecord;
}

export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: 'weekly' | 'daily';
  dayOfWeek: 'Sunday' | 'Monday' | 'Friday';
  timeUtc: string;
  retentionWeeks: number;
  autoUploadCloud: boolean;
  lastBackupAt: string;
  nextScheduledBackup: string;
}

export interface DataSynopsis {
  totalRecordsUploaded: number;
  uniqueOPIDs: number;
  duplicateOPIDs: number;
  validRecords: number;
  invalidRecords: number;
  datasetType: string;
  dateRange: { minDate: string; maxDate: string };
  projectsAvailable: { count: number; items: string[] };
  salesExecutivesAvailable: { count: number; items: string[] };
  salesManagersAvailable: { count: number; items: string[] };
  leadSourcesAvailable: { count: number; items: string[] };
  leadStatusDistribution: Record<string, number>;
  pushStatusDistribution: Record<string, number>;
  siteVisitDistribution: Record<string, number>;
  revenueBookingInfo: {
    hasRevenueData: boolean;
    totalBookings: number;
    totalRevenueINR: number;
  };
  missingImportantFields: string[];
  mappedFields: Record<string, string>;
  unmappedFields: string[];
}



