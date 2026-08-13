import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Table,
  ArrowRight,
  Database,
  AlertCircle,
  Clock,
  Link,
  Clipboard,
  FileText,
  Search,
  Layers,
  HelpCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Terminal,
  Trash2,
  Users,
  Send,
  Building2,
  UserPlus,
  MapPin,
  Globe,
  Share2,
  Receipt,
  Megaphone
} from 'lucide-react';
import { CSVUploadRecord, DataSynopsis } from '../types';
import { api } from '../lib/api';

export interface BatchQueueItem {
  id: string;
  fileName: string;
  sheetName?: string;
  section: 'LEAD' | 'PUSH' | 'VISIT' | 'BOOKING' | 'META' | 'GOOGLE' | 'OTHER';
  rows: any[];
  headers: string[];
  mappedFields: Record<string, string>;
  recordCount: number;
}

export const CSVUploadView: React.FC<{
  onUploadSuccess?: () => void;
  onNavigateWithPrompt?: (tab: 'chat' | 'reports' | 'insights', prompt: string) => void;
}> = ({ onUploadSuccess, onNavigateWithPrompt }) => {
  // 7 Dedicated Upload Sections: 'LEAD', 'PUSH', 'VISIT', 'BOOKING', 'META', 'GOOGLE', 'OTHER'
  const [selectedReportSection, setSelectedReportSection] = useState<'LEAD' | 'PUSH' | 'VISIT' | 'BOOKING' | 'META' | 'GOOGLE' | 'OTHER'>('LEAD');
  const [activeTab, setActiveTab] = useState<'file' | 'google' | 'paste'>('file');

  // Multi-File & Multi-Section Batch Queue State
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [batchUploading, setBatchUploading] = useState(false);

  // Clear & Modal States
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // Active Dataset State
  const [activeDataset, setActiveDataset] = useState<{ fileName: string; recordCount: number; sampleRows?: any[] } | null>(null);

  // Google Sheet State
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [fetchingGoogleSheet, setFetchingGoogleSheet] = useState(false);

  // Paste Data State
  const [pastedText, setPastedText] = useState('');

  // Parsed Shared State
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [datasetName, setDatasetName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Field Mapping State
  const [fileHeaderMappings, setFileHeaderMappings] = useState<Record<string, string>>({});

  // Mode Toggle & Validation Summary
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');
  const [lastUploadValidation, setLastUploadValidation] = useState<{
    totalUploaded: number;
    duplicatesDetected: number;
    uniqueRecords: number;
    qualityScore: number;
    uploadMode: string;
  } | null>(null);

  // Report Classification & Quality Audit State
  const [detectedReportType, setDetectedReportType] = useState<{
    type: string;
    label: string;
    description: string;
    confidence: number;
    color: string;
  }>({
    type: 'LEAD',
    label: 'REPORT A — Lead / Presales Report',
    description: 'Contains top-of-funnel lead generation and presales qualification data.',
    confidence: 95,
    color: 'emerald'
  });

  const [dataQualityMetrics, setDataQualityMetrics] = useState<{
    totalRecords: number;
    mappedRecords: number;
    unmatchedRecords: number;
    duplicateRecords: number;
    missingIds: number;
    missingDates: number;
    missingSources: number;
    qualityScore: number;
    joinSuccessRate: number;
  }>({
    totalRecords: 0,
    mappedRecords: 0,
    unmatchedRecords: 0,
    duplicateRecords: 0,
    missingIds: 0,
    missingDates: 0,
    missingSources: 0,
    qualityScore: 98,
    joinSuccessRate: 96
  });

  const [uploading, setUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<CSVUploadRecord[]>([]);
  const [dataSynopsis, setDataSynopsis] = useState<DataSynopsis | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUploads = async () => {
    try {
      const history = await api.getUploadHistory();
      setUploadHistory(history);
      const active = await api.getActiveDataset();
      setActiveDataset(active);
      const synopsis = await api.getDataSynopsis();
      setDataSynopsis(synopsis);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearActiveDataset = async () => {
    try {
      await api.clearActiveDataset();
      setActiveDataset(null);
      setMessage({ type: 'success', text: 'Active dataset cleared. Engine reset to baseline.' });
      if (onUploadSuccess) onUploadSuccess();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to clear active dataset' });
    }
  };

  const handleClearAllDatasets = async () => {
    setClearingAll(true);
    try {
      await api.clearAllUploadedDatasets();
      setActiveDataset(null);
      setUploadHistory([]);
      setBatchQueue([]);
      setParsedRows([]);
      setHeaders([]);
      setFile(null);
      setShowClearAllConfirm(false);
      setMessage({ type: 'success', text: 'All uploaded datasets cleared successfully. Dashboard reset to baseline.' });
      if (onUploadSuccess) onUploadSuccess();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to clear all datasets' });
    } finally {
      setClearingAll(false);
    }
  };

  const handleDeleteSingleDataset = async (id: string, fileName: string) => {
    setDeletingId(id);
    try {
      await api.deleteUploadedDataset(id);
      setMessage({ type: 'success', text: `Dataset "${fileName}" deleted successfully.` });
      await loadUploads();
      if (onUploadSuccess) onUploadSuccess();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || `Failed to delete dataset "${fileName}"` });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

  // Standard Target Fields Options for Semantic Mapping
  const STANDARD_TARGET_FIELDS = [
    { value: 'project_name', label: 'project_name (Project / Property Name)' },
    { value: 'opportunity_id', label: 'opportunity_id (OPID / 18-Digit ID / Lead ID)' },
    { value: 'account_id', label: 'account_id (Account ID)' },
    { value: 'enquiry_source', label: 'enquiry_source (Enquiry Source / UTM Source / Channel)' },
    { value: 'enquiry_sub_source', label: 'enquiry_sub_source (Enquiry Sub Source)' },
    { value: 'campaign', label: 'campaign (Primary Campaign Source / Last Campaign / UTM Campaign)' },
    { value: 'presales_agent', label: 'presales_agent (Presales Agent / Telecaller)' },
    { value: 'sales_manager', label: 'sales_manager (Assign to Sales Manager / Opportunity Owner / Sales Manager)' },
    { value: 'sales_stage', label: 'sales_stage (Stage / Status / Pipeline Stage)' },
    { value: 'push_date', label: 'push_date (Assign to Sales On Date / Assign to Sales Date / Push Date)' },
    { value: 'lead_created_date', label: 'lead_created_date (Created Date)' },
    { value: 'site_visit_date', label: 'site_visit_date (Date Of Site Visit / SV Date)' },
    { value: 'site_visit_done', label: 'site_visit_done (Is Site Visit Done / Is Revisit Done)' },
    { value: 'walk_in_source', label: 'walk_in_source (Walk-in Source / Walk-in Sub Source / Walk-In CP)' },
    { value: 'visit_type', label: 'visit_type (Is HO Visit / Virtual Visit / Customer Location Visit / Revisit)' },
    { value: 'channel_partner', label: 'channel_partner (Channel Partner 1..5 / CP Name)' },
    { value: 'fos_sourcing', label: 'fos_sourcing (Field Officer / Sourcing F.O.S. 1..5)' },
    { value: 'revenue', label: 'revenue (Booking Value / Unit Value / Monetary Collection)' },
    { value: 'booking_date', label: 'booking_date (Close Date / Manual Booking Date)' },
    { value: 'unqualified_reason', label: 'unqualified_reason (Reason for Unqualify / Lost Remarks)' },
    { value: 'customer_name', label: 'customer_name (Opportunity Name / Enquiry Name / Account Name)' },
    { value: 'presales_rating', label: 'presales_rating (Presales Lead Rating)' },
    { value: 'sales_rating', label: 'sales_rating (Sales Lead Rating)' },
    { value: 'sm_feedback', label: 'sm_feedback (Sales Last Call Description / Presales Last Call Description / SM Feedback)' },
    { value: 'zone', label: 'zone (Zone / Location / Pincode)' },
    { value: 'custom_field', label: 'Dynamic Custom Field (Preserved in Raw Model)' }
  ];

  // Helper to infer data type from sample values
  const inferDataType = (val: any): string => {
    if (val === undefined || val === null || val === '') return 'String';
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str) || !isNaN(Date.parse(str)) && str.includes('/')) return 'Date';
    if (/^(₹|\$|USD|INR|\d+(\.\d+)?$)/i.test(str) && !isNaN(Number(str.replace(/[^0-9.-]+/g, '')))) return 'Numeric / Currency';
    if (/^(OPID|LEAD|ID|ACC)-\d+/i.test(str) || (str.length >= 15 && !str.includes(' '))) return 'Identifier Key';
    return 'Text String';
  };

  // Helper to auto-map columns & analyze quality + report type
  const autoDetectColumnsAndQuality = (keys: string[], rows: any[]) => {
    const autoMap: Record<string, string> = {};

    const keysLower = keys.map(k => k.toLowerCase());

    // Detect Report Type based on selected section & headers
    let reportType = selectedReportSection as string;
    let reportLabel = 'REPORT A — Lead / Presales Report';
    let reportDesc = 'Detects top-of-funnel Lead Generation and Presales Qualification metrics.';
    let reportColor = 'emerald';

    if (selectedReportSection === 'PUSH') {
      reportType = 'PUSH';
      reportLabel = 'REPORT B — Push to Sales Handover Report';
      reportDesc = 'Detects presales to sales manager handovers, push dates, and sales contact attempts.';
      reportColor = 'purple';
    } else if (selectedReportSection === 'VISIT') {
      reportType = 'VISIT';
      reportLabel = 'REPORT C — Site Visit / Sales VDNB Report';
      reportDesc = 'Detects site visits, revisits, virtual tours, and Visit-Done-Not-Booked (VDNB) performance.';
      reportColor = 'amber';
    } else if (selectedReportSection === 'BOOKING') {
      reportType = 'REVENUE';
      reportLabel = 'REPORT D — Revenue / Booking Financial Report';
      reportDesc = 'Detects revenue, booking monetary values, unit costs, booking dates, and financial collections.';
      reportColor = 'emerald';
    } else if (selectedReportSection === 'META') {
      reportType = 'META';
      reportLabel = 'REPORT E1 — Meta Ads Marketing & Spend Report';
      reportDesc = 'Detects Facebook & Instagram ad campaigns, ad set spend, impressions, clicks, leads & CPL.';
      reportColor = 'blue';
    } else if (selectedReportSection === 'GOOGLE') {
      reportType = 'GOOGLE';
      reportLabel = 'REPORT E2 — Google Ads & GA4 Analytics Report';
      reportDesc = 'Detects Google Ads, GA4 web sessions, search campaigns, keyword spend, CPL & ROAS.';
      reportColor = 'cyan';
    } else if (selectedReportSection === 'OTHER') {
      reportType = 'OTHER';
      reportLabel = 'REPORT E3 — Other Marketing & Offline Expense Report';
      reportDesc = 'Detects billboards, print ads, radio, channel partner commissions, events, PR & offline spend.';
      reportColor = 'rose';
    }

    const hasPushFields = keysLower.some(k => k.includes('pushed') || k.includes('assign to sales') || k.includes('push date') || k.includes('handover'));
    const hasVisitFields = keysLower.some(k => k.includes('visit') || k.includes('vdnb') || k.includes('walk-in') || k.includes('revisit') || k.includes('ho visit'));
    const hasRevenueFields = keysLower.some(k => k.includes('revenue') || k.includes('booking amount') || k.includes('unit value') || k.includes('collection'));
    const hasGA4Fields = keysLower.some(k => k.includes('session') || k.includes('spend') || k.includes('cpl') || k.includes('roas') || k.includes('utm_'));

    if (hasRevenueFields && selectedReportSection !== 'META' && selectedReportSection !== 'GOOGLE') {
      reportType = 'REVENUE';
      reportLabel = 'REPORT D — Revenue / Booking Financial Report';
      reportDesc = 'Detects revenue, booking monetary values, unit costs, and financial collections.';
      reportColor = 'emerald';
    } else if (hasVisitFields && selectedReportSection === 'VISIT') {
      reportType = 'VISIT';
      reportLabel = 'REPORT C — Site Visit / Sales VDNB Report';
      reportDesc = 'Detects site visits, revisits, virtual tours, and Visit-Done-Not-Booked (VDNB) performance.';
      reportColor = 'amber';
    } else if (hasPushFields && selectedReportSection === 'PUSH') {
      reportType = 'PUSH';
      reportLabel = 'REPORT B — Push to Sales Handover Report';
      reportDesc = 'Detects presales to sales manager handovers, push dates, and sales contact attempts.';
      reportColor = 'purple';
    }

    setDetectedReportType({
      type: reportType,
      label: reportLabel,
      description: reportDesc,
      confidence: 98,
      color: reportColor
    });

    // Auto-map every exact header h in keys to standard field or custom field
    keys.forEach(h => {
      const lower = h.toLowerCase().trim();
      if (lower === 'project' || lower.includes('project') || lower.includes('property') || lower.includes('building')) {
        autoMap[h] = 'project_name';
      } else if (lower.includes('opid') || lower.includes('18 digit') || lower.includes('opportunity id') || lower.includes('lead id')) {
        autoMap[h] = 'opportunity_id';
      } else if (lower === 'account id' || lower.includes('account id')) {
        autoMap[h] = 'account_id';
      } else if (lower.includes('walk-in') || lower.includes('walk in')) {
        autoMap[h] = 'walk_in_source';
      } else if (lower.includes('channel partner')) {
        autoMap[h] = 'channel_partner';
      } else if (lower.includes('field officer') || lower.includes('sourcing') || lower.includes('f.o.s.')) {
        autoMap[h] = 'fos_sourcing';
      } else if (lower.includes('revisit') || lower.includes('ho visit') || lower.includes('virtual visit') || lower.includes('customer location visit')) {
        autoMap[h] = 'visit_type';
      } else if (lower.includes('enquiry sub source') || lower.includes('sub source')) {
        autoMap[h] = 'enquiry_sub_source';
      } else if (lower.includes('enquiry source') || lower.includes('utm source') || lower.includes('source') || lower.includes('channel')) {
        autoMap[h] = 'enquiry_source';
      } else if (lower.includes('campaign') || lower.includes('ad set') || lower.includes('ad name')) {
        autoMap[h] = 'campaign';
      } else if (lower.includes('presales agent') || lower.includes('telecaller')) {
        autoMap[h] = 'presales_agent';
      } else if (lower.includes('assign to sales manager') || lower.includes('sales manager') || lower.includes('sm name') || lower.includes('opportunity owner') || lower.includes('sales owner')) {
        autoMap[h] = 'sales_manager';
      } else if (lower.includes('assign to sales on date') || lower.includes('assign to sales date') || lower.includes('push date') || lower.includes('handover date')) {
        autoMap[h] = 'push_date';
      } else if (lower.includes('is site visit done')) {
        autoMap[h] = 'site_visit_done';
      } else if (lower.includes('date of site visit') || lower.includes('site visit') || lower.includes('sv date') || lower.includes('visit date')) {
        autoMap[h] = 'site_visit_date';
      } else if (lower.includes('stage') || lower.includes('pipeline')) {
        autoMap[h] = 'sales_stage';
      } else if (lower.includes('created date')) {
        autoMap[h] = 'lead_created_date';
      } else if (lower.includes('close date') || lower.includes('manual booking date') || lower.includes('booking date')) {
        autoMap[h] = 'booking_date';
      } else if (lower.includes('unqualify') || lower.includes('reason') || lower.includes('lost remarks') || lower.includes('lost')) {
        autoMap[h] = 'unqualified_reason';
      } else if (lower.includes('presales lead rating') || lower.includes('presales rating')) {
        autoMap[h] = 'presales_rating';
      } else if (lower.includes('sales lead rating') || lower.includes('sales rating')) {
        autoMap[h] = 'sales_rating';
      } else if (lower.includes('feedback') || lower.includes('call description') || lower.includes('description')) {
        autoMap[h] = 'sm_feedback';
      } else if (lower.includes('enquiry name') || lower.includes('account name') || lower.includes('opportunity name') || lower.includes('customer name')) {
        autoMap[h] = 'customer_name';
      } else if (lower.includes('revenue') || lower.includes('booking amount') || lower.includes('unit value') || lower.includes('collection') || lower.includes('amount')) {
        autoMap[h] = 'revenue';
      } else if (lower.includes('zone') || lower.includes('location') || lower.includes('pincode')) {
        autoMap[h] = 'zone';
      } else {
        autoMap[h] = 'custom_field';
      }
    });

    setFileHeaderMappings(autoMap);

    // Calculate Data Quality Metrics
    const total = rows.length;
    let missingIdCount = 0;
    let missingDateCount = 0;
    let missingSourceCount = 0;
    const seenIds = new Set<string>();
    let dupeCount = 0;

    const opIdHeader = keys.find(k => autoMap[k] === 'opportunity_id');
    const sourceHeader = keys.find(k => autoMap[k] === 'enquiry_source');

    rows.forEach(r => {
      const idVal = opIdHeader ? r[opIdHeader] : null;
      if (!idVal || String(idVal).trim() === '') {
        missingIdCount++;
      } else {
        const idStr = String(idVal).trim();
        if (seenIds.has(idStr)) dupeCount++;
        else seenIds.add(idStr);
      }

      const dateVal = r['Created Date'] || r['created_date'] || r['Date'] || r['Push Date'] || r['Booking Date'] || r['Date Of Site Visit'];
      if (!dateVal || String(dateVal).trim() === '') missingDateCount++;

      const sourceVal = sourceHeader ? r[sourceHeader] : null;
      if (!sourceVal || String(sourceVal).trim() === '') missingSourceCount++;
    });

    const mappedCount = Object.values(autoMap).filter(v => v !== 'custom_field').length;
    const qualityScore = Math.max(70, Math.min(100, Math.round(100 - (missingIdCount * 5 + dupeCount * 3 + missingDateCount * 2) / Math.max(1, total) * 100)));

    setDataQualityMetrics({
      totalRecords: total,
      mappedRecords: mappedCount,
      unmatchedRecords: Math.max(0, keys.length - mappedCount),
      duplicateRecords: dupeCount,
      missingIds: missingIdCount,
      missingDates: missingDateCount,
      missingSources: missingSourceCount,
      qualityScore,
      joinSuccessRate: 98
    });
  };

  // Helper to parse a 2D raw grid into cleaned row objects and full column header list
  const parse2DGridToRows = (grid: any[][]): { rows: any[]; headers: string[] } => {
    if (!grid || !Array.isArray(grid) || grid.length === 0) return { rows: [], headers: [] };

    // Find the optimal header row index in the top 15 rows:
    // The row that contains the maximum number of non-empty text strings
    let bestHeaderRowIdx = 0;
    let maxNonEmptyCells = 0;

    for (let r = 0; r < Math.min(15, grid.length); r++) {
      const row = grid[r];
      if (!Array.isArray(row)) continue;
      const nonEmpties = row.filter(cell => cell !== undefined && cell !== null && String(cell).trim().length > 0);
      if (nonEmpties.length > maxNonEmptyCells) {
        maxNonEmptyCells = nonEmpties.length;
        bestHeaderRowIdx = r;
      }
    }

    const rawHeaderRow = grid[bestHeaderRowIdx] || [];
    const headers: string[] = [];
    const seen: Record<string, number> = {};

    rawHeaderRow.forEach((cell: any, colIdx: number) => {
      let rawName = String(cell !== undefined && cell !== null ? cell : '').trim();
      if (!rawName) rawName = `Column_${colIdx + 1}`;
      if (seen[rawName]) {
        seen[rawName]++;
        headers.push(`${rawName}_${seen[rawName]}`);
      } else {
        seen[rawName] = 1;
        headers.push(rawName);
      }
    });

    const rows: any[] = [];
    for (let r = bestHeaderRowIdx + 1; r < grid.length; r++) {
      const rowData = grid[r];
      if (!Array.isArray(rowData)) continue;

      let hasAnyVal = false;
      const rowObj: Record<string, any> = {};

      headers.forEach((hdr, colIdx) => {
        const val = rowData[colIdx];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          hasAnyVal = true;
          rowObj[hdr] = val;
        } else {
          rowObj[hdr] = '';
        }
      });

      if (hasAnyVal) {
        rows.push(rowObj);
      }
    }

    const allKeysSet = new Set<string>(headers);
    rows.forEach(r => {
      Object.keys(r).forEach(k => {
        if (k && k.trim()) allKeysSet.add(k.trim());
      });
    });

    return { rows, headers: Array.from(allKeysSet) };
  };

  // Process rows array and update state
  const handleRawRowsParsed = (rows: any[], detectedHeaders: string[] = [], sourceName: string) => {
    if (!rows || rows.length === 0) {
      setMessage({ type: 'error', text: 'No readable data rows found in the selected file or sheet.' });
      return;
    }

    // Collect union of all keys across all row objects + detectedHeaders
    const allKeysSet = new Set<string>(detectedHeaders || []);
    rows.forEach(r => {
      if (r && typeof r === 'object') {
        Object.keys(r).forEach(k => {
          if (k && String(k).trim()) {
            allKeysSet.add(String(k).trim());
          }
        });
      }
    });

    const keys = Array.from(allKeysSet);
    setHeaders(keys);
    setParsedRows(rows);
    setDatasetName(sourceName);
    autoDetectColumnsAndQuality(keys, rows);
    setMessage({
      type: 'success',
      text: `Loaded ${rows.length} rows with ${keys.length} columns from "${sourceName}".`
    });
  };

  // Helper to auto-classify section type based on headers or file name
  const autoDetectSectionForItem = (fileName: string, keys: string[]): 'LEAD' | 'PUSH' | 'VISIT' | 'BOOKING' | 'META' | 'GOOGLE' | 'OTHER' => {
    const fnLower = fileName.toLowerCase();
    const keysLower = keys.map(k => k.toLowerCase());

    if (fnLower.includes('fb') || fnLower.includes('facebook') || fnLower.includes('instagram') || fnLower.includes('meta')) return 'META';
    if (fnLower.includes('google') || fnLower.includes('ga4') || fnLower.includes('gads') || fnLower.includes('adwords')) return 'GOOGLE';
    if (fnLower.includes('push') || fnLower.includes('handover') || fnLower.includes('assign')) return 'PUSH';
    if (fnLower.includes('visit') || fnLower.includes('vdnb') || fnLower.includes('walkin')) return 'VISIT';
    if (fnLower.includes('booking') || fnLower.includes('revenue') || fnLower.includes('collection') || fnLower.includes('financial') || fnLower.includes('closure')) return 'BOOKING';
    if (fnLower.includes('offline') || fnLower.includes('hoarding') || fnLower.includes('billboard') || fnLower.includes('print') || fnLower.includes('expense')) return 'OTHER';
    if (fnLower.includes('lead') || fnLower.includes('presales') || fnLower.includes('enquiry')) return 'LEAD';

    if (keysLower.some(k => k.includes('pushed') || k.includes('assign to sales') || k.includes('push date') || k.includes('handover'))) return 'PUSH';
    if (keysLower.some(k => k.includes('visit') || k.includes('vdnb') || k.includes('walk-in') || k.includes('revisit'))) return 'VISIT';
    if (keysLower.some(k => k.includes('booking amount') || k.includes('unit value') || k.includes('revenue') || k.includes('collection') || k.includes('booking date'))) return 'BOOKING';
    if (keysLower.some(k => k.includes('ad set') || k.includes('meta') || k.includes('cpl') || k.includes('facebook'))) return 'META';
    if (keysLower.some(k => k.includes('keyword') || k.includes('google') || k.includes('ga4') || k.includes('session'))) return 'GOOGLE';
    if (keysLower.some(k => k.includes('billboard') || k.includes('hoarding') || k.includes('commission') || k.includes('expense') || k.includes('vendor'))) return 'OTHER';

    return selectedReportSection || 'LEAD';
  };

  // Process multiple files & multi-sheet Excels at once
  const handleMultipleFilesSelect = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    setMessage(null);
    const newItems: BatchQueueItem[] = [];

    for (let i = 0; i < filesArray.length; i++) {
      const selectedFile = filesArray[i];
      const fnLower = selectedFile.name.toLowerCase();

      if (fnLower.endsWith('.csv') || fnLower.endsWith('.tsv')) {
        await new Promise<void>((resolve) => {
          Papa.parse(selectedFile, {
            header: false,
            skipEmptyLines: 'greedy',
            complete: (results) => {
              const grid = (results.data || []) as any[][];
              const { rows, headers: extractedHeaders } = parse2DGridToRows(grid);
              if (rows.length > 0) {
                const autoSec = autoDetectSectionForItem(selectedFile.name, extractedHeaders);
                newItems.push({
                  id: `item-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
                  fileName: selectedFile.name,
                  section: autoSec,
                  rows,
                  headers: extractedHeaders,
                  mappedFields: {},
                  recordCount: rows.length
                });
              }
              resolve();
            },
            error: () => resolve()
          });
        });
      } else {
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const buffer = e.target?.result as ArrayBuffer;
              const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

              if (wb.SheetNames.length === 1) {
                const sheetName = wb.SheetNames[0];
                const worksheet = wb.Sheets[sheetName];
                const grid = (XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) || []) as any[][];
                const { rows, headers: extractedHeaders } = parse2DGridToRows(grid);
                if (rows.length > 0) {
                  const autoSec = autoDetectSectionForItem(selectedFile.name, extractedHeaders);
                  newItems.push({
                    id: `item-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
                    fileName: selectedFile.name,
                    section: autoSec,
                    rows,
                    headers: extractedHeaders,
                    mappedFields: {},
                    recordCount: rows.length
                  });
                }
              } else {
                // Multi-sheet Excel workbook: split sheets into individual queue items!
                wb.SheetNames.forEach((sheetName, sheetIdx) => {
                  const worksheet = wb.Sheets[sheetName];
                  const grid = (XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) || []) as any[][];
                  const { rows, headers: extractedHeaders } = parse2DGridToRows(grid);
                  if (rows.length > 0) {
                    const autoSec = autoDetectSectionForItem(`${selectedFile.name} - ${sheetName}`, extractedHeaders);
                    newItems.push({
                      id: `item-${Date.now()}-${i}-${sheetIdx}-${Math.random().toString(36).substring(2, 6)}`,
                      fileName: `${selectedFile.name} [Sheet: ${sheetName}]`,
                      sheetName,
                      section: autoSec,
                      rows,
                      headers: extractedHeaders,
                      mappedFields: {},
                      recordCount: rows.length
                    });
                  }
                });
              }
            } catch (err) {
              console.error('XLSX error:', err);
            }
            resolve();
          };
          reader.readAsArrayBuffer(selectedFile);
        });
      }
    }

    if (newItems.length > 0) {
      setBatchQueue(prev => [...prev, ...newItems]);
      const last = newItems[newItems.length - 1];
      setParsedRows(last.rows);
      setHeaders(last.headers);
      setDatasetName(last.fileName);
      autoDetectColumnsAndQuality(last.headers, last.rows);
      setMessage({
        type: 'success',
        text: `Staged ${newItems.length} dataset section(s) with ${newItems.reduce((acc, item) => acc + item.recordCount, 0).toLocaleString('en-IN')} total rows ready for simultaneous upload.`
      });
    } else {
      setMessage({ type: 'error', text: 'No readable data rows found in selected files.' });
    }
  };

  // Submit all items in batch queue at once
  const handleBatchSubmit = async () => {
    if (batchQueue.length === 0) return;

    setBatchUploading(true);
    setMessage(null);

    const payloadItems = batchQueue.map(item => {
      const constructedMap: Record<string, string> = {};
      if (item.headers) {
        item.headers.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes('project')) constructedMap['project_name'] = h;
          if (lower.includes('source') || lower.includes('channel')) constructedMap['enquiry_source'] = h;
          if (lower.includes('campaign')) constructedMap['campaign'] = h;
          if (lower.includes('spend') || lower.includes('cost')) constructedMap['spend'] = h;
          if (lower.includes('revenue') || lower.includes('booking')) constructedMap['revenue'] = h;
          if (lower.includes('lead')) constructedMap['leads'] = h;
        });
      }
      return {
        fileName: item.fileName,
        records: item.rows,
        mappedFields: constructedMap,
        section: item.section
      };
    });

    try {
      const res = await api.batchUploadCSV(payloadItems, uploadMode);
      if (res.validation) {
        setLastUploadValidation(res.validation);
      }
      setMessage({
        type: 'success',
        text: res.message || `Successfully uploaded & synchronized ${batchQueue.length} dataset sections simultaneously!`
      });
      setBatchQueue([]);
      setParsedRows([]);
      setHeaders([]);
      setFile(null);
      await loadUploads();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to complete batch multi-section upload' });
    } finally {
      setBatchUploading(false);
    }
  };

  // 1. FILE UPLOAD HANDLER (.xlsx, .xls, .xlsb, .xlsm, .csv, .tsv, .ods)
  const handleFileSelect = (selectedFile: File) => {
    handleMultipleFilesSelect([selectedFile]);
  };

  // Switch Sheet Tab within loaded Workbook
  const handleSheetChange = (sheetName: string) => {
    if (!workbook) return;
    setSelectedSheet(sheetName);
    const worksheet = workbook.Sheets[sheetName];
    const grid = (XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) || []) as any[][];
    const { rows, headers: extractedHeaders } = parse2DGridToRows(grid);
    handleRawRowsParsed(rows, extractedHeaders, `${file?.name || 'Excel File'} [${sheetName}]`);
  };

  // 2. GOOGLE SHEETS HANDLER
  const handleImportGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a Google Sheets URL first.' });
      return;
    }

    setFetchingGoogleSheet(true);
    setMessage(null);

    try {
      const data = await api.fetchGoogleSheetData(googleSheetUrl.trim());
      handleRawRowsParsed(data.rows, data.headers || [], `Google Sheet (${data.recordCount} rows)`);
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || 'Unable to import Google Sheet. Please check the URL and make sure link sharing is enabled.'
      });
    } finally {
      setFetchingGoogleSheet(false);
    }
  };

  // 3. COPY-PASTE DATA HANDLER
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setMessage({ type: 'error', text: 'Please paste spreadsheet data into the text box.' });
      return;
    }

    try {
      const parsed = Papa.parse(pastedText.trim(), {
        header: false,
        skipEmptyLines: 'greedy'
      });

      if (parsed.data && parsed.data.length > 0) {
        const grid = parsed.data as any[][];
        const { rows, headers: extractedHeaders } = parse2DGridToRows(grid);
        handleRawRowsParsed(rows, extractedHeaders, `Pasted Table Data (${rows.length} rows)`);
      } else {
        setMessage({ type: 'error', text: 'Could not detect table headers in pasted text.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to parse pasted text. Ensure headers are included.' });
    }
  };

  // SUBMIT UPLOAD TO CMO STORE
  const handleUploadSubmit = async () => {
    if (parsedRows.length === 0) return;

    setUploading(true);
    setMessage(null);

    const constructedMap: Record<string, string> = {};
    Object.entries(fileHeaderMappings).forEach(([hdr, target]) => {
      const targetStr = String(target);
      if (targetStr && targetStr !== 'custom_field') {
        constructedMap[targetStr] = hdr;
      }
    });

    try {
      const res = await api.uploadCSV(
        datasetName || 'uploaded_cmo_data.xlsx',
        parsedRows,
        constructedMap,
        uploadMode,
        selectedReportSection
      );
      if (res.validation) {
        setLastUploadValidation(res.validation);
      }
      setMessage({
        type: 'success',
        text: `Successfully imported ${parsedRows.length} records into CMO Analytics engine!`
      });

      // Clear current state
      setFile(null);
      setWorkbook(null);
      setParsedRows([]);
      setHeaders([]);
      setGoogleSheetUrl('');
      setPastedText('');

      loadUploads();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to import dataset into server' });
    } finally {
      setUploading(false);
    }
  };

  // Search Filtered Rows for Preview
  const filteredPreviewRows = parsedRows.filter(row => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return Object.values(row).some(v => String(v).toLowerCase().includes(searchLower));
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Spreadsheet & Multi-Section Data Engine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                ⚡ Unlimited Uploads
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload multi-section Excel workbooks (.xlsx, .xls, .ods, .csv) with unlimited rows. Upload across sections simultaneously or clear specific datasets.
            </p>
          </div>
        </div>

        {/* Clear All Datasets Header Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowClearAllConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Clear All Uploaded Datasets</span>
          </button>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Clear All Uploaded Data?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to clear <strong>all uploaded datasets and custom records</strong>? This will purge all synced marketing/funnel reports and reset the CMO Analytics engine to default baseline benchmarks.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                disabled={clearingAll}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllDatasets}
                disabled={clearingAll}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/25 transition cursor-pointer disabled:opacity-50"
              >
                {clearingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing All Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Purge Everything</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Mode Selector & Validation Card */}
      <div className="grid grid-cols-1 gap-4">
        {/* Mode Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Data Synchronization & Upload Mode
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose how uploaded data syncs with existing dashboards & report datasets.
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setUploadMode('replace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  uploadMode === 'replace'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Replace Existing Data
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('append')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  uploadMode === 'append'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Append / Merge Data
              </button>
            </div>
          </div>

          <div className="text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {uploadMode === 'replace' ? (
              <span><strong>Replace Mode Active (Recommended):</strong> Clears previous datasets before syncing this upload. All dashboards will use this uploaded dataset as the single source of truth with 100% exact metrics.</span>
            ) : (
              <span><strong>Append Mode Active:</strong> Merges new files with existing uploaded reports. Duplicate leads across files are automatically identified and deduplicated using Opportunity 18-digit ID / OPID / Phone / Email.</span>
            )}
          </div>
        </div>

        {/* Validation Summary Box */}
        {lastUploadValidation && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-5 rounded-2xl space-y-3 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Upload-to-Dashboard Synchronization Complete</span>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">
                {lastUploadValidation.uploadMode === 'replace' ? 'Single Source of Truth' : 'Appended & Deduplicated'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Raw Uploaded</div>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100">{lastUploadValidation.totalUploaded.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Duplicate Leads Removed</div>
                <div className="text-xl font-black text-rose-600 dark:text-rose-400">{lastUploadValidation.duplicatesDetected.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Unique Leads Synchronized</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{lastUploadValidation.uniqueRecords.toLocaleString()}</div>
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Data Quality Score</div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{lastUploadValidation.qualityScore}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Dataset Banner */}
      {activeDataset && (
        <div className="bg-slate-900 dark:bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-lg space-y-4 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-indigo-200">Active Live Dataset Synced</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    AI Engine Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  <strong className="text-white">{activeDataset.fileName}</strong> ({activeDataset.recordCount.toLocaleString('en-IN')} records loaded and active)
                </p>
              </div>
            </div>
            <button
              onClick={handleClearActiveDataset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear & Reset Data
            </button>
          </div>

          <div className="pt-3 border-t border-indigo-500/20">
            <p className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Instant AI Commands (Click to Run Analysis & Generate Report):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigateWithPrompt?.('chat', `Perform full lead conversion rate, CPL, CAC, and revenue loss analysis on active dataset "${activeDataset.fileName}" in Indian Rupee terms (INR).`)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/50 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                    📊 Lead Conversion & CPL Breakdown
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Calculates conversion %, CPL and CAC in INR from your sheet</p>
              </button>

              <button
                onClick={() => onNavigateWithPrompt?.('chat', `Analyze lost leads and disqualification bottlenecks by sales manager and project name from active dataset "${activeDataset.fileName}".`)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/50 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                    📉 Lost Leads & Disqualification Audit
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Uncover top rejection reasons & team bottlenecks</p>
              </button>

              <button
                onClick={() => onNavigateWithPrompt?.('reports', `Generate an executive CMO briefing report with key takeaways and strategic recommendations based on dataset "${activeDataset.fileName}".`)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/50 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                    📄 Executive CMO Briefing PDF
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Generates clean executive PDF report from synced data</p>
              </button>

              <button
                onClick={() => onNavigateWithPrompt?.('chat', `Identify channel anomalies, cost inefficiencies, and recommended budget reallocations in INR for active dataset "${activeDataset.fileName}".`)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/50 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                    💰 Budget & ROI Optimization
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Budget reallocation & CAC optimization in INR</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6 Dedicated Upload Sections requested by User */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Select Upload Category (7 Marketing, Sales & Booking Report Categories)
          </h3>
          <span className="text-xs text-slate-500">Choose dataset type to upload & automatically map</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* 1. Lead Data */}
          <div
            onClick={() => setSelectedReportSection('LEAD')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedReportSection === 'LEAD'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-1.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  LEADS
                </span>
              </div>
              <div className="mt-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">1. Lead Data</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Incoming leads, enquiry sources, campaign names, telecaller ratings.
                </p>
              </div>
            </div>
            {selectedReportSection === 'LEAD' && (
              <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Target</span>
              </div>
            )}
          </div>

          {/* 2. Push Data */}
          <div
            onClick={() => setSelectedReportSection('PUSH')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedReportSection === 'PUSH'
                ? 'bg-purple-500/10 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-1.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Send className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  PUSH
                </span>
              </div>
              <div className="mt-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">2. Push Data</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Presales to Sales handovers, assigned Sales Managers & push dates.
                </p>
              </div>
            </div>
            {selectedReportSection === 'PUSH' && (
              <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Target</span>
              </div>
            )}
          </div>

          {/* 3. Visit Data */}
          <div
            onClick={() => setSelectedReportSection('VISIT')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedReportSection === 'VISIT'
                ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-1.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  VISITS
                </span>
              </div>
              <div className="mt-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">3. Visit Data</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Site visits, revisits, virtual tours & VDNB (Visit Done Not Booked) logs.
                </p>
              </div>
            </div>
            {selectedReportSection === 'VISIT' && (
              <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Target</span>
              </div>
            )}
          </div>

          {/* 4. Booking Data (REPORT D) */}
          <div
            onClick={() => setSelectedReportSection('BOOKING')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedReportSection === 'BOOKING'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-1.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  BOOKINGS
                </span>
              </div>
              <div className="mt-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">4. Booking Data</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Booking amounts, unit values, revenue, collections & booking dates.
                </p>
              </div>
            </div>
            {selectedReportSection === 'BOOKING' && (
              <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Target</span>
              </div>
            )}
          </div>

          {/* 5. Meta Data (Facebook / Instagram Ads) */}
          <div
            onClick={() => setSelectedReportSection('META')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedReportSection === 'META'
                ? 'bg-blue-500/10 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-1.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  META ADS
                </span>
              </div>
              <div className="mt-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">5. Meta Data</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  FB & IG Ad campaigns, impressions, reach, spend, leads & CPL.
                </p>
              </div>
            </div>
            {selectedReportSection === 'META' && (
              <div className="mt-2.5 pt-2 border-t border-blue-500/20 flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Target</span>
              </div>
            )}
          </div>

          {/* 6. Google Data (Google Ads & GA4) */}
          <div
            onClick={() => setSelectedReportSection('GOOGLE')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedReportSection === 'GOOGLE'
                ? 'bg-cyan-500/10 border-cyan-500 shadow-md ring-2 ring-cyan-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-1.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  GOOGLE / GA4
                </span>
              </div>
              <div className="mt-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">6. Google Data</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Google Ads & GA4 web sessions, search keywords, spend & ROAS.
                </p>
              </div>
            </div>
            {selectedReportSection === 'GOOGLE' && (
              <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex items-center gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Target</span>
              </div>
            )}
          </div>

          {/* 7. Other Marketing Expenses */}
          <div
            onClick={() => setSelectedReportSection('OTHER')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedReportSection === 'OTHER'
                ? 'bg-rose-500/10 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-1.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  OFFLINE / EXP
                </span>
              </div>
              <div className="mt-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">7. Other Expenses</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Hoardings, print ads, radio, channel partner commission, events & PR.
                </p>
              </div>
            </div>
            {selectedReportSection === 'OTHER' && (
              <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Target</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source Selection Tabs */}
      {!parsedRows.length && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-1.5 gap-1">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Excel & CSV File (.xlsx, .xls, .csv)</span>
            </button>

            <button
              onClick={() => setActiveTab('google')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Link className="w-4 h-4" />
              <span>Google Sheets Link</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clipboard className="w-4 h-4" />
              <span>Direct Copy-Paste Cells</span>
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* TAB 1: FILE UPLOAD (EXCEL / CSV) */}
            {activeTab === 'file' && (
              <div className="text-center space-y-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleMultipleFilesSelect(e.dataTransfer.files);
                    }
                  }}
                  className="p-8 md:p-12 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">
                    Drag & Drop single or multiple Excel / CSV files here
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                    Uploading into <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {
                        selectedReportSection === 'LEAD' ? 'REPORT A — Lead Data' :
                        selectedReportSection === 'PUSH' ? 'REPORT B — Push Data' :
                        selectedReportSection === 'VISIT' ? 'REPORT C — Visit Data' :
                        selectedReportSection === 'BOOKING' ? 'REPORT D — Booking & Revenue Financial Data' :
                        selectedReportSection === 'META' ? 'REPORT E1 — Meta Data (Facebook/Instagram)' :
                        selectedReportSection === 'GOOGLE' ? 'REPORT E2 — Google Data (Google Ads/GA4)' : 'REPORT E3 — Other Marketing & Offline Expenses'
                      }
                    </strong>. You can drop <strong>multiple files or multi-sheet workbooks</strong> simultaneously.
                  </p>

                  <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Select Files to Upload (Multiple Allowed)</span>
                    <input
                      type="file"
                      multiple
                      accept=".xlsx,.xls,.csv,.tsv,.ods,.xlsm,.xlsb"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleMultipleFilesSelect(e.target.files);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE SHEETS LINK */}
            {activeTab === 'google' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Link className="w-4 h-4 text-indigo-500" />
                    Google Sheets Shared Link
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMd.../edit#gid=0"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs rounded-xl p-3.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Google Sheet Sharing Setting:</strong> Ensure the Google Sheet permission is set to <strong>"Anyone with the link can view"</strong> (Share button → General Access → Anyone with link).
                  </div>
                </div>

                <button
                  onClick={handleImportGoogleSheet}
                  disabled={fetchingGoogleSheet || !googleSheetUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {fetchingGoogleSheet ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Fetching Google Sheet Rows...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Fetch & Parse Google Sheet</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: COPY PASTE CELLS */}
            {activeTab === 'paste' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Clipboard className="w-4 h-4 text-indigo-500" />
                    Paste Copied Cells (Ctrl + V / Cmd + V)
                  </label>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Campaign Name\tChannel\tSpend\tRevenue\tLeads\tConversions\nQ3 Search Ads\tGoogle Ads\t12000\t48000\t320\t42\nMeta Retargeting\tFacebook\t8500\t31000\t210\t28`}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-mono rounded-xl p-3.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <p className="text-[11px] text-slate-500">
                  Tip: Copy rows directly from Excel or Google Sheets (including header row) and paste them here.
                </p>

                <button
                  onClick={handleParsePastedText}
                  disabled={!pastedText.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Table className="w-4 h-4" />
                  <span>Parse Copied Table Text</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGED BATCH MULTI-SECTION QUEUE PANEL */}
      {batchQueue.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-indigo-500/40 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  Batch Multi-Section Queue
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {batchQueue.length} Dataset Section(s) Staged for Simultaneous Upload
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Review assigned report category sections and click below to upload all staged datasets simultaneously.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setBatchQueue([])}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Clear Queue
              </button>

              <button
                onClick={handleBatchSubmit}
                disabled={batchUploading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {batchUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading & Processing All Sections...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Upload All {batchQueue.length} Sections Simultaneously</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Staged Queue Items Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                  <th className="py-2.5 px-3">Dataset File / Sheet</th>
                  <th className="py-2.5 px-3">Assigned Funnel/Marketing Section</th>
                  <th className="py-2.5 px-3">Records</th>
                  <th className="py-2.5 px-3">Detected Headers</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{item.fileName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={item.section}
                        onChange={(e) => {
                          const newSec = e.target.value as any;
                          setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, section: newSec } : q));
                        }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="LEAD">1. LEAD DATA (Presales / Top-Funnel)</option>
                        <option value="PUSH">2. PUSH DATA (Handover to Sales)</option>
                        <option value="VISIT">3. VISIT DATA (Site Visits / VDNB)</option>
                        <option value="BOOKING">4. BOOKING DATA (Revenue / Financial Closures)</option>
                        <option value="META">5. META DATA (Facebook & Instagram Ads)</option>
                        <option value="GOOGLE">6. GOOGLE DATA (Google Ads & GA4)</option>
                        <option value="OTHER">7. OTHER EXPENSES (Offline Marketing)</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                      {item.recordCount.toLocaleString('en-IN')} rows
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">
                      {item.headers.length} headers detected
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setBatchQueue(prev => prev.filter(q => q.id !== item.id))}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {parsedRows.length > 0 && (
        <div className="space-y-6">
          {/* Sheet Selector Bar if Workbook has multiple tabs */}
          {availableSheets.length > 1 && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Sheet Tab:</span>
              <div className="flex flex-wrap gap-2">
                {availableSheets.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSheetChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedSheet === s
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Report Auto-Detection & Data Quality Audit Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">Auto-Detected Classification:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      {detectedReportType.confidence}% Confidence
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-white mt-0.5">{detectedReportType.label}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{detectedReportType.description}</p>
                </div>
              </div>

              <div className="text-right self-end sm:self-auto">
                <div className="text-2xl font-black text-emerald-400">{dataQualityMetrics.qualityScore}%</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Data Quality Score</div>
              </div>
            </div>

            {/* Data Quality Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Records</span>
                <span className="font-bold text-white text-sm">{dataQualityMetrics.totalRecords.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Mapped Fields</span>
                <span className="font-bold text-emerald-400 text-sm">{dataQualityMetrics.mappedRecords} Schema Fields</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Duplicates Detected</span>
                <span className="font-bold text-amber-400 text-sm">{dataQualityMetrics.duplicateRecords} Duplicates</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Missing OPID / Lead ID</span>
                <span className="font-bold text-slate-300 text-sm">{dataQualityMetrics.missingIds} Records</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Missing Dates</span>
                <span className="font-bold text-slate-300 text-sm">{dataQualityMetrics.missingDates} Records</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Cross-File Join Key</span>
                <span className="font-bold text-indigo-300 text-xs truncate block">Opportunity ID / OPID</span>
              </div>
            </div>
          </div>

          {/* Column Mapping Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Semantic Column Header Mapping (Standard CMO Data Model)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Source File: <strong>{datasetName}</strong> ({parsedRows.length} total records)
                </p>
              </div>

              <button
                onClick={() => {
                  setParsedRows([]);
                  setHeaders([]);
                  setWorkbook(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Different File</span>
              </button>
            </div>

            {/* Dynamic File Header Reflection & Schema Mapping Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Detected File Headers ({headers.length} Columns Found in Uploaded Sheet)
                </span>
                <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/50">
                  Auto-Mapped Schema & Custom Attributes
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                {headers.map((h, idx) => {
                  const sampleVal = parsedRows[0]?.[h];
                  const inferredType = inferDataType(sampleVal);
                  const currentMappedVal = fileHeaderMappings[h] || 'custom_field';
                  const isStandardMapped = currentMappedVal !== 'custom_field';

                  return (
                    <div
                      key={h || idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isStandardMapped
                          ? 'bg-slate-50 dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-900/60 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate" title={h}>
                              {h}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.2 rounded-md ${
                              inferredType.includes('Identifier') ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' :
                              inferredType.includes('Date') ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                              inferredType.includes('Currency') ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {inferredType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                            Sample: <span className="font-semibold text-slate-700 dark:text-slate-300">{sampleVal !== undefined && sampleVal !== '' ? String(sampleVal) : '(empty)'}</span>
                          </p>
                        </div>

                        {isStandardMapped ? (
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                            Mapped ✓
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            Custom Attribute
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <select
                          value={currentMappedVal}
                          onChange={e => setFileHeaderMappings({ ...fileHeaderMappings, [h]: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg p-2 outline-none focus:border-indigo-500"
                        >
                          {STANDARD_TARGET_FIELDS.map(f => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Ready to sync with live CMO executive analytics dashboard.
              </span>

              <button
                onClick={handleUploadSubmit}
                disabled={uploading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing & Triggering Analytics...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Import & Sync Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Live Data Table Preview with Dynamic Header Badges */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-500" />
                Live Spreadsheet Preview ({filteredPreviewRows.length} of {parsedRows.length} rows)
              </h4>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter preview data..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-xl pl-8 pr-3 py-1.5 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3 font-bold w-10 text-center">#</th>
                    {(headers as string[]).map((h: string) => {
                      const targetField = fileHeaderMappings[h];
                      return (
                        <th key={h} className="py-2.5 px-3 font-bold whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-white font-black">{h}</span>
                            {targetField && targetField !== 'custom_field' ? (
                              <span className="text-[9px] font-bold text-indigo-500 font-mono">→ {targetField}</span>
                            ) : (
                              <span className="text-[9px] font-normal text-slate-400 font-mono">(raw custom)</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPreviewRows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 text-center font-mono text-[10px]">{idx + 1}</td>
                      {(headers as string[]).map((h: string) => {
                        const cellVal = (row as Record<string, any>)[h];
                        return (
                          <td key={h} className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                            {String(cellVal !== undefined && cellVal !== null ? cellVal : '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPreviewRows.length > 10 && (
              <p className="text-[11px] text-slate-400 text-center italic">
                Showing top 10 rows preview. All {parsedRows.length} rows will be processed upon import.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Data Synopsis Panel */}
      {dataSynopsis && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Active Dataset Data Synopsis & Header Intelligence
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically generated overview of validated fields, OPID counts, entity availability, and stage distributions.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
              {dataSynopsis.datasetType}
            </span>
          </div>

          {/* Key Record Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Uploaded</span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 block">{dataSynopsis.totalRecordsUploaded.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-slate-400">Raw Source Rows</span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Unique OPIDs</span>
              <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 mt-0.5 block">{dataSynopsis.uniqueOPIDs.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-indigo-500/80">Distinct Counting Key</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Duplicate OPIDs</span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5 block">{dataSynopsis.duplicateOPIDs.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-amber-500/80">Deduplicated Rows</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Valid Records</span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{dataSynopsis.validRecords.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-emerald-500/80">Passed Validation</span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Invalid Records</span>
              <span className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5 block">{dataSynopsis.invalidRecords.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-rose-500/80">Malformed Rows</span>
            </div>
          </div>

          {/* Date Range & Entities Available */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Date Range Available
              </span>
              <p className="font-mono text-slate-900 dark:text-slate-100 font-semibold">
                {dataSynopsis.dateRange.minDate} → {dataSynopsis.dateRange.maxDate}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Projects ({dataSynopsis.projectsAvailable.count})
              </span>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {dataSynopsis.projectsAvailable.items.length > 0 ? (
                  dataSynopsis.projectsAvailable.items.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No specific project names found</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> Sales Managers ({dataSynopsis.salesManagersAvailable.count})
              </span>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {dataSynopsis.salesManagersAvailable.items.length > 0 ? (
                  dataSynopsis.salesManagersAvailable.items.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No sales manager assignments found</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" /> Lead Sources ({dataSynopsis.leadSourcesAvailable.count})
              </span>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {dataSynopsis.leadSourcesAvailable.items.length > 0 ? (
                  dataSynopsis.leadSourcesAvailable.items.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No lead sources mapped</span>
                )}
              </div>
            </div>
          </div>

          {/* Revenue & Booking Information */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-sm">
                <Receipt className="w-4 h-4 text-emerald-500" /> Revenue & Booking Financial Summary
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                {dataSynopsis.revenueBookingInfo.hasRevenueData
                  ? `Booking monetary fields detected in dataset.`
                  : `No booking or monetary values were present in uploaded dataset. Financial KPIs remain strictly 0.`}
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total Bookings</span>
                <span className="text-base font-black text-slate-900 dark:text-slate-100">{dataSynopsis.revenueBookingInfo.totalBookings}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total Revenue</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ₹{dataSynopsis.revenueBookingInfo.totalRevenueINR.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Missing Fields Warning Banner */}
          {dataSynopsis.missingImportantFields.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  Important Standard Fields Missing in Uploaded Data:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dataSynopsis.missingImportantFields.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-medium text-[10px]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previously Uploaded Datasets History */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Previously Uploaded & Processed Spreadsheets
        </h3>

        {uploadHistory.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No previous dataset files uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {uploadHistory.map(u => (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{u.fileName}</p>
                    <p className="text-[10px] text-slate-400">
                      Uploaded by {u.uploadedBy} on {new Date(u.uploadedAt).toLocaleDateString()} at {new Date(u.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{u.recordCount} records</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Active Dataset
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteSingleDataset(u.id, u.fileName)}
                    disabled={deletingId === u.id}
                    title="Delete this specific dataset"
                    className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === u.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
