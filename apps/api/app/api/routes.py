from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.supabase import supabase
from app.schemas import (
    HazardReport,
    HazardReportCreate,
    MaintenanceRecord,
    PrecinctMetric,
    PrecinctStats,
    Tree,
)

router = APIRouter(prefix="/api", tags=["TreeLedger Core API"])


@router.get("/trees", response_model=List[Tree])
def list_trees(
    precinct: Optional[str] = Query(default=None, description="Filter by precinct name"),
    status: Optional[str] = Query(
        default=None,
        description="Filter by handover_status (PRE_HANDOVER_PLANTED, DLP_ACTIVE, COMMISSIONED)",
    ),
) -> List[Tree]:
    query = supabase.table("trees").select("*")
    if precinct:
        query = query.eq("precinct", precinct)
    if status:
        query = query.eq("handover_status", status)

    response = query.order("id").execute()
    return [Tree.model_validate(row) for row in (response.data or [])]


@router.get("/trees/{tree_id}", response_model=Tree)
def get_tree(tree_id: str) -> Tree:
    response = supabase.table("trees").select("*").eq("id", tree_id).limit(1).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tree '{tree_id}' not found",
        )
    return Tree.model_validate(rows[0])


@router.get("/hazards", response_model=List[HazardReport])
def list_hazards(
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by hazard report status"
    ),
    tree_id: Optional[str] = Query(default=None, description="Filter by tree ID"),
) -> List[HazardReport]:
    query = supabase.table("hazard_reports").select("*")
    if status_filter:
        query = query.eq("status", status_filter)
    if tree_id:
        query = query.eq("tree_id", tree_id)

    response = query.order("reported_at", desc=True).execute()
    return [HazardReport.model_validate(row) for row in (response.data or [])]


@router.post(
    "/hazards", response_model=HazardReport, status_code=status.HTTP_201_CREATED
)
def create_hazard(payload: HazardReportCreate) -> HazardReport:
    if payload.tree_id:
        tree_check = (
            supabase.table("trees")
            .select("id")
            .eq("id", payload.tree_id)
            .limit(1)
            .execute()
        )
        if not (tree_check.data or []):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Referenced tree '{payload.tree_id}' does not exist",
            )

    insert_data = payload.model_dump(exclude_none=True)
    response = supabase.table("hazard_reports").insert(insert_data).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist hazard report",
        )
    return HazardReport.model_validate(rows[0])


@router.get("/maintenance", response_model=List[MaintenanceRecord])
def list_maintenance(
    tree_id: Optional[str] = Query(default=None, description="Filter by tree ID"),
    contractor_id: Optional[str] = Query(
        default=None, description="Filter by contractor ID"
    ),
) -> List[MaintenanceRecord]:
    query = supabase.table("maintenance_records").select("*")
    if tree_id:
        query = query.eq("tree_id", tree_id)
    if contractor_id:
        query = query.eq("contractor_id", contractor_id)

    response = query.order("completed_at", desc=True).execute()
    return [MaintenanceRecord.model_validate(row) for row in (response.data or [])]


@router.get("/precincts/stats", response_model=PrecinctStats)
def get_precinct_stats() -> PrecinctStats:
    trees_resp = supabase.table("trees").select("*").execute()
    trees_data = trees_resp.data or []

    hazards_resp = (
        supabase.table("hazard_reports")
        .select("id, status")
        .neq("status", "RESOLVED")
        .execute()
    )
    open_hazards_count = len(hazards_resp.data or [])

    total_trees = len(trees_data)
    if total_trees == 0:
        return PrecinctStats(
            total_trees=0,
            average_health_score=0.0,
            total_co2_kg_per_year=0.0,
            status_breakdown={
                "PRE_HANDOVER_PLANTED": 0,
                "DLP_ACTIVE": 0,
                "COMMISSIONED": 0,
            },
            open_hazards=open_hazards_count,
            precincts=[],
        )

    total_health = 0
    total_co2 = 0.0
    status_breakdown: Dict[str, int] = {
        "PRE_HANDOVER_PLANTED": 0,
        "DLP_ACTIVE": 0,
        "COMMISSIONED": 0,
    }

    precinct_groups: Dict[str, List[dict]] = defaultdict(list)

    for row in trees_data:
        h_score = int(row.get("health_score") or 0)
        co2 = float(row.get("co2_kg_per_year") or 0.0)
        h_status = str(row.get("handover_status") or "COMMISSIONED")
        p_name = str(row.get("precinct") or "Unassigned")

        total_health += h_score
        total_co2 += co2
        status_breakdown[h_status] = status_breakdown.get(h_status, 0) + 1
        precinct_groups[p_name].append(row)

    precinct_metrics: List[PrecinctMetric] = []
    for p_name in sorted(precinct_groups.keys()):
        rows = precinct_groups[p_name]
        p_count = len(rows)
        p_health = sum(int(r.get("health_score") or 0) for r in rows) / p_count
        p_co2 = sum(float(r.get("co2_kg_per_year") or 0.0) for r in rows)
        p_statuses: Dict[str, int] = {
            "PRE_HANDOVER_PLANTED": 0,
            "DLP_ACTIVE": 0,
            "COMMISSIONED": 0,
        }
        for r in rows:
            st = str(r.get("handover_status") or "COMMISSIONED")
            p_statuses[st] = p_statuses.get(st, 0) + 1

        precinct_metrics.append(
            PrecinctMetric(
                precinct=p_name,
                total_trees=p_count,
                average_health_score=round(p_health, 2),
                total_co2_kg_per_year=round(p_co2, 2),
                status_counts=p_statuses,
            )
        )

    return PrecinctStats(
        total_trees=total_trees,
        average_health_score=round(total_health / total_trees, 2),
        total_co2_kg_per_year=round(total_co2, 2),
        status_breakdown=status_breakdown,
        open_hazards=open_hazards_count,
        precincts=precinct_metrics,
    )
