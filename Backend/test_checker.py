import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import database
import models
import schemas
from main import app

# Setup an isolated in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[database.get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Recreates database tables before every test run."""
    models.Base.metadata.create_all(bind=engine)
    yield
    models.Base.metadata.drop_all(bind=engine)


# ==============================================================================
# PHASE 1 & 3: SCHEMA & STRUCTURAL INTEGRITY CHECKS
# ==============================================================================


def test_check_schema_fields():
    """Verifies schemas contain required fields for frontend and updates."""
    item_fields = schemas.DisbursementItemResponse.model_fields
    summary_fields = schemas.ProjectSummaryResponse.model_fields

    # Check that 'id' is exposed in item response
    assert "id" in item_fields, "FAIL: 'id' is missing from DisbursementItemResponse"

    # Check that 'project_title' is in summary response
    assert (
        "project_title" in summary_fields
    ), "FAIL: 'project_title' missing from ProjectSummaryResponse"

    # Check that DisbursementUpdate schema exists
    assert hasattr(
        schemas, "DisbursementUpdate"
    ), "FAIL: 'DisbursementUpdate' schema is not defined in schemas.py"


# ==============================================================================
# PHASE 1 & 2: CREATION, CASE-INSENSITIVITY & SUMMARY CONTRACT CHECKS
# ==============================================================================


def test_create_disbursement_and_flat_summary():
    """Tests creating a disbursement, checking case-insensitive lookups, and flat response contract."""
    payload = {
        "project_title": "  Calamba Factory  ",
        "cv_no": "CV-1001",
        "payee": "Hardware Supply Co",
        "date": "2026-10-06",
        "amount": 1500.50,
        "encoder_name": "John Encoder",
    }

    # 1. Test POST creation
    res_create = client.post("/disbursements/", json=payload)
    assert res_create.status_code == 201, f"Create failed: {res_create.text}"
    created_data = res_create.json()

    assert "id" in created_data, "FAIL: Created response missing 'id'"
    disbursement_id = created_data["id"]

    # 2. Test GET summary with different casing and leading spaces
    res_summary = client.get("/projects/calamba factory/summary")
    assert res_summary.status_code == 200, "FAIL: Case-insensitive lookup failed (404)"

    summary_data = res_summary.json()

    # Verify flat structure
    assert "project_title" in summary_data, "FAIL: Response is not flat (missing 'project_title')"
    assert summary_data["project_title"] == "Calamba Factory"
    assert summary_data["total_amount"] == 1500.50
    assert len(summary_data["entries"]) == 1

    # Verify timestamp serialization contains full calendar date (ISO-8601)
    created_at_str = summary_data["entries"][0]["created_at"]
    assert "-" in created_at_str and "T" in created_at_str or " " in created_at_str, (
        f"FAIL: 'created_at' timestamp '{created_at_str}' appears truncated. "
        "Must contain full date (YYYY-MM-DD)."
    )


# ==============================================================================
# PHASE 3: UPDATE DISBURSEMENT CHECKS
# ==============================================================================


def test_update_disbursement_partial():
    """Tests updating a disbursement record (PATCH) without corrupting audit trail."""
    # Create initial record
    create_payload = {
        "project_title": "Project Beta",
        "cv_no": "CV-2002",
        "payee": "Initial Payee",
        "date": "2026-10-06",
        "amount": 500.00,
        "encoder_name": "Original Encoder",
    }
    create_res = client.post("/disbursements/", json=create_payload)
    disbursement_id = create_res.json()["id"]

    # Partial update payload
    update_payload = {
        "amount": 750.00,
        "editor_name": "Jane Editor",
    }

    # Try PATCH to update endpoint (Checks both common route paths)
    patch_res = client.patch(f"/disbursements/{disbursement_id}", json=update_payload)
    if patch_res.status_code == 405 or patch_res.status_code == 404:
        # Fallback check for nested route format
        patch_res = client.patch(
            f"/projects/Project Beta/disbursements/{disbursement_id}",
            json=update_payload,
        )

    assert patch_res.status_code == 200, (
        f"FAIL: PATCH update endpoint returned status {patch_res.status_code}. "
        f"Details: {patch_res.text}"
    )

    updated_data = patch_res.json()

    # Verify partial updates
    assert updated_data["amount"] == 750.00, "FAIL: Amount was not updated"
    assert updated_data["payee"] == "Initial Payee", "FAIL: Unsent field 'payee' was overwritten"
    assert updated_data["created_by"] == "Original Encoder", "FAIL: 'created_by' was corrupted"
    assert updated_data["updated_by"] == "Jane Editor", "FAIL: 'updated_by' was not updated"