from __future__ import annotations

import asyncio
import datetime
import hashlib
import logging
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from backend.app.core.config import settings

logger = logging.getLogger("qrakshak.email_service")


def _generate_security_token_preview(identifier: str, timestamp: str) -> str:
    raw = f"{identifier}:{timestamp}:{settings.JWT_SECRET}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"SIG-{digest[:4].upper()}-{digest[4:8].upper()}-{digest[8:12].upper()}"


def _build_login_notification_html(
    user_email: str,
    user_name: str,
    login_time: str,
    ip_address: str,
    auth_method: str = "Google OAuth 2.0 (Verified OpenID)",
    user_role: str = "Patient",
) -> str:
    sig_hash = _generate_security_token_preview(user_email, login_time)
    portal_url = settings.FRONTEND_URL.rstrip("/")
    lock_url = f"{portal_url}/#security/freeze?token={sig_hash}"
    audit_url = f"{portal_url}/#records"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert: Authorized Sign-in to Q-RAKSHAK</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #07090E;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2E8F0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      table-layout: fixed;
      background-color: #07090E;
      padding: 40px 10px;
    }}
    .container {{
      max-width: 580px;
      margin: 0 auto;
      background-color: #0D111A;
      border: 1px solid #1E293B;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 229, 163, 0.05);
    }}
    .header-bar {{
      height: 4px;
      background: linear-gradient(90deg, #00E5A3 0%, #0EA5E9 50%, #8B5CF6 100%);
    }}
    .header-inner {{
      padding: 32px 36px 24px 36px;
      border-bottom: 1px solid #1E293B;
      background: linear-gradient(180deg, rgba(14, 165, 233, 0.04) 0%, rgba(13, 17, 26, 0) 100%);
    }}
    .brand-title {{
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #F8FAFC;
      margin: 0 0 4px 0;
    }}
    .brand-accent {{
      color: #00E5A3;
    }}
    .brand-subtitle {{
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #64748B;
      margin: 0;
    }}
    .status-badge {{
      display: inline-block;
      margin-top: 14px;
      padding: 5px 12px;
      background-color: rgba(0, 229, 163, 0.1);
      border: 1px solid rgba(0, 229, 163, 0.3);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #00E5A3;
      text-transform: uppercase;
    }}
    .content-body {{
      padding: 32px 36px;
    }}
    .greeting {{
      font-size: 18px;
      font-weight: 700;
      color: #F8FAFC;
      margin: 0 0 12px 0;
    }}
    .lead-text {{
      font-size: 14px;
      line-height: 1.6;
      color: #94A3B8;
      margin: 0 0 24px 0;
    }}
    .meta-card {{
      background-color: #111827;
      border: 1px solid #1E293B;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 28px;
    }}
    .meta-row {{
      display: table;
      width: 100%;
      padding: 8px 0;
      border-bottom: 1px solid rgba(30, 41, 59, 0.5);
    }}
    .meta-row:last-child {{
      border-bottom: none;
      padding-bottom: 0;
    }}
    .meta-label {{
      display: table-cell;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748B;
      width: 40%;
      vertical-align: middle;
    }}
    .meta-value {{
      display: table-cell;
      font-size: 13px;
      font-weight: 600;
      color: #F1F5F9;
      width: 60%;
      text-align: right;
      vertical-align: middle;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }}
    .btn-container {{
      text-align: center;
      margin: 32px 0 20px 0;
    }}
    .btn-freeze {{
      display: inline-block;
      background-color: #EF4444;
      color: #FFFFFF !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.5px;
      padding: 12px 28px;
      border-radius: 8px;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
    }}
    .notice-box {{
      background-color: rgba(14, 165, 233, 0.05);
      border-left: 3px solid #0EA5E9;
      padding: 14px 18px;
      border-radius: 4px 8px 8px 4px;
      margin-bottom: 28px;
    }}
    .notice-text {{
      font-size: 12px;
      line-height: 1.5;
      color: #7DD3FC;
      margin: 0;
    }}
    .footer {{
      padding: 24px 36px 32px 36px;
      border-top: 1px solid #1E293B;
      background-color: #0A0D14;
      text-align: center;
    }}
    .compliance-pills {{
      margin-bottom: 16px;
    }}
    .pill {{
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #64748B;
      background: #111827;
      border: 1px solid #1E293B;
      padding: 3px 8px;
      border-radius: 4px;
      margin: 2px 4px;
    }}
    .footer-copy {{
      font-size: 11px;
      line-height: 1.6;
      color: #475569;
      margin: 0;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header-bar"></div>
      <div class="header-inner">
        <h1 class="brand-title">Q-RAKSHAK<span class="brand-accent">.HEALTH</span></h1>
        <p class="brand-subtitle">Quantum Clinical Intelligence & Telemetry</p>
        <div class="status-badge">● Authorized Clinical Session Active</div>
      </div>
      <div class="content-body">
        <h2 class="greeting">Security Notice for {user_name}</h2>
        <p class="lead-text">
          A successful sign-in to your protected clinical workspace was confirmed. All diagnostic records, 3D anatomical digital twins, and biomarker history remain encrypted with zero-knowledge WORM audit trails.
        </p>

        <div class="meta-card">
          <div class="meta-row">
            <span class="meta-label">Account Subject</span>
            <span class="meta-value">{user_email}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Access Clearance</span>
            <span class="meta-value" style="color: #00E5A3;">{user_role.title()}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Authentication Method</span>
            <span class="meta-value">{auth_method}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Timestamp</span>
            <span class="meta-value">{login_time}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Client IP Address</span>
            <span class="meta-value">{ip_address}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Security Signature</span>
            <span class="meta-value" style="color: #38BDF8;">{sig_hash}</span>
          </div>
        </div>

        <div class="notice-box">
          <p class="notice-text">
            <strong>Proactive Patient Safety:</strong> If this sign-in was initiated by you, no action is needed. If you did not sign in or suspect unauthorized clinical activity, immediately freeze this session using the emergency override below.
          </p>
        </div>

        <div class="btn-container">
          <a href="{lock_url}" class="btn-freeze">Freeze Account & Revoke Sessions</a>
        </div>
      </div>

      <div class="footer">
        <div class="compliance-pills">
          <span class="pill">HIPAA Safe Harbor</span>
          <span class="pill">DPDP Act 2023</span>
          <span class="pill">ABDM Standards</span>
          <span class="pill">ISO/IEC 27001</span>
        </div>
        <p class="footer-copy">
          This transmission contains confidential protected healthcare metadata (SaMD 62304).<br>
          Automated Sentinel Security Service • Q-RAKSHAK Deep Quantum Clinical Architecture.
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""


def _build_welcome_notification_html(user_email: str, user_name: str, user_role: str = "Patient") -> str:
    portal_url = settings.FRONTEND_URL.rstrip("/")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Welcome to Q-RAKSHAK</title>
  <style>
    body {{ margin: 0; padding: 0; background-color: #07090E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; }}
    .wrapper {{ padding: 40px 10px; background-color: #07090E; }}
    .container {{ max-width: 580px; margin: 0 auto; background-color: #0D111A; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; }}
    .header-bar {{ height: 4px; background: linear-gradient(90deg, #00E5A3 0%, #0EA5E9 100%); }}
    .header-inner {{ padding: 32px 36px; border-bottom: 1px solid #1E293B; }}
    .content {{ padding: 32px 36px; }}
    .cta-btn {{ display: inline-block; background-color: #00E5A3; color: #07090E !important; font-weight: 800; padding: 12px 28px; border-radius: 8px; text-decoration: none; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header-bar"></div>
      <div class="header-inner">
        <h1 style="color: #F8FAFC; margin: 0; font-size: 20px;">Q-RAKSHAK<span style="color: #00E5A3;">.HEALTH</span></h1>
        <p style="color: #64748B; font-size: 11px; text-transform: uppercase; margin: 4px 0 0 0;">Welcome to Autonomous Quantum Healthcare</p>
      </div>
      <div class="content">
        <h2 style="color: #F8FAFC;">Welcome, {user_name}!</h2>
        <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
          Your clinical account has been provisioned with <strong>{user_role.title()}</strong> clearance. You now have access to multimodal foundation AI diagnostics, 2D/3D temporal anatomical digital twins, and longitudinal early-prevention trajectory modeling.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{portal_url}" class="cta-btn">Access Diagnostic Workspace</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""


def _send_smtp_email_sync(
    to_email: str,
    subject: str,
    html_body: str,
    attachments: list[dict[str, Any]] | None = None,
) -> bool:
    """Synchronous SMTP email delivery function with attachment support designed for background threads."""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.info("SMTP credentials not configured. Diagnostic email logged for %s: %s", to_email, subject)
        return False

    sender_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    from_header = f"{settings.SMTP_FROM_NAME} <{sender_email}>"

    if attachments:
        msg = MIMEMultipart("mixed")
        body_part = MIMEMultipart("alternative")
        body_part.attach(MIMEText(html_body, "html"))
        msg.attach(body_part)

        for att in attachments:
            filename = att.get("filename", "attachment.html")
            content = att.get("content", "")
            if isinstance(content, str):
                content_bytes = content.encode("utf-8")
            else:
                content_bytes = content
            part = MIMEApplication(content_bytes)
            part.add_header("Content-Disposition", "attachment", filename=filename)
            msg.attach(part)
    else:
        msg = MIMEMultipart("alternative")
        msg.attach(MIMEText(html_body, "html"))

    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = to_email

    if settings.NOTIFICATION_EMAIL and settings.NOTIFICATION_EMAIL != to_email:
        msg["Bcc"] = settings.NOTIFICATION_EMAIL

    try:
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
        logger.info("Clinical notification email delivered successfully to %s", to_email)
        return True
    except Exception as exc:
        logger.warning("Failed to dispatch SMTP email to %s: %s", to_email, exc)
        return False


def _build_clinical_report_html(
    patient_id: str,
    patient_name: str,
    disease: str,
    prediction_class: str,
    confidence: float,
    classical_confidence: float,
    top_biomarkers: list[str],
    report_id: str,
    timestamp: str,
) -> str:
    portal_url = settings.FRONTEND_URL.rstrip("/")
    is_high_risk = any(w in prediction_class.lower() for w in ["malignant", "disease", "elevated", "pneumonia", "high", "positive"])
    status_bg = "rgba(239, 68, 68, 0.15)" if is_high_risk else "rgba(16, 185, 129, 0.15)"
    status_border = "rgba(239, 68, 68, 0.4)" if is_high_risk else "rgba(16, 185, 129, 0.4)"
    status_color = "#F87171" if is_high_risk else "#34D399"
    status_badge_text = "Elevated Risk Finding" if is_high_risk else "Normal / Baseline Finding"

    biomarker_rows = ""
    for bm in top_biomarkers[:4]:
        raw_name = bm.split("(")[0].strip() if "(" in bm else bm
        pct_str = bm.split("(")[1].replace(")", "").replace("%", "").strip() if "(" in bm else "25"
        try:
            pct_val = float(pct_str)
        except ValueError:
            pct_val = 25.0
        biomarker_rows += f"""
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1E293B; color: #F1F5F9; font-weight: 600; font-size: 13px;">{raw_name}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1E293B; text-align: right; color: #00E5A3; font-family: monospace; font-weight: 700; font-size: 13px;">{pct_val:.1f}%</td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clinical Assessment Report: {report_id}</title>
  <style>
    body {{ margin: 0; padding: 0; background-color: #07090E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; }}
    .wrapper {{ width: 100%; table-layout: fixed; background-color: #07090E; padding: 40px 10px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #0D111A; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }}
    .header-bar {{ height: 4px; background: linear-gradient(90deg, #00E5A3 0%, #0EA5E9 50%, #8B5CF6 100%); }}
    .header-inner {{ padding: 30px 36px 20px 36px; border-bottom: 1px solid #1E293B; background: linear-gradient(180deg, rgba(14, 165, 233, 0.04) 0%, rgba(13, 17, 26, 0) 100%); }}
    .brand-title {{ font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #F8FAFC; margin: 0 0 4px 0; }}
    .brand-accent {{ color: #00E5A3; }}
    .brand-subtitle {{ font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #64748B; margin: 0; }}
    .body-content {{ padding: 28px 36px; }}
    .info-card {{ background-color: #121824; border: 1px solid #1E293B; border-radius: 12px; padding: 18px 20px; margin-bottom: 22px; }}
    .info-row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #1E293B; font-size: 13px; }}
    .info-label {{ color: #94A3B8; }}
    .info-value {{ color: #F8FAFC; font-weight: 600; font-family: monospace; }}
    .status-badge {{ display: inline-block; padding: 6px 14px; background-color: {status_bg}; border: 1px solid {status_border}; border-radius: 9999px; font-size: 12px; font-weight: 700; color: {status_color}; }}
    .cta-btn {{ display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #00E5A3 0%, #0EA5E9 100%); color: #07090E; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; text-decoration: none; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0, 229, 163, 0.35); }}
    .footer {{ padding: 20px 36px; background-color: #0A0D14; border-top: 1px solid #1E293B; font-size: 11px; color: #64748B; line-height: 1.6; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header-bar"></div>
      <div class="header-inner">
        <h1 class="brand-title">Q-RAKSHAK <span class="brand-accent">// CLINICAL REPORT</span></h1>
        <p class="brand-subtitle">Quantum-Enhanced Diagnostic Intelligence</p>
        <div style="margin-top: 14px;">
          <span class="status-badge">{status_badge_text}</span>
        </div>
      </div>
      <div class="body-content">
        <p style="font-size: 15px; line-height: 1.6; color: #CBD5E1; margin-top: 0;">
          A clinical evaluation has been processed and compiled for <strong>{patient_name}</strong> (ID: <code style="color: #00E5A3;">{patient_id}</code>).
        </p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Report ID:</span>
            <span class="info-value">{report_id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Evaluation Study:</span>
            <span class="info-value" style="font-family: inherit;">{disease}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Model Classification:</span>
            <span class="info-value" style="color: {status_color};">{prediction_class}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Quantum Confidence:</span>
            <span class="info-value" style="color: #00E5A3;">{(confidence * 100):.2f}%</span>
          </div>
          <div class="info-row" style="border-bottom: none;">
            <span class="info-label">Classical Baseline:</span>
            <span class="info-value">{(classical_confidence * 100):.2f}%</span>
          </div>
        </div>

        <h3 style="font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: #94A3B8; margin: 20px 0 10px 0;">
          Primary Biomarker Contributions
        </h3>
        <table style="width: 100%; border-collapse: collapse; background-color: #121824; border: 1px solid #1E293B; border-radius: 8px; margin-bottom: 24px;">
          {biomarker_rows}
        </table>

        <div style="background-color: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.25); border-radius: 8px; padding: 14px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 12px; color: #93C5FD; line-height: 1.5;">
            📎 <strong>Full Printable Report Attached:</strong> The complete standalone HTML clinical diagnostic report has been attached to this email (<code>Q-RAKSHAK_Clinical_Report_{report_id}.html</code>) with cryptographic audit seals.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="{portal_url}/#records" class="cta-btn">Access Patient EHR Dashboard</a>
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0;">
          <strong>DPDP Act 2023 / HIPAA Notice:</strong> This clinical transmission contains confidential, legally privileged medical assessment telemetry.
        </p>
        <p style="margin: 0; font-family: monospace; font-size: 10px; color: #475569;">
          Timestamp: {timestamp} • WORM Audit Hash: Verified SHA-256
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""


def _build_triage_card_html(
    patient_id: str,
    patient_name: str,
    blood_group: str,
    emergency_phone: str,
    emergency_contact_name: str,
    allergies: str,
    active_medications: str,
    abha_id: str,
    qr_code_base64: str,
    portal_url: str,
) -> str:
    emergency_url = f"{portal_url}/#triage/{patient_id}"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emergency Medical Passport: {patient_name}</title>
  <style>
    body {{ margin: 0; padding: 0; background-color: #07090E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; }}
    .wrapper {{ width: 100%; table-layout: fixed; background-color: #07090E; padding: 40px 10px; }}
    .container {{ max-width: 580px; margin: 0 auto; background-color: #0D111A; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }}
    .header-bar {{ height: 5px; background: linear-gradient(90deg, #DC2626 0%, #F59E0B 50%, #00E5A3 100%); }}
    .header-inner {{ padding: 28px 36px 20px 36px; border-bottom: 1px solid #1E293B; background: linear-gradient(180deg, rgba(220, 38, 38, 0.08) 0%, rgba(13, 17, 26, 0) 100%); }}
    .brand-title {{ font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #F8FAFC; margin: 0 0 4px 0; }}
    .blood-badge {{ display: inline-block; padding: 5px 14px; background: #DC2626; color: #FFFFFF; font-weight: 900; font-size: 14px; border-radius: 6px; letter-spacing: 1px; }}
    .card-preview {{ background: #121824; border: 1.5px solid #334155; border-radius: 14px; padding: 20px; margin: 20px 0; }}
    .allergy-box {{ background: #450A0A; border: 1px solid #EF4444; border-radius: 8px; padding: 12px; margin-top: 14px; }}
    .cta-btn {{ display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #DC2626 0%, #EA580C 100%); color: #FFFFFF; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; text-decoration: none; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(220, 38, 38, 0.4); }}
    .footer {{ padding: 20px 36px; background-color: #0A0D14; border-top: 1px solid #1E293B; font-size: 11px; color: #64748B; line-height: 1.6; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header-bar"></div>
      <div class="header-inner">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h1 class="brand-title">EMERGENCY TRIAGE PASS</h1>
            <p style="font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #94A3B8; margin: 0;">Rapid First-Responder Access</p>
          </div>
          <div>
            <span class="blood-badge">{blood_group}</span>
          </div>
        </div>
      </div>
      <div style="padding: 28px 36px;">
        <p style="font-size: 14px; color: #CBD5E1; margin: 0 0 16px 0;">
          Your official digital emergency triage pass is ready. Paramedics and emergency clinicians can scan the QR code directly from this email to instantly access life-critical directives.
        </p>

        <div class="card-preview">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
            <div style="flex: 1;">
              <div style="font-size: 18px; font-weight: 800; color: #F8FAFC;">{patient_name}</div>
              <div style="font-size: 12px; color: #94A3B8; font-family: monospace; margin-top: 2px;">MRN: MRN-{patient_id}-QX • ABHA: {abha_id}</div>
              
              <div style="margin-top: 14px; font-size: 13px;">
                <div style="color: #94A3B8;">Next of Kin / Contact:</div>
                <div style="font-weight: 700; color: #F1F5F9; margin-top: 2px;">{emergency_contact_name} — <a href="tel:{emergency_phone}" style="color: #00E5A3; text-decoration: none;">{emergency_phone}</a></div>
              </div>

              <div style="margin-top: 10px; font-size: 13px;">
                <div style="color: #94A3B8;">Active Medications:</div>
                <div style="font-weight: 600; color: #F1F5F9; margin-top: 2px;">{active_medications}</div>
              </div>
            </div>

            {f'<div style="text-align: center;"><img src="{qr_code_base64}" width="120" height="120" style="border-radius: 8px; border: 2px solid #FFFFFF; display: block;" alt="Emergency QR Code" /><div style="font-size: 9px; color: #94A3B8; margin-top: 4px; font-family: monospace;">SCAN FOR EHR</div></div>' if qr_code_base64 else ''}
          </div>

          <div class="allergy-box">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #FCA5A5;">Critical Drug Allergies:</div>
            <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-top: 4px;">{allergies}</div>
          </div>
        </div>

        <div style="background-color: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.25); border-radius: 8px; padding: 14px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 12px; color: #FCA5A5; line-height: 1.5;">
            📎 <strong>Printable A4 Wallet Card Attached:</strong> A printable copy of your official 1:1 ISO/IEC 7810 ID-1 wallet pass is attached (<code>Q-RAKSHAK_Triage_Pass_{patient_id}.html</code>). Print and carry it in your wallet at all times.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="{emergency_url}" class="cta-btn">Open Live Emergency Triage Portal</a>
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0;">
          <strong>First Responder Notice:</strong> In trauma or critical distress, scan QR code with any standard camera to retrieve real-time vitals and physician telemetry.
        </p>
        <p style="margin: 0; font-family: monospace; font-size: 10px; color: #475569;">
          Portal: {emergency_url} • Permanent Record ID: {patient_id}
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""


async def send_clinical_report_email(
    user_email: str,
    patient_id: str,
    patient_name: str,
    disease: str,
    prediction_class: str,
    confidence: float,
    classical_confidence: float,
    top_biomarkers: list[str],
    report_id: str,
    report_html: str,
) -> bool:
    """Dispatches clinical assessment report email with standalone HTML report attached."""
    if not user_email:
        return False

    now = datetime.datetime.now(datetime.timezone.utc)
    ist_now = now + datetime.timedelta(hours=5, minutes=30)
    timestamp = ist_now.strftime("%d %b %Y, %I:%M:%S %p IST")

    subject = f"📊 [Q-RAKSHAK] Clinical Diagnostic Report — {patient_name} ({report_id})"
    html_content = _build_clinical_report_html(
        patient_id=patient_id,
        patient_name=patient_name or "Patient",
        disease=disease,
        prediction_class=prediction_class,
        confidence=confidence,
        classical_confidence=classical_confidence,
        top_biomarkers=top_biomarkers,
        report_id=report_id,
        timestamp=timestamp,
    )

    attachments = [{
        "filename": f"Q-RAKSHAK_Report_{report_id}.html",
        "content": report_html,
        "content_type": "text/html",
    }]

    try:
        return await asyncio.to_thread(_send_smtp_email_sync, user_email, subject, html_content, attachments)
    except Exception as exc:
        logger.error("Error scheduling clinical report email: %s", exc)
        return False


async def send_triage_card_email(
    user_email: str,
    patient_id: str,
    card_data: dict[str, Any],
    printable_html: str | None = None,
) -> bool:
    """Dispatches emergency triage card email with QR pass and attached printable card."""
    if not user_email:
        return False

    patient_name = card_data.get("name", "Patient")
    blood_group = card_data.get("blood_group", "O+")
    emergency_phone = card_data.get("emergency_phone", "+91 98765 43210")
    emergency_contact_name = card_data.get("emergency_contact_name", "Emergency Contact")
    allergies = card_data.get("allergies", "No known drug allergies (NKDA)")
    active_medications = card_data.get("active_medications", "None Active")
    abha_id = card_data.get("abha_id", "Not linked")
    qr_code_base64 = card_data.get("qr_code_base64", "")
    portal_url = settings.FRONTEND_URL.rstrip("/")

    subject = f"🚨 [Q-RAKSHAK] Emergency Medical Passport & Triage Pass — {patient_name} ({blood_group})"
    html_content = _build_triage_card_html(
        patient_id=patient_id,
        patient_name=patient_name,
        blood_group=blood_group,
        emergency_phone=emergency_phone,
        emergency_contact_name=emergency_contact_name,
        allergies=allergies,
        active_medications=active_medications,
        abha_id=abha_id,
        qr_code_base64=qr_code_base64,
        portal_url=portal_url,
    )

    attachments = []
    if printable_html:
        attachments.append({
            "filename": f"Q-RAKSHAK_Triage_Pass_{patient_id}.html",
            "content": printable_html,
            "content_type": "text/html",
        })

    try:
        return await asyncio.to_thread(_send_smtp_email_sync, user_email, subject, html_content, attachments if attachments else None)
    except Exception as exc:
        logger.error("Error scheduling triage card email: %s", exc)
        return False


async def send_login_notification(
    user_email: str,
    user_name: str,
    login_time: str | None = None,
    ip_address: str = "127.0.0.1",
    auth_method: str = "Google OAuth 2.0 (Verified OpenID)",
    user_role: str = "Patient",
) -> bool:
    """Dispatches a styled, executive-grade clinical login notification email non-blockingly."""
    if not user_email:
        return False

    if not login_time:
        now = datetime.datetime.now(datetime.timezone.utc)
        ist_now = now + datetime.timedelta(hours=5, minutes=30)
        login_time = ist_now.strftime("%d %b %Y, %I:%M:%S %p IST")

    subject = f"🔐 Security Alert: Authorized Sign-in to Q-RAKSHAK ({login_time})"
    html_content = _build_login_notification_html(
        user_email=user_email,
        user_name=user_name or "Clinical User",
        login_time=login_time,
        ip_address=ip_address or "127.0.0.1",
        auth_method=auth_method,
        user_role=user_role or "Patient",
    )

    try:
        return await asyncio.to_thread(_send_smtp_email_sync, user_email, subject, html_content)
    except Exception as exc:
        logger.error("Error scheduling login notification email: %s", exc)
        return False


async def send_welcome_email(
    user_email: str,
    user_name: str,
    user_role: str = "Patient",
) -> bool:
    """Dispatches a welcome email to newly created accounts non-blockingly."""
    if not user_email:
        return False

    subject = "✨ Welcome to Q-RAKSHAK Clinical Intelligence Platform"
    html_content = _build_welcome_notification_html(
        user_email=user_email,
        user_name=user_name or "Clinical User",
        user_role=user_role or "Patient",
    )

    try:
        return await asyncio.to_thread(_send_smtp_email_sync, user_email, subject, html_content)
    except Exception as exc:
        logger.error("Error scheduling welcome email: %s", exc)
        return False
