import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from app.core.supabase import supabase
from app.schemas import TreeCreate

SPECIES_CATALOG: List[Dict[str, Any]] = [
    {
        "species": "Hopea odorata",
        "common_name": "Merawan Siput Jantan",
        "base_co2_kg": 28.40,
    },
    {
        "species": "Tembusu",
        "common_name": "Fagraea fragrans (Tembusu Padang)",
        "base_co2_kg": 24.75,
    },
    {
        "species": "Yellow Flame",
        "common_name": "Peltophorum pterocarpum (Batai Laut)",
        "base_co2_kg": 31.20,
    },
]

PRECINCTS: List[str] = [
    "Sector 4A - Ilham Residence",
    "Elmina Central Park - Lakeshore",
    "Elmina Green - Phase 3 Boulevard",
    "Elmina Valley - Riparian Corridor",
]

HANDOVER_STATUSES: List[str] = [
    "PRE_HANDOVER_PLANTED",
    "DLP_ACTIVE",
    "COMMISSIONED",
]

HEALTH_SCORES: List[int] = [
    98, 94, 91, 88, 76, 95, 84, 62, 99, 90,
    87, 73, 96, 92, 58, 89, 93, 81, 97, 86,
    91, 69, 95, 88, 94, 79, 54, 92, 96, 85,
    90, 83, 97, 71, 93, 89, 95, 64, 91, 98,
]


def build_40_elmina_trees() -> List[Dict[str, Any]]:
    """
    Generates 40 deterministic, realistic Malaysian urban forestry records
    distributed across Elmina Central Park ([3.192, 101.512] to [3.199, 101.518]).
    Uses an 8x5 spatial grid with slight deterministic offsets to stay strictly
    within the bounding box.
    """
    lat_min, lat_max = 3.192000, 3.199000
    lon_min, lon_max = 101.512000, 101.518000

    rows_count = 8
    cols_count = 5
    now_utc = datetime.now(timezone.utc)

    records: List[Dict[str, Any]] = []

    for idx in range(40):
        tree_num = idx + 1
        tree_id = f"ELM-{tree_num:03d}"

        r = idx // cols_count
        c = idx % cols_count

        # Interpolate strictly within [3.192, 3.199] and [101.512, 101.518]
        lat_step = (lat_max - lat_min) / (rows_count - 1)
        lon_step = (lon_max - lon_min) / (cols_count - 1)

        jitter_lat = ((idx % 3) - 1) * 0.00012
        jitter_lon = (((idx * 2) % 3) - 1) * 0.00012

        raw_lat = lat_min + (r * lat_step) + jitter_lat
        raw_lon = lon_min + (c * lon_step) + jitter_lon

        latitude = round(min(max(raw_lat, lat_min), lat_max), 6)
        longitude = round(min(max(raw_lon, lon_min), lon_max), 6)

        spec_info = SPECIES_CATALOG[idx % len(SPECIES_CATALOG)]
        precinct = PRECINCTS[idx % len(PRECINCTS)]
        handover_status = HANDOVER_STATUSES[idx % len(HANDOVER_STATUSES)]
        health_score = HEALTH_SCORES[idx]

        # Vary planting age according to lifecycle phase
        if handover_status == "PRE_HANDOVER_PLANTED":
            days_ago = 45 + (idx * 3)
            co2_multiplier = 0.85
        elif handover_status == "DLP_ACTIVE":
            days_ago = 240 + (idx * 5)
            co2_multiplier = 1.00
        else:
            days_ago = 620 + (idx * 9)
            co2_multiplier = 1.15

        planted_at = (now_utc - timedelta(days=days_ago)).isoformat()
        co2_kg_per_year = round(spec_info["base_co2_kg"] * co2_multiplier, 2)
        qr_code_hash = hashlib.sha256(
            f"TREELEDGER:{tree_id}:{precinct}".encode("utf-8")
        ).hexdigest()

        validated = TreeCreate(
            id=tree_id,
            precinct=precinct,
            species=spec_info["species"],
            common_name=spec_info["common_name"],
            handover_status=handover_status,
            planted_at=planted_at,
            co2_kg_per_year=co2_kg_per_year,
            health_score=health_score,
            latitude=latitude,
            longitude=longitude,
            qr_code_hash=qr_code_hash,
        )

        payload = validated.model_dump(mode="json")
        records.append(payload)

    return records


def seed_database() -> None:
    trees = build_40_elmina_trees()
    print(f"Upserting {len(trees)} Malaysian urban trees into Supabase 'trees' table...")
    response = supabase.table("trees").upsert(trees, on_conflict="id").execute()
    inserted_count = len(response.data or [])
    print(
        f"Successfully seeded {inserted_count} trees around Elmina Central Park "
        f"([3.192, 101.512] to [3.199, 101.518])."
    )


if __name__ == "__main__":
    seed_database()
