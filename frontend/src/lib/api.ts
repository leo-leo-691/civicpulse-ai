/**
 * CivicPulse AI — Centralized Frontend API Service
 * 
 * Provides typed functions to interact with the FastAPI backend (/api/v1).
 * All types strictly reflect the backend Pydantic models in backend/app/schemas/requests.py
 * and route responses in backend/app/api/v1/endpoints.py.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// TypeScript Response & Request Interfaces (Matching Backend Schemas)
// ============================================================================

/**
 * Overview KPIs for the Policymaker Dashboard (GET /api/v1/analytics/overview)
 */
export interface AnalyticsOverview {
  total_requests: number;
  unique_requests: number;
  duplicate_count: number;
  active_hotspots: number;
  critical_priority_projects: number;
  total_population_impacted: number;
  avg_infra_gap_pct: number;
  digital_access_corrections_applied: number;
}

/**
 * Geospatial Hotspot Cluster (GET /api/v1/hotspots)
 */
export interface Hotspot {
  id: number;
  title: string;
  category: string;
  district: string;
  unique_request_count: number;
  total_request_count: number;
  affected_villages: number;
  estimated_population: number;
  priority_score: number;
  digital_access_correction: number;
  is_under_reported: boolean;
  evidence: string[];
  latitude: number;
  longitude: number;
}

/**
 * Policymaker Intervention Recommendation (GET /api/v1/recommendations)
 */
export interface Recommendation {
  id: number;
  cluster_id: number;
  proposed_intervention: string;
  priority_score: number;
  digital_access_correction: number;
  evidence: any;
  status: string;
}

/**
 * Payload for logging a human-in-the-loop decision (POST /api/v1/recommendations/{rec_id}/decision)
 * Reflects backend DecisionCreate schema
 */
export interface DecisionPayload {
  decision: 'Approved' | 'Rejected' | 'Flagged' | 'Needs Analysis' | string;
  decision_reason: string;
  reviewer?: string;
}

/**
 * Response after recording a decision (POST /api/v1/recommendations/{rec_id}/decision)
 */
export interface DecisionResponse {
  status: string;
  decision_id: number;
  updated_status: string;
}

/**
 * Retrospective Pre- vs Post-Project Impact Measurement (GET /api/v1/investments/{proj_id}/impact-history)
 * Reflects backend ImpactHistoryResponse schema
 */
export interface ImpactHistory {
  project_id: number;
  project_title: string;
  sector: string;
  budget_crores: number;
  status: string;
  measured_at: string;
  infra_index_before: number;
  infra_index_after: number;
  complaint_volume_before: number;
  complaint_volume_after: number;
  complaint_reduction_pct: number;
  coverage_before_pct: number;
  coverage_after_pct: number;
}

/**
 * Public Citizen Status Lookup Response (GET /api/v1/requests/{ref_code}/status)
 * Reflects backend CitizenStatusResponse schema
 */
export interface CitizenStatus {
  reference_code: string;
  status: string;
  category: string;
  subcategory: string;
  district: string;
  locality: string;
  cluster_title?: string | null;
  cluster_unique_requests: number;
  cluster_priority_score?: number | null;
  created_at: string;
}

/**
 * Payload for submitting a citizen request (POST /api/v1/requests)
 * Reflects backend RequestCreate schema
 */
export interface CitizenRequestPayload {
  raw_text?: string;
  audio_base64?: string;
  channel?: 'text' | 'voice' | 'whatsapp' | 'sms' | 'telegram' | string;
  language?: string;
  district?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  reporter_contact_hash?: string;
}

/**
 * Response after citizen request ingestion (POST /api/v1/requests)
 */
export interface CitizenRequestResponse {
  status: string;
  reference_code: string;
  is_duplicate: boolean;
  duplicate_of?: string | null;
  category: string;
  subcategory: string;
  severity: string;
  message: string;
}

