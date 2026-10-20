export type HandoverStatus = 'PRE_HANDOVER_PLANTED' | 'DLP_ACTIVE' | 'COMMISSIONED';

export type StewardshipMode = 'PRE_HANDOVER_AUDIT' | 'LIVING_STEWARDSHIP';

export type HazardType = 'STORM_DAMAGE' | 'ROOT_HEAVE' | 'DRY_FOLIAGE' | 'PEST';

export type HazardStatus = 'REPORTED' | 'TRIAGED' | 'DISPATCHED' | 'RESOLVED';

export type SeverityGrade = 'LOW' | 'MEDIUM' | 'CRITICAL_24H';

export type MaintenanceActionType =
  | 'CANOPY_PRUNING'
  | 'DEEP_ROOT_WATERING'
  | 'REPLACED_SAPLING';

export interface Tree {
  id: string;
  precinct: string;
  species: string;
  common_name: string;
  handover_status: HandoverStatus;
  planted_at: string;
  co2_kg_per_year: number;
  health_score: number;
  latitude: number;
  longitude: number;
  qr_code_hash: string;
  created_at: string;
}

export interface HazardReport {
  id: number;
  tree_id: string;
  reporter_id: string;
  hazard_type: HazardType;
  description: string;
  evidence_photo_url: string;
  status: HazardStatus;
  ai_severity_grade: SeverityGrade;
  ai_confidence: number;
  detected_issues?: string[];
  recommended_sla_action?: string;
  latitude: number;
  longitude: number;
  reported_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: number;
  hazard_id: number | null;
  tree_id: string;
  contractor_id: string;
  action_type: MaintenanceActionType;
  before_photo_url: string;
  after_photo_url: string;
  notes: string;
  ai_verification_passed: boolean;
  arbitrum_tx_hash: string;
  completed_at: string;
}

export interface TriageResponse {
  health_score: number;
  hazard_type: HazardType;
  severity_grade: SeverityGrade;
  detected_issues: string[];
  recommended_sla_action: string;
  confidence: number;
}

export interface CreateHazardPayload {
  tree_id: string;
  reporter_id: string;
  hazard_type: HazardType;
  description: string;
  evidence_photo_url: string;
  latitude: number;
  longitude: number;
}

export interface ResolveTaskPayload {
  hazard_id: number;
  tree_id: string;
  contractor_id: string;
  action_type: MaintenanceActionType;
  before_photo_url: string;
  after_photo_url: string;
  notes: string;
}
