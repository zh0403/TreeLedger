from typing import Optional

from fastapi import APIRouter, HTTPException, Request, UploadFile, status

from app.services.vision_service import (
    TriageRequest,
    TriageResponse,
    VerifyMaintenanceRequest,
    VerifyMaintenanceResponse,
    vision_service,
)
from app.services.web3_service import web3_audit_service

router = APIRouter(prefix="/api", tags=["AI Vision & Arbitrum Verification"])


@router.post(
    "/triage",
    response_model=TriageResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Vision Tree Hazard Triage",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": TriageRequest.model_json_schema(),
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "file": {"type": "string", "format": "binary"},
                            "tree_id": {"type": "string"},
                            "description": {"type": "string"},
                            "image_url": {"type": "string"},
                        },
                    }
                },
            }
        }
    },
)
async def triage_tree_hazard(request: Request) -> TriageResponse:
    """Evaluates uploaded tree hazard imagery or URLs via gemini-3.8-flash and returns structured triage telemetry."""
    content_type = request.headers.get("content-type", "").lower()

    image_bytes: Optional[bytes] = None
    mime_type: str = "image/jpeg"
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    description: Optional[str] = None
    tree_id: Optional[str] = None

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        upload = form.get("file") or form.get("image")
        if isinstance(upload, UploadFile):
            image_bytes = await upload.read()
            mime_type = upload.content_type or "image/jpeg"
        image_url_val = form.get("image_url") or form.get("evidence_photo_url")
        if isinstance(image_url_val, str) and image_url_val.strip():
            image_url = image_url_val.strip()
        desc_val = form.get("description")
        if isinstance(desc_val, str) and desc_val.strip():
            description = desc_val.strip()
        tree_id_val = form.get("tree_id")
        if isinstance(tree_id_val, str) and tree_id_val.strip():
            tree_id = tree_id_val.strip()
    else:
        try:
            body_bytes = await request.body()
            payload = TriageRequest.model_validate_json(body_bytes) if body_bytes else TriageRequest()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid triage request payload: {exc}",
            ) from exc

        image_url = payload.image_url or payload.evidence_photo_url
        image_base64 = payload.image_base64
        mime_type = payload.mime_type
        description = payload.description
        tree_id = payload.tree_id

    return vision_service.analyze_triage(
        image_bytes=image_bytes,
        mime_type=mime_type,
        image_url=image_url,
        image_base64=image_base64,
        description=description,
        tree_id=tree_id,
    )


@router.post(
    "/verify-maintenance",
    response_model=VerifyMaintenanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify Contractor Maintenance & Log Arbitrum Proof-of-Work",
)
async def verify_maintenance_work(payload: VerifyMaintenanceRequest) -> VerifyMaintenanceResponse:
    """Compares before/after maintenance photos via gemini-3.8-flash and logs proof-of-work to Arbitrum Sepolia."""
    verification = vision_service.verify_maintenance(
        before_photo_url=payload.before_photo_url,
        after_photo_url=payload.after_photo_url,
        action_type=payload.action_type,
        tree_id=payload.tree_id,
        notes=payload.notes,
    )

    if verification.ai_verification_passed:
        audit_receipt = web3_audit_service.log_maintenance_on_chain(
            tree_id=payload.tree_id,
            action_type=payload.action_type,
            before_photo_url=payload.before_photo_url,
            after_photo_url=payload.after_photo_url,
            contractor_id=payload.contractor_id,
        )
        proof_hash = audit_receipt.proof_hash
        arbitrum_tx_hash = audit_receipt.arbitrum_tx_hash
        simulated = audit_receipt.simulated
    else:
        proof_hash = web3_audit_service.compute_photo_proof_hash(
            before_photo_url=payload.before_photo_url,
            after_photo_url=payload.after_photo_url,
            contractor_id=payload.contractor_id,
        )
        arbitrum_tx_hash = ""
        simulated = True

    return VerifyMaintenanceResponse(
        tree_id=payload.tree_id,
        action_type=payload.action_type,
        ai_verification_passed=verification.ai_verification_passed,
        confidence=verification.confidence,
        health_score_delta=verification.health_score_delta,
        observed_changes=verification.observed_changes,
        verification_summary=verification.verification_summary,
        proof_hash=proof_hash,
        arbitrum_tx_hash=arbitrum_tx_hash,
        on_chain_simulated=simulated,
    )
