import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.vision_service import TriageResponse, vision_service
from app.services.web3_service import web3_audit_service


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    """Verify health check returns correct service name and status."""
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["service"] == "TreeLedger Backend"


def test_openapi_schema(client):
    """Verify OpenAPI spec has TreeLedger title and registered routes."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    spec = response.json()
    assert spec["info"]["title"] == "TreeLedger API"
    paths = spec["paths"]
    assert "/health" in paths
    assert "/api/trees" in paths
    assert "/api/hazards" in paths
    assert "/api/maintenance" in paths
    assert "/api/triage" in paths
    assert "/api/verify-maintenance" in paths


def test_triage_fallback_deterministic():
    """Verify vision triage returns strict validated Pydantic schema on fallback."""
    result = vision_service._fallback_triage(
        description="Dry yellowing foliage and branch snapped by heavy thunderstorm",
        tree_id="ELM-042",
    )
    assert isinstance(result, TriageResponse)
    assert 0 <= result.health_score <= 100
    assert result.severity_grade in ["LOW", "MEDIUM", "CRITICAL_24H"]
    assert 0.0 <= result.confidence <= 1.0
    assert result.recommended_sla_action is not None


def test_web3_audit_hash_fallback():
    """Verify Arbitrum web3 audit hash generator produces valid 66-char 0x keccak256 hash."""
    receipt = web3_audit_service.log_maintenance_on_chain(
        tree_id="ELM-042",
        action_type="CANOPY_PRUNING",
        before_photo_url="https://images.unsplash.com/before.jpg",
        after_photo_url="https://images.unsplash.com/after.jpg",
        contractor_id="CON-901",
    )
    assert isinstance(receipt.simulated, bool)
    tx_hash = receipt.arbitrum_tx_hash
    assert tx_hash.startswith("0x")
    assert len(tx_hash) == 66
    assert receipt.record_hash.startswith("0x")
    assert len(receipt.record_hash) == 66
