from __future__ import annotations

import json
import logging
import os
import sqlite3
from pathlib import Path
from typing import Any, Optional

from backend.app.core.config import settings
from backend.app.core.security import hash_password

logger = logging.getLogger("backend.database")
DB_PATH = settings.DB_PATH


_PG_POOL: Optional[Any] = None


def _get_pg_pool() -> Optional[Any]:
    global _PG_POOL
    if _PG_POOL is not None and not getattr(_PG_POOL, "closed", False):
        return _PG_POOL
    if settings.DB_MODE == "production" and settings.DATABASE_URL:
        pg_url = settings.DATABASE_URL
        if pg_url.startswith("postgres://") or pg_url.startswith("postgresql://"):
            try:
                import psycopg2.pool
                if pg_url.startswith("postgres://"):
                    pg_url = pg_url.replace("postgres://", "postgresql://", 1)
                _PG_POOL = psycopg2.pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=15,
                    dsn=pg_url,
                    connect_timeout=6,
                )
                logger.info("Initialized PostgreSQL ThreadedConnectionPool (max 15 connections)")
                return _PG_POOL
            except Exception as exc:
                logger.warning(f"PostgreSQL connection pool init failed ({exc}). Falling back to local SQLite at {settings.DB_PATH}")
                _PG_POOL = None
    return None


class PostgresCursorWrapper:
    """Wraps a psycopg2 RealDictCursor with SQLite-compatible query execution."""

    def __init__(self, raw_cursor: Any):
        self.raw_cursor = raw_cursor

    def execute(self, query: str, params: tuple | list | None = None) -> PostgresCursorWrapper:
        # Convert ? placeholders to %s
        pg_query = query.replace("?", "%s")
        # Handle SQLite specific INSERT OR IGNORE
        if "INSERT OR IGNORE INTO" in pg_query:
            pg_query = pg_query.replace("INSERT OR IGNORE INTO", "INSERT INTO")
            if "ON CONFLICT" not in pg_query:
                pg_query = pg_query.rstrip(";\n ") + " ON CONFLICT DO NOTHING;"

        if params is not None:
            self.raw_cursor.execute(pg_query, params)
        else:
            self.raw_cursor.execute(pg_query)
        return self

    def fetchone(self) -> Optional[dict[str, Any]]:
        row = self.raw_cursor.fetchone()
        return dict(row) if row is not None else None

    def fetchall(self) -> list[dict[str, Any]]:
        rows = self.raw_cursor.fetchall()
        return [dict(r) for r in rows]

    def __iter__(self):
        for r in self.raw_cursor:
            yield dict(r)


class PostgresConnectionWrapper:
    """Wraps a psycopg2 connection from the pool to mimic sqlite3.Connection interface."""

    def __init__(self, raw_conn: Any, pool: Any = None):
        self.raw_conn = raw_conn
        self.pool = pool
        self._closed = False

    def cursor(self) -> PostgresCursorWrapper:
        import psycopg2.extras
        cur = self.raw_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        return PostgresCursorWrapper(cur)

    def execute(self, query: str, params: tuple | list | None = None) -> PostgresCursorWrapper:
        cur = self.cursor()
        cur.execute(query, params)
        return cur

    def commit(self) -> None:
        if not self._closed and not self.raw_conn.closed:
            self.raw_conn.commit()

    def rollback(self) -> None:
        if not self._closed and not self.raw_conn.closed:
            self.raw_conn.rollback()

    def close(self) -> None:
        if not self._closed:
            self._closed = True
            if self.pool is not None and not getattr(self.pool, "closed", False):
                try:
                    self.pool.putconn(self.raw_conn)
                except Exception:
                    try:
                        self.raw_conn.close()
                    except Exception:
                        pass
            else:
                try:
                    self.raw_conn.close()
                except Exception:
                    pass


