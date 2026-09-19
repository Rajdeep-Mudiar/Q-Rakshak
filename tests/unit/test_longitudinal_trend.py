import datetime
import pytest
from backend.app.db.repository import DatabaseRepository
from backend.app.db.database import get_db_connection


@pytest.fixture
def clean_test_patient():
    patient_id = f"TEST-PT-LONGITUDINAL-{datetime.datetime.now().strftime('%H%M%S%f')}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM diagnostic_records WHERE patient_id = ?", (patient_id,))
    conn.commit()
    conn.close()
    yield patient_id
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM diagnostic_records WHERE patient_id = ?", (patient_id,))
    conn.commit()
    conn.close()


def test_zero_history_strict_no_dummy_data(clean_test_patient):
    """Verify that when a patient has zero records, no synthetic/dummy history points are returned."""
    timeline = DatabaseRepository.get_patient_timeline(clean_test_patient)

    assert timeline["has_history"] is False
    assert timeline["total_records"] == 0
    assert timeline["history"] == []
    assert timeline["daily_aggregates"] == []
    assert timeline["trend"]["status"] == "NO_HISTORY"
    assert timeline["trend"]["slope"] is None
    assert "No previous prediction analyses" in timeline["insight_narrative"]
    assert "No previous prediction analyses" in timeline["trend"]["message"]
    assert timeline["early_warning"]["status"] == "INSUFFICIENT_DATA"


def test_same_day_multiple_analyses_averaging(clean_test_patient):
    """Verify that multiple analyses performed on the same calendar day are correctly aggregated."""
    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    now_ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

    # Run 1: 30% risk
    rec1 = {
        "id": f"{clean_test_patient}-R1",
        "patient_id": clean_test_patient,
        "disease": "Breast Oncology (WDBC)",
        "prediction": {"class": "Benign (Non-malignant)", "confidence": 0.70},
        "probabilities": {"Benign": 0.70, "Malignant": 0.30},
        "model_architecture": "OncoPulse-VQC",
        "created_at": f"{today}T09:00:00",
    }
    # Run 2: 50% risk
    rec2 = {
        "id": f"{clean_test_patient}-R2",
        "patient_id": clean_test_patient,
        "disease": "Breast Oncology (WDBC)",
        "prediction": {"class": "Benign (Non-malignant)", "confidence": 0.50},
        "probabilities": {"Benign": 0.50, "Malignant": 0.50},
        "model_architecture": "OncoPulse-VQC",
        "created_at": f"{today}T12:00:00",
    }
    # Run 3: 70% risk
    rec3 = {
        "id": f"{clean_test_patient}-R3",
        "patient_id": clean_test_patient,
        "disease": "Breast Oncology (WDBC)",
        "prediction": {"class": "Malignant (High Risk)", "confidence": 0.70},
        "probabilities": {"Benign": 0.30, "Malignant": 0.70},
        "model_architecture": "OncoPulse-VQC",
        "created_at": f"{today}T15:00:00",
    }

    DatabaseRepository.save_diagnostic_record(rec1)
    DatabaseRepository.save_diagnostic_record(rec2)
    DatabaseRepository.save_diagnostic_record(rec3)

    timeline = DatabaseRepository.get_patient_timeline(clean_test_patient)

    assert timeline["has_history"] is True
    assert timeline["total_records"] == 3
    # Exactly 1 daily aggregate because all 3 were today
    assert len(timeline["daily_aggregates"]) == 1

    da = timeline["daily_aggregates"][0]
    assert da["date"] == today
    assert da["count"] == 3
    # Average of (30 + 50 + 70) / 3 = 50.0%
    assert abs(da["risk_score"] - 50.0) < 0.1
    # Check underlying raw runs preserved
    assert len(da["raw_analyses"]) == 3
    assert da["raw_analyses"][0]["id"] == f"{clean_test_patient}-R1"
    assert da["raw_analyses"][1]["id"] == f"{clean_test_patient}-R2"
    assert da["raw_analyses"][2]["id"] == f"{clean_test_patient}-R3"

    # With only 1 day of data, trend should report insufficient data for linear slope
    assert timeline["trend"]["status"] == "INSUFFICIENT_DATA"
    assert timeline["trend"]["slope"] is None


def test_ols_linear_trend_multi_day(clean_test_patient):
    """Verify OLS linear regression slope, R2, and direction across multiple distinct calendar days."""
    base_date = datetime.date(2026, 9, 1)

    # Day 1: 20% risk
    DatabaseRepository.save_diagnostic_record({
        "id": f"{clean_test_patient}-D1",
        "patient_id": clean_test_patient,
        "disease": "Cardiology (Cleveland)",
        "prediction": {"class": "No Coronary Disease", "confidence": 0.80},
        "probabilities": {"No Coronary Disease": 0.80, "Cardiovascular Disease Present": 0.20},
        "risk_score": 20.0,
        "created_at": f"{(base_date).isoformat()}T10:00:00",
    })

    # Day 2: 30% risk (+10 days)
    DatabaseRepository.save_diagnostic_record({
        "id": f"{clean_test_patient}-D2",
        "patient_id": clean_test_patient,
        "disease": "Cardiology (Cleveland)",
        "prediction": {"class": "No Coronary Disease", "confidence": 0.70},
        "probabilities": {"No Coronary Disease": 0.70, "Cardiovascular Disease Present": 0.30},
        "risk_score": 30.0,
        "created_at": f"{(base_date + datetime.timedelta(days=10)).isoformat()}T10:00:00",
    })

    # Day 3: 40% risk (+20 days)
    DatabaseRepository.save_diagnostic_record({
        "id": f"{clean_test_patient}-D3",
        "patient_id": clean_test_patient,
        "disease": "Cardiology (Cleveland)",
        "prediction": {"class": "Cardiovascular Disease Present", "confidence": 0.60},
        "probabilities": {"No Coronary Disease": 0.60, "Cardiovascular Disease Present": 0.40},
        "risk_score": 40.0,
        "created_at": f"{(base_date + datetime.timedelta(days=20)).isoformat()}T10:00:00",
    })

    timeline = DatabaseRepository.get_patient_timeline(clean_test_patient, time_filter="1 Year")

    assert timeline["has_history"] is True
    assert len(timeline["daily_aggregates"]) == 3
    assert timeline["trend"]["status"] == "VALID_TREND"
    assert timeline["trend"]["trend_direction"] == "Increasing"
    # Slope is (40 - 20) / 20 days = 1.0% per day
    assert abs(timeline["trend"]["slope"] - 1.0) < 0.05
    # Perfect linear line -> R^2 should be ~1.0
    assert timeline["trend"]["r_squared"] >= 0.99
    assert timeline["trend"]["absolute_change"] == 20.0
    assert timeline["trend"]["percentage_change"] == 100.0