/**
 * Inbound Messaging Webhook Payload (POST /api/v1/channels/messaging/webhook)
 */
export interface MessagingWebhookPayload {
  Body?: string;
  text?: string;
  From?: string;
  sender?: string;
  [key: string]: any;
}

/**
 * Outbound response from messaging webhook (POST /api/v1/channels/messaging/webhook)
 */
export interface MessagingWebhookResponse {
  status: string;
  reply: string;
}

/**
 * Anonymized Open Data Export Item (GET /api/v1/open-data/export)
 * Reflects backend OpenDataExportItem schema (DPG Indicator #6)
 */
export interface OpenDataExportItem {
  cluster_id: number;
  title: string;
  category: string;
  district: string;
  locality: string;
  unique_request_count: number;
  total_request_count: number;
  priority_score: number;
  digital_access_correction: number;
  is_under_reported: boolean;
  latitude: number;
  longitude: number;
}

// ============================================================================
// Core Fetch Request Helper with Error Handling
// ============================================================================

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) {
        errorDetail = typeof errorJson.detail === 'string' 
          ? errorJson.detail 
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Response was not JSON, fallback to status text
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// Centralized API Functions
// ============================================================================

/**
 * Fetch top-level policymaker KPIs and analytics overview
 * Endpoint: GET /api/v1/analytics/overview
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>('/api/v1/analytics/overview');
}

/**
 * Fetch all geospatial hotspot clusters with priority score breakdowns
 * Endpoint: GET /api/v1/hotspots
 */
export async function getHotspots(): Promise<Hotspot[]> {
  return apiFetch<Hotspot[]>('/api/v1/hotspots');
}

/**
 * Fetch policymaker intervention recommendations
 * Endpoint: GET /api/v1/recommendations
 */
export async function getRecommendations(): Promise<Recommendation[]> {
  return apiFetch<Recommendation[]>('/api/v1/recommendations');
}

/**
 * Record a Human-in-the-Loop decision on a recommendation
 * Endpoint: POST /api/v1/recommendations/{rec_id}/decision
 */
export async function recordRecommendationDecision(
  recId: number,
  payload: DecisionPayload
): Promise<DecisionResponse> {
  return apiFetch<DecisionResponse>(`/api/v1/recommendations/${recId}/decision`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch retrospective investment ROI impact history for a project
 * Endpoint: GET /api/v1/investments/{proj_id}/impact-history
 */
export async function getInvestmentImpactHistory(projId: number = 1): Promise<ImpactHistory[]> {
  return apiFetch<ImpactHistory[]>(`/api/v1/investments/${projId}/impact-history`);
}

/**
 * Public status lookup for a citizen request by reference code
 * Endpoint: GET /api/v1/requests/{ref_code}/status
 */
export async function getCitizenRequestStatus(refCode: string): Promise<CitizenStatus> {
  return apiFetch<CitizenStatus>(`/api/v1/requests/${encodeURIComponent(refCode)}/status`);
}

/**
 * Ingest a new citizen request (voice/text/app)
 * Endpoint: POST /api/v1/requests
 */
export async function submitCitizenRequest(
  payload: CitizenRequestPayload
): Promise<CitizenRequestResponse> {
  return apiFetch<CitizenRequestResponse>('/api/v1/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Send an inbound messaging webhook payload (WhatsApp / SMS / Telegram simulation)
 * Endpoint: POST /api/v1/channels/messaging/webhook
 */
export async function sendMessagingWebhook(
  payload: MessagingWebhookPayload
): Promise<MessagingWebhookResponse> {
  return apiFetch<MessagingWebhookResponse>('/api/v1/channels/messaging/webhook', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Download or fetch the anonymized open data export (DPG Indicator #6)
 * Endpoint: GET /api/v1/open-data/export
 */
export async function getOpenDataExport(): Promise<OpenDataExportItem[]> {
  return apiFetch<OpenDataExportItem[]>('/api/v1/open-data/export');
}
