/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VendorStatus = 
  | 'Received' 
  | 'Analyzing' 
  | 'Verified' 
  | 'Contacted' 
  | 'Onboarded' 
  | 'Rejected';

export interface StatusMilestone {
  status: VendorStatus;
  label: string;
  message: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // e.g., 'pdf', 'docx', 'png', 'txt'
  size: string;
  url?: string;
  contentSummary?: string;
}

export interface Vendor {
  id: string;
  companyName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: 'WhatsApp' | 'Email' | 'Manual';
  description: string;
  status: VendorStatus;
  statusHistory: StatusMilestone[];
  attachments: Attachment[];
  createdAt: string;
  website?: string;
  address?: string;
  products?: string[];
  rawBrochureText?: string;
  syncTimestamp?: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  channel: 'WhatsApp' | 'Email';
  sender: string;
  subject?: string;
  rawPayload: string;
  status: 'success' | 'failed';
  extractedVendorId?: string;
  error?: string;
}

export interface DashboardMetrics {
  totalVendors: number;
  syncedWhatsApp: number;
  syncedEmail: number;
  addedManual: number;
  onboardedCount: number;
  pendingReviewCount: number;
  industryBreakdown: Record<string, number>;
}
