from datetime import datetime
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

HandoverStatus = Literal["PRE_HANDOVER_PLANTED", "DLP_ACTIVE", "COMMISSIONED"]
HazardType = Literal["STORM_DAMAGE", "ROOT_HEAVE", "DRY_FOLIAGE", "PEST"]
HazardStatus = Literal["REPORTED", "TRIAGED", "DISPATCHED", "RESOLVED"]
SeverityGrade = Literal["LOW", "MEDIUM", "CRITICAL_24H"]
MaintenanceActionType = Literal[
    "CANOPY_PRUNING", "DEEP_ROOT_WATERING", "REPLACED_SAPLING"
]


class TreeBase(BaseModel):
    precinct: str = Field(..., max_length=100)
    species: str = Field(..., max_length=100)
    common_name: Optional[str] = Field(default=None, max_length=100)
    handover_status: HandoverStatus
    planted_at: datetime
    co2_kg_per_year: float = Field(..., ge=0)
    health_score: int = Field(default=100, ge=0, le=100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    qr_code_hash: Optional[str] = Field(default=None, max_length=64)


class TreeCreate(TreeBase):
    id: str = Field(..., max_length=50)


class Tree(TreeBase):
    id: str = Field(..., max_length=50)
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class HazardReportBase(BaseModel):
    tree_id: Optional[str] = Field(default=None, max_length=50)
    reporter_id: str = Field(..., max_length=100)
    hazard_type: HazardType
    description: Optional[str] = None
    evidence_photo_url: str
    status: HazardStatus = "REPORTED"
    ai_severity_grade: Optional[SeverityGrade] = None
    ai_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class HazardReportCreate(HazardReportBase):
    pass


class HazardReport(HazardReportBase):
    id: int
    reported_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MaintenanceRecordBase(BaseModel):
    hazard_id: Optional[int] = None
    tree_id: Optional[str] = Field(default=None, max_length=50)
    contractor_id: str = Field(..., max_length=50)
    action_type: MaintenanceActionType
    before_photo_url: str
    after_photo_url: str
    notes: Optional[str] = None
    ai_verification_passed: bool = True
    arbitrum_tx_hash: Optional[str] = Field(default=None, max_length=66)


class MaintenanceRecordCreate(MaintenanceRecordBase):
    pass


class MaintenanceRecord(MaintenanceRecordBase):
    id: int
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PrecinctMetric(BaseModel):
    precinct: str
    total_trees: int
    average_health_score: float
    total_co2_kg_per_year: float
    status_counts: Dict[str, int]


class PrecinctStats(BaseModel):
    total_trees: int
    average_health_score: float
    total_co2_kg_per_year: float
    status_breakdown: Dict[str, int]
    open_hazards: int
    precincts: List[PrecinctMetric]