def get_db_connection() -> Any:
    """Returns unified DB connection: PostgreSQL pool if active, else local SQLite."""
    pool = _get_pg_pool()
    if pool is not None:
        try:
            raw_conn = pool.getconn()
            if raw_conn.closed:
                pool.putconn(raw_conn, close=True)
                raw_conn = pool.getconn()
            # Ensure transaction is clean
            if raw_conn.get_transaction_status() != 0:
                raw_conn.rollback()
            return PostgresConnectionWrapper(raw_conn, pool=pool)
        except Exception as exc:
            logger.warning(f"Error leasing connection from PostgreSQL pool ({exc}). Falling back to SQLite.")

    # SQLite connection for demo mode or local fallback
    conn = sqlite3.connect(str(settings.DB_PATH), check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA busy_timeout = 30000;")
    except Exception:
        pass
    return conn


def init_database():
    """Initializes database schema and populates verified initial seed records."""
    conn = get_db_connection()
    is_postgres = isinstance(conn, PostgresConnectionWrapper)
    cursor = conn.cursor()

    if not is_postgres:
        cursor.execute("PRAGMA journal_mode = WAL;")
        cursor.execute("PRAGMA synchronous = NORMAL;")
        cursor.execute("PRAGMA foreign_keys = ON;")

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        secondary_email TEXT,
        emergency_phone TEXT,
        role TEXT NOT NULL,
        hospital_affiliation TEXT,
        license_number TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Patients Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        mrn TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        blood_group TEXT NOT NULL,
        height_cm REAL DEFAULT 175.0,
        weight_kg REAL DEFAULT 70.0,
        conditions_json TEXT NOT NULL,
        baseline_vitals_json TEXT NOT NULL,
        emergency_contact TEXT,
        medical_history_json TEXT,
        allergies_json TEXT,
        medications_json TEXT,
        emergency_contacts_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Diagnostic Records Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS diagnostic_records (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        disease TEXT NOT NULL,
        model_architecture TEXT NOT NULL,
        prediction_class TEXT NOT NULL,
        confidence REAL NOT NULL,
        classical_model TEXT NOT NULL,
        classical_confidence REAL NOT NULL,
        probabilities_json TEXT NOT NULL,
        explainability_json TEXT NOT NULL,
        inference_ms REAL NOT NULL,
        fallback_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id)
    );
    """)

    # Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        status TEXT NOT NULL,
        hash_signature TEXT NOT NULL
    );
    """)

    # Consents Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS consents (
        patient_id TEXT PRIMARY KEY,
        dpdp_opt_in INTEGER DEFAULT 1,
        telemetry_sharing INTEGER DEFAULT 1,
        research_access INTEGER DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id)
    );
    """)

    # Early Detection Assessments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS early_detection_assessments (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        protocol TEXT NOT NULL,
        risk_tier TEXT NOT NULL,
        trajectory_stage INTEGER NOT NULL,
        biomarkers_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id)
    );
    """)

    # Skin Cancer Predictions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS skin_cancer_predictions (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        model TEXT NOT NULL,
        prediction_class TEXT NOT NULL,
        confidence REAL NOT NULL,
        probabilities_json TEXT NOT NULL,
        quantum_info_json TEXT,
        inference_ms REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Doctors Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        registration_number TEXT NOT NULL,
        council_name TEXT NOT NULL,
        experience_years INTEGER NOT NULL,
        fee_inr REAL NOT NULL,
        rating REAL DEFAULT 4.8,
        languages_json TEXT NOT NULL,
        hospital_affiliation TEXT NOT NULL,
        available_slots_json TEXT NOT NULL,
        verification_status TEXT DEFAULT 'verified',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)

    # Bookings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        doctor_id TEXT NOT NULL,
        slot_time TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'video',
        status TEXT NOT NULL DEFAULT 'requested',
        payment_status TEXT NOT NULL DEFAULT 'authorized',
        intake_json TEXT,
        triage_risk TEXT DEFAULT 'normal',
        emergency_flags_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id),
        FOREIGN KEY (doctor_id) REFERENCES doctors (id)
    );
    """)

    # Virtual Consultation Rooms
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS consultation_rooms (
        id TEXT PRIMARY KEY,
        booking_id TEXT UNIQUE NOT NULL,
        room_token TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'waiting',
        doctor_joined INTEGER DEFAULT 0,
        patient_joined INTEGER DEFAULT 0,
        chat_messages_json TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
    );
    """)

    sig_id_type = "SERIAL PRIMARY KEY" if is_postgres else "INTEGER PRIMARY KEY AUTOINCREMENT"
    cursor.execute(f"""
    CREATE TABLE IF NOT EXISTS consultation_signals (
        id {sig_id_type},
        booking_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_role TEXT NOT NULL,
        signal_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
    );
    """)

    # Prescriptions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        doctor_id TEXT NOT NULL,
        diagnosis TEXT NOT NULL,
        medications_json TEXT NOT NULL,
        care_plan_json TEXT NOT NULL,
        soap_notes_json TEXT NOT NULL,
        digital_signature_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings (id),
        FOREIGN KEY (patient_id) REFERENCES patients (id),
        FOREIGN KEY (doctor_id) REFERENCES doctors (id)
    );
    """)

    # Notifications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        reference_code TEXT,
        category TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

    # Seed Default Users (Purged all dummy patient accounts)
    seed_users = [
        ("ADM-SYSTEM", "admin.audit", hash_password("admin123"), "Audit & Security Admin", "compliance.lead@egreenquanta.health", "admin.sec@gmail.com", "+91 98222 33445", "admin", "Q-RAKSHAK Governance Board", "SEC-DPDP-001"),
        ("DOC-USR-KAVITA", "dr.kavita", hash_password("doctor123"), "Dr. Kavita Rao, MD", "kavita.rao@aiims.edu", "dr.kavita@gmail.com", "+91 98111 22334", "doctor", "AIIMS Cardiology OPD", "MCI-2014-89312"),
        ("DOC-USR-RAJESH", "dr.rajesh", hash_password("doctor123"), "Dr. Rajesh Mehta, MD, DM", "rajesh.mehta@tmh.org", "dr.rajesh@gmail.com", "+91 98222 55667", "doctor", "Tata Memorial Hospital", "MCI-2009-44120"),
        ("DOC-USR-ANANYA", "dr.ananya", hash_password("doctor123"), "Dr. Ananya Sen, MD", "ananya.sen@manipal.health", "dr.ananya@gmail.com", "+91 98333 77889", "doctor", "Manipal Hospital Pulmonology", "MCI-2018-77412"),
        ("DOC-VIKRAM", "dr.vikram", hash_password("doctor123"), "Dr. Vikram Malhotra, MBBS", "vikram.malhotra@gmail.com", "", "+91 98444 88990", "doctor", "Apollo Clinics", "MCI-2023-11045"),
        ("DOC-USR-ARYAN", "dr.aryan", hash_password("clinician123"), "Dr. Aryan Choudhury, MD", "aryan.crores@gmail.com", "aryan@q-rakshak.health", "+91 98765 43210", "doctor", "AIIMS Clinical AI OPD", "MCI-2024-99881"),
        ("USR-5EF52B", "aryan", hash_password("patient123"), "Aryan Choudhury", "aryan.crores@gmail.com", "aryan.emergency@gmail.com", "+91 98765 43210", "patient", "AIIMS Cardiology & Oncology OPD", "PT-REC-99881"),
        ("PT-ALEX", "alex.patient", hash_password("patient123"), "Alex Mercer", "alex.patient@egreenquanta.health", "", "+91 98765 43210", "patient", "Community Hospital", "PT-REC-ALEX"),
        ("RES-PRIYA", "priya.qml", hash_password("quantum123"), "Dr. Priya Sharma, PhD", "priya.qml@egreenquanta.health", "", "+91 98555 66778", "researcher", "Centre for Quantum Technologies", "RES-QML-001"),
    ]

    for uid, uname, pwd_hash, name, email, sec_email, em_phone, role, aff, lic in seed_users:
        existing_user = cursor.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR id = ?;", (uname, uid)).fetchone()
        if existing_user:
            actual_id = existing_user["id"] if isinstance(existing_user, dict) else existing_user[0]
            cursor.execute("""
            UPDATE users
            SET username = ?, password_hash = ?, name = ?, email = ?, secondary_email = ?, emergency_phone = ?, role = ?, hospital_affiliation = ?, license_number = ?
            WHERE id = ?;
            """, (uname, pwd_hash, name, email, sec_email, em_phone, role, aff, lic, actual_id))
        else:
            cursor.execute("""
            INSERT INTO users (id, username, password_hash, name, email, secondary_email, emergency_phone, role, hospital_affiliation, license_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (uid, uname, pwd_hash, name, email, sec_email, em_phone, role, aff, lic))

    # Seed Verified Doctors Directory
    seed_doctors = [
        ("DOC-KAVITA", "DOC-USR-KAVITA", "Dr. Kavita Rao, MD", "Cardiology & Preventive Medicine", "MCI-2014-89312", "Delhi Medical Council", 14, 800.0, 4.9, json.dumps(["English", "Hindi"]), "AIIMS Cardiology OPD", json.dumps(["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"]), "verified"),
        ("DOC-RAJESH", "DOC-USR-RAJESH", "Dr. Rajesh Mehta, MD, DM", "Medical Oncology", "MCI-2009-44120", "Maharashtra Medical Council", 16, 1000.0, 4.8, json.dumps(["English", "Hindi", "Marathi"]), "Tata Memorial Hospital", json.dumps(["09:30 AM", "11:00 AM", "03:00 PM"]), "verified"),
        ("DOC-ANANYA", "DOC-USR-ANANYA", "Dr. Ananya Sen, MD", "Pulmonary & Respiratory Medicine", "MCI-2018-77412", "Karnataka Medical Council", 9, 700.0, 4.9, json.dumps(["English", "Hindi", "Bengali"]), "Manipal Hospital Pulmonology", json.dumps(["10:30 AM", "01:00 PM", "05:00 PM"]), "verified"),
        ("DOC-VIKRAM", "DOC-VIKRAM", "Dr. Vikram Malhotra, MBBS", "Dermatology & Skin Lesions", "MCI-2023-11045", "Delhi Medical Council", 3, 500.0, 4.5, json.dumps(["English", "Hindi"]), "Apollo Clinics", json.dumps(["11:00 AM", "02:30 PM"]), "pending"),
        ("DOC-ARYAN", "DOC-USR-ARYAN", "Dr. Aryan Choudhury, MD", "General Medicine & Clinical AI", "MCI-2024-99881", "Delhi Medical Council", 8, 800.0, 5.0, json.dumps(["English", "Hindi"]), "AIIMS Clinical AI OPD", json.dumps(["09:00 AM", "11:30 AM", "03:00 PM", "05:00 PM"]), "verified"),
    ]

    for did, duid, dname, dspec, dreg, dcoun, dexp, dfee, drat, dlang, daff, dslots, dstat in seed_doctors:
        cursor.execute("""
        INSERT OR IGNORE INTO doctors (id, user_id, name, specialty, registration_number, council_name, experience_years, fee_inr, rating, languages_json, hospital_affiliation, available_slots_json, verification_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (did, duid, dname, dspec, dreg, dcoun, dexp, dfee, drat, dlang, daff, dslots, dstat))

    # Seed Patient Record for USR-5EF52B (Aryan Choudhury)
    cursor.execute("""
    INSERT OR IGNORE INTO patients (id, mrn, name, age, gender, blood_group, height_cm, weight_kg, conditions_json, baseline_vitals_json, emergency_contact, medical_history_json, allergies_json, medications_json, emergency_contacts_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        "USR-5EF52B",
        "MRN-5EF52B-QX",
        "Aryan Choudhury",
        28,
        "Male",
        "O+",
        178.0,
        74.0,
        json.dumps([]),
        json.dumps({
            "heart_rate_bpm": 72,
            "blood_pressure": "120/80 mmHg",
            "spo2_percent": 99,
            "temperature_f": 98.6,
        }),
        "+91 98765 43210",
        json.dumps([]),
        json.dumps([]),
        json.dumps([]),
        json.dumps([{"name": "Emergency Contact", "phone": "+91 98765 43210", "relation": "Family", "is_primary": True}])
    ))

    # Seed Consent for USR-5EF52B
    cursor.execute("""
    INSERT OR IGNORE INTO consents (patient_id, dpdp_opt_in, telemetry_sharing, research_access)
    VALUES (?, 1, 1, 1);
    """, ("USR-5EF52B",))

    # Seed Initial Audit Logs if empty
    res = cursor.execute("SELECT COUNT(*) as cnt FROM audit_logs;").fetchone()
    cnt = res["cnt"] if isinstance(res, dict) else res[0]
    if cnt == 0:
        seed_logs = [
            ("AUD-1001", "2026-09-06T12:00:00Z", "Clinical System Engine", "PATIENT_RECORD_INIT", "USR-5EF52B", "127.0.0.1", "SUCCESS", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
            ("AUD-1002", "2026-09-06T12:05:00Z", "Quantum Kernel Telemetry", "VQC_SYSTEM_CALIBRATE", "QPU-SIM-8Q", "127.0.0.1", "SUCCESS", "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"),
            ("AUD-1003", "2026-09-06T12:10:00Z", "Audit & Security Admin", "DPDP_CONSENT_VERIFY", "USR-5EF52B", "127.0.0.1", "SUCCESS", "3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d"),
        ]
        for aid, ts, actor, action, rsc, ip, status, hsig in seed_logs:
            cursor.execute("""
            INSERT OR IGNORE INTO audit_logs (id, timestamp, actor, action, resource, ip_address, status, hash_signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (aid, ts, actor, action, rsc, ip, status, hsig))

    # Seed Initial Notifications for USR-5EF52B if empty
    notif_check = cursor.execute("SELECT id FROM notifications LIMIT 1;").fetchone()
    if not notif_check:
        cursor.execute("""
        INSERT OR IGNORE INTO notifications (id, user_id, title, message, reference_code, category, is_read)
        VALUES
        ('NOTIF-INIT-01', 'USR-5EF52B', 'Clinical Vault Synchronized', 'Your longitudinal medical records and quantum baseline have been initialized with DPDP compliance.', 'REF-EHR-1001', 'security', 0),
        ('NOTIF-INIT-02', 'USR-5EF52B', 'Next Health Checkup Ready', 'Annual multi-organ quantum biomarker assessment is now available.', 'REF-CHK-2002', 'clinical', 0);
        """)

    # Auto-sync any unlinked doctor accounts to doctors directory
    doc_users = cursor.execute("SELECT id, username, name, hospital_affiliation, license_number FROM users WHERE LOWER(role) IN ('doctor', 'clinician');").fetchall()
    existing_docs = {r["user_id"] if isinstance(r, dict) else r[0] for r in cursor.execute("SELECT user_id FROM doctors;").fetchall()}
    for u in doc_users:
        uid = u["id"] if isinstance(u, dict) else u[0]
        if uid not in existing_docs:
            uname = u["name"] if isinstance(u, dict) else u[2]
            dname = uname if (uname.startswith("Dr.") or uname.startswith("Dr ")) else f"Dr. {uname}"
            uaff = (u["hospital_affiliation"] if isinstance(u, dict) else u[3]) or "AIIMS Clinical AI OPD"
            ulic = (u["license_number"] if isinstance(u, dict) else u[4]) or f"MCI-2026-{uuid.uuid4().hex[:5].upper()}"
            cursor.execute("""
            INSERT OR IGNORE INTO doctors (id, user_id, name, specialty, registration_number, council_name, experience_years, fee_inr, rating, languages_json, hospital_affiliation, available_slots_json, verification_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                f"DOC-{uid.replace('USR-', '')}",
                uid,
                dname,
                "General Medicine & Clinical AI",
                ulic,
                "National Medical Commission",
                6,
                600.0,
                4.9,
                json.dumps(["English", "Hindi"]),
                uaff,
                json.dumps(["09:30 AM", "11:00 AM", "02:30 PM", "04:30 PM"]),
                "verified"
            ))

    conn.commit()
    conn.close()
    logger.info(f"Database initialized successfully (Engine: {'PostgreSQL' if is_postgres else 'SQLite'})")


# Alias for compatibility
init_db = init_database

# Auto-initialize on load
init_database()