def test_failed_analysis_exclusion(clean_test_patient):
    """Verify that failed analyses are excluded from the longitudinal trend line."""
    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    # Valid run
    DatabaseRepository.save_diagnostic_record({
        "id": f"{clean_test_patient}-VALID",
        "patient_id": clean_test_patient,
        "disease": "Breast Oncology",
        "prediction": {"class": "Benign", "confidence": 0.90},
        "analysis_status": "completed",
        "created_at": f"{today}T10:00:00",
    })

    # Failed run (e.g. quantum circuit timeout or corrupt image)
    DatabaseRepository.save_diagnostic_record({
        "id": f"{clean_test_patient}-FAILED",
        "patient_id": clean_test_patient,
        "disease": "Breast Oncology",
        "prediction": {"class": "Error", "confidence": 0.0},
        "analysis_status": "failed",
        "created_at": f"{today}T11:00:00",
    })

    timeline = DatabaseRepository.get_patient_timeline(clean_test_patient)

    assert timeline["has_history"] is True
    assert len(timeline["history"]) == 1
    assert timeline["history"][0]["id"] == f"{clean_test_patient}-VALID"
    assert timeline["daily_aggregates"][0]["count"] == 1


def test_disease_specific_timeline_filtering(clean_test_patient):
    """Verify that filtering by a specific disease protocol returns only that disease's longitudinal data."""
    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    # Save Breast Cancer record
    DatabaseRepository.save_diagnostic_record({
        "id": f"{clean_test_patient}-BREAST-1",
        "patient_id": clean_test_patient,
        "disease": "Breast Oncology (WDBC)",
        "prediction": {"class": "Benign", "confidence": 0.85},
        "risk_score": 15.0,
        "created_at": f"{today}T09:00:00",
    })

    # Save Heart Cardiology record
    DatabaseRepository.save_diagnostic_record({
        "id": f"{clean_test_patient}-HEART-1",
        "patient_id": clean_test_patient,
        "disease": "Cardiology (Cleveland)",
        "prediction": {"class": "Cardiovascular Disease Present", "confidence": 0.80},
        "risk_score": 80.0,
        "created_at": f"{today}T11:00:00",
    })

    # 1. Filter specifically for Breast Oncology
    breast_timeline = DatabaseRepository.get_patient_timeline(clean_test_patient, disease="Breast Oncology (WDBC)")
    assert breast_timeline["has_history"] is True
    assert breast_timeline["disease_filter_applied"] == "Breast Oncology (WDBC)"
    assert len(breast_timeline["history"]) == 1
    assert breast_timeline["history"][0]["disease"] == "Breast Oncology (WDBC)"
    assert breast_timeline["daily_aggregates"][0]["risk_score"] == 15.0

    # 2. Filter specifically for Cardiology
    heart_timeline = DatabaseRepository.get_patient_timeline(clean_test_patient, disease="heart")
    assert heart_timeline["has_history"] is True
    assert len(heart_timeline["history"]) == 1
    assert "Cardiology" in heart_timeline["history"][0]["disease"]
    assert heart_timeline["daily_aggregates"][0]["risk_score"] == 80.0

    # 3. Query with "all" returns both
    all_timeline = DatabaseRepository.get_patient_timeline(clean_test_patient, disease="all")
    assert all_timeline["has_history"] is True
    assert len(all_timeline["history"]) == 2
    assert len(all_timeline["available_diseases"]) >= 2
    assert "Breast Oncology (WDBC)" in all_timeline["available_diseases"]
    assert "Cardiology (Cleveland)" in all_timeline["available_diseases"]


def test_disease_filter_empty_state(clean_test_patient):
    """Verify that filtering by a disease with zero records returns clean empty state without dummy data."""
    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    # Only Cardiology exists
    DatabaseRepository.save_diagnostic_record({
        "id": f"{clean_test_patient}-HEART-ONLY",
        "patient_id": clean_test_patient,
        "disease": "Cardiology (Cleveland)",
        "prediction": {"class": "No Coronary Disease", "confidence": 0.90},
        "risk_score": 10.0,
        "created_at": f"{today}T10:00:00",
    })

    # Filter for Diabetes (which has 0 records)
    diabetes_timeline = DatabaseRepository.get_patient_timeline(clean_test_patient, disease="Diabetes")
    assert diabetes_timeline["has_history"] is False
    assert diabetes_timeline["total_records"] == 0
    assert diabetes_timeline["history"] == []
    assert diabetes_timeline["daily_aggregates"] == []
    assert "Diabetes" in diabetes_timeline["insight_narrative"]
    assert "Cardiology (Cleveland)" in diabetes_timeline["available_diseases"]

