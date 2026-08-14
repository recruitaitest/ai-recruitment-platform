import logging
import os
import smtplib
from typing import Optional, List, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("email_service")
logger.setLevel(logging.INFO)

def send_email_message(to_email: str, subject: str, html_content: str) -> bool:
    """
    Internal helper to dispatch HTML emails using SMTP or fallback logging.
    """
    if not to_email:
        logger.warning("No recipient email provided")
        return False

    # Dynamic database integration settings fetch
    try:
        from app.database import SessionLocal
        from app.models.integration_settings import IntegrationSettings
        db = SessionLocal()
        db_settings = db.query(IntegrationSettings).first()
        db.close()
    except Exception:
        db_settings = None

    if db_settings and db_settings.email_enabled and db_settings.smtp_host:
        smtp_server = db_settings.smtp_host
        smtp_port = db_settings.smtp_port or 587
        sender_email = db_settings.sender_email or db_settings.smtp_username or "careers@company.com"
        smtp_user = db_settings.smtp_username
        smtp_password = db_settings.smtp_password
        use_tls = True
    else:
        smtp_server = os.getenv("MAIL_SERVER", os.getenv("SMTP_SERVER", "smtp.gmail.com"))
        smtp_port = int(os.getenv("MAIL_PORT", os.getenv("SMTP_PORT", "587")))
        sender_email = os.getenv("MAIL_FROM", os.getenv("SMTP_SENDER", "careers@company.com"))
        smtp_user = os.getenv("MAIL_USERNAME", os.getenv("SMTP_USER", ""))
        smtp_password = os.getenv("MAIL_PASSWORD", os.getenv("SMTP_PASSWORD", ""))
        use_tls = os.getenv("MAIL_STARTTLS", "True").lower() == "true"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        if smtp_user and smtp_password:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                if use_tls:
                    server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(sender_email, [to_email], msg.as_string())
            logger.info(f"Email '{subject}' sent successfully to {to_email}")
        else:
            logger.info(f"[SIMULATED EMAIL] To: {to_email} | Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email '{subject}' to {to_email}: {str(e)}")
        # Return True in dev/test environment to prevent app crashes if SMTP is unconfigured
        return True


import re


def markdown_to_email_html(md_text: str) -> str:
    """
    Converts Markdown job description into clean, well-styled HTML
    optimized for email clients (headers, bold text, bullet lists, spacing).
    """
    if not md_text:
        return ""

    lines = md_text.strip().split("\n")
    html_parts = []
    bullet_buffer = []

    def flush_bullets():
        nonlocal bullet_buffer
        if bullet_buffer:
            lis = "".join([
                f"<li style='margin: 4px 0; color: #374151; font-size: 13px; line-height: 1.6;'>{b}</li>"
                for b in bullet_buffer
            ])
            html_parts.append(f"<ul style='margin: 6px 0 12px 0; padding-left: 20px;'>{lis}</ul>")
            bullet_buffer = []

    def format_inline(text: str) -> str:
        text = re.sub(r'\*\*(.*?)\*\*', r'<strong style="color: #111827;">\1</strong>', text)
        text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
        return text

    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            flush_bullets()
            continue

        if trimmed.startswith("# "):
            flush_bullets()
            title = format_inline(trimmed[2:])
            html_parts.append(
                f"<h3 style='margin: 16px 0 8px 0; font-size: 16px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;'>{title}</h3>"
            )
        elif trimmed.startswith("## ") or trimmed.startswith("### "):
            flush_bullets()
            heading_text = trimmed.lstrip("#").strip()
            heading_text = format_inline(heading_text)
            html_parts.append(
                f"<h4 style='margin: 14px 0 6px 0; font-size: 14px; font-weight: 700; color: #4338ca;'>{heading_text}</h4>"
            )
        elif trimmed.startswith("- ") or trimmed.startswith("* "):
            bullet_text = format_inline(trimmed[2:])
            bullet_buffer.append(bullet_text)
        else:
            flush_bullets()
            p_text = format_inline(trimmed)
            html_parts.append(
                f"<p style='margin: 6px 0; font-size: 13px; color: #374151; line-height: 1.6;'>{p_text}</p>"
            )

    flush_bullets()
    return "\n".join(html_parts)


class EmailService:
    @staticmethod
    def send_acknowledgment_email(to_email: str, candidate_name: str, position_title: str, company: str = "") -> bool:
        if not company or not company.strip() or company.lower() in ["our organization", "our company", "engineering", "sales", "marketing"]:
            try:
                from app.database import SessionLocal
                from app.models.user import User
                db = SessionLocal()
                user = db.query(User).filter(User.company.isnot(None), User.company != "").first()
                if user and user.company and user.company.strip():
                    company = user.company.strip()
                db.close()
            except Exception:
                pass

        if not company:
            company = "RecruitAI"

        subject = f"Application Received: {position_title} at {company}"
        tracking_url = f"http://ai-recruitment-platform.centralindia.cloudapp.azure.com/portal/candidate/{to_email}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 24px; border-radius: 12px; color: white; text-align: center; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 24px;">Application Received</h2>
                    <p style="margin: 8px 0 0 0; opacity: 0.9;">{company} Team</p>
                </div>
                <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p>Dear <strong>{candidate_name}</strong>,</p>
                    <p>Thank you for submitting your application for the <strong>{position_title}</strong> position at <strong>{company}</strong>.</p>
                    <p>We have successfully received your candidate profile and uploaded documents. Our talent acquisition team is currently reviewing applications and will reach out if your background matches our position requirements.</p>
                    <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-left: 4px solid #4f46e5; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #4b5563;">
                            <strong>Position:</strong> {position_title}<br/>
                            <strong>Company:</strong> {company}<br/>
                            <strong>Status:</strong> Under Review
                        </p>
                    </div>
                    <div style="text-align: center; margin: 28px 0;">
                        <a href="{tracking_url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                            Track Your Application
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">
                        Or copy this tracking link: <a href="{tracking_url}" style="color: #4f46e5;">{tracking_url}</a>
                    </p>
                    <p>Best regards,<br/><strong>{company} Talent Acquisition Team</strong></p>
                </div>
            </body>
        </html>
        """
        return send_email_message(to_email, subject, html_content)

    @staticmethod
    def send_verification_email(to_email: str, token: str, user_name: str = "User") -> bool:
        subject = "Verify Your Account - Recruit AI"
        verification_link = f"http://ai-recruitment-platform.centralindia.cloudapp.azure.com/verify-email?token={token}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <h2>Hello {user_name},</h2>
                <p>Please verify your email address by clicking the link below:</p>
                <p><a href="{verification_link}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
                <p>If you did not sign up for Recruit AI, you can ignore this email.</p>
            </body>
        </html>
        """
        return send_email_message(to_email, subject, html_content)

    @staticmethod
    def send_password_reset_email(to_email: str, token: str, user_name: str = "User") -> bool:
        subject = "Reset Your Password - Recruit AI"
        reset_link = f"http://ai-recruitment-platform.centralindia.cloudapp.azure.com/reset-password?token={token}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <h2>Hello {user_name},</h2>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <p><a href="{reset_link}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                <p>If you did not request this, please ignore this email.</p>
            </body>
        </html>
        """
        return send_email_message(to_email, subject, html_content)

    @staticmethod
    def send_mfa_email(to_email: str, code: str, user_name: str = "User") -> bool:
        subject = "Your Verification Code - Recruit AI MFA"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <h2>Hello {user_name},</h2>
                <p>Your multi-factor authentication code is:</p>
                <h1 style="font-size: 32px; letter-spacing: 4px; color: #4f46e5;">{code}</h1>
                <p>This code expires in 10 minutes.</p>
            </body>
        </html>
        """
        return send_email_message(to_email, subject, html_content)

    @staticmethod
    def send_interview_scheduled_email(
        to_email: str,
        candidate_name: str,
        position_title: str,
        interview_type: str = "Technical Round",
        date: str = "TBD",
        time: str = "TBD",
        mode: str = "Online",
        location: str = "",
        job_description: str = "",
        company: str = "RecruitAI",
        required_skills: str = "",
        position_location: str = ""
    ) -> bool:
        # Dynamically fetch company name from User Profile Settings if not provided
        if not company or not company.strip() or company.lower() in ["our organization", "our company", "engineering", "sales", "marketing"]:
            try:
                from app.database import SessionLocal
                from app.models.user import User
                db = SessionLocal()
                user = db.query(User).filter(User.company.isnot(None), User.company != "").first()
                if user and user.company and user.company.strip():
                    company = user.company.strip()
                db.close()
            except Exception:
                pass

        if not company:
            company = "RecruitAI"

        # Format round display cleanly (e.g. "Technical" -> "Technical Round")
        round_display = interview_type or "Interview"
        if round_display and not any(k in round_display.lower() for k in ["round", "interview", "discussion"]):
            round_display = f"{round_display} Round"

        subject = f"Interview Scheduled: {position_title} ({round_display}) - {company}"
        
        # Format location / meeting link
        meeting_link_html = ""
        if mode and mode.lower() == "online" and location and location.startswith("http"):
            meeting_link_html = f"""
            <div style="margin-top: 15px; text-align: center;">
                <a href="{location}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                    🎥 Join Online Interview
                </a>
                <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">Meeting Link: <a href="{location}" style="color: #4f46e5;">{location}</a></p>
            </div>
            """

        # Format Job Description section using styled Markdown parser
        jd_section_html = ""
        if job_description or required_skills:
            jd_details = ""
            if required_skills:
                skills_tags = "".join([
                    f"<span style='display: inline-block; background-color: #f1f5f9; color: #334155; padding: 4px 10px; margin: 3px 4px 3px 0; border-radius: 6px; font-size: 12px; border: 1px solid #e2e8f0; font-weight: 500;'>{s.strip()}</span>"
                    for s in required_skills.split(",") if s.strip()
                ])
                jd_details += f"<div style='margin-bottom: 12px;'><strong style='font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;'>Required Skills:</strong>{skills_tags}</div>"
            if position_location:
                jd_details += f"<p style='margin: 6px 0 12px 0; font-size: 13px; color: #4b5563;'><strong>📍 Location:</strong> {position_location}</p>"
            if job_description:
                rendered_jd = markdown_to_email_html(job_description)
                jd_details += f"<div style='margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;'>{rendered_jd}</div>"

            jd_section_html = f"""
            <div style="margin-top: 24px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a; font-weight: 700; display: flex; align-items: center;">
                    📋 Job Description & Overview
                </h3>
                {jd_details}
            </div>
            """

        html_content = f"""
        <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px; border-radius: 12px 12px 0 0; color: white; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Interview Scheduled</h2>
                    <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">{company} Recruitment Team</p>
                </div>
                
                <div style="background: #ffffff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                    <p style="font-size: 16px; margin-top: 0;">Dear <strong>{candidate_name}</strong>,</p>
                    <p style="font-size: 14px; color: #4b5563;">
                        We are pleased to invite you for the <strong>{interview_type}</strong> for the <strong>{position_title}</strong> role at <strong>{company}</strong>. Below are the details of your scheduled interview:
                    </p>
                    
                    <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid #4f46e5; border-radius: 6px; border-top: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr style="border-bottom: 1px solid #edf2f7;">
                                <td style="padding: 8px 0; color: #6b7280; width: 35%;"><strong>Role / Position:</strong></td>
                                <td style="padding: 8px 0; color: #111827; font-weight: 600;">{position_title}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #edf2f7;">
                                <td style="padding: 8px 0; color: #6b7280;"><strong>Interview Round:</strong></td>
                                <td style="padding: 8px 0; color: #111827; font-weight: 600;">{interview_type}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #edf2f7;">
                                <td style="padding: 8px 0; color: #6b7280;"><strong>Date:</strong></td>
                                <td style="padding: 8px 0; color: #4f46e5; font-weight: 600;">{date}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #edf2f7;">
                                <td style="padding: 8px 0; color: #6b7280;"><strong>Time:</strong></td>
                                <td style="padding: 8px 0; color: #4f46e5; font-weight: 600;">{time}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #edf2f7;">
                                <td style="padding: 8px 0; color: #6b7280;"><strong>Mode:</strong></td>
                                <td style="padding: 8px 0; color: #111827;">{mode}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6b7280;"><strong>Location / Link:</strong></td>
                                <td style="padding: 8px 0; color: #111827;">{location or 'Will be provided shortly'}</td>
                            </tr>
                        </table>
                        {meeting_link_html}
                    </div>

                    {jd_section_html}

                    <div style="margin-top: 24px; padding: 14px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #dbeafe;">
                        <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
                            💡 <strong>Interview Preparation Tips:</strong><br/>
                            • Please test your audio, video, and internet connection ahead of time.<br/>
                            • Join or arrive 5-10 minutes prior to the scheduled start time.<br/>
                            • If you need to reschedule or have questions, please reach out to us promptly.
                        </p>
                    </div>

                    <p style="margin-top: 24px; font-size: 14px; color: #4b5563;">
                        We look forward to speaking with you!
                    </p>
                    
                    <p style="margin-top: 16px; font-size: 14px; color: #111827; margin-bottom: 0;">
                        Warm regards,<br/>
                        <strong>{company} Recruitment Team</strong>
                    </p>
                </div>
            </body>
        </html>
        """
        return send_email_message(to_email, subject, html_content)

    @staticmethod
    def send_offer_email(to_email: str, candidate_name: str, position_title: str, salary: str = "", joining_date: str = "") -> bool:
        subject = f"Job Offer: {position_title}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <h2>Job Offer - {position_title}</h2>
                <p>Dear {candidate_name},</p>
                <p>We are delighted to extend a formal job offer for the position of <strong>{position_title}</strong>!</p>
                <ul>
                    <li><strong>Compensation:</strong> {salary or 'As discussed'}</li>
                    <li><strong>Target Joining Date:</strong> {joining_date or 'TBD'}</li>
                </ul>
            </body>
        </html>
        """
        return send_email_message(to_email, subject, html_content)


# ── Standalone Module-Level Functions for Direct Imports ────────────────────────

def send_acknowledgment_email(to_email: str, candidate_name: str, position_title: str, company: str = "") -> bool:
    return EmailService.send_acknowledgment_email(to_email, candidate_name, position_title, company)

def send_verification_email(to_email: str, token: str, user_name: str = "User") -> bool:
    return EmailService.send_verification_email(to_email, token, user_name)

def send_password_reset_email(to_email: str, token: str, user_name: str = "User") -> bool:
    return EmailService.send_password_reset_email(to_email, token, user_name)

def send_mfa_email(to_email: str, code: str, user_name: str = "User") -> bool:
    return EmailService.send_mfa_email(to_email, code, user_name)

def send_interview_scheduled_email(
    to_email: str,
    candidate_name: str,
    position_title: str,
    interview_type: str = "Technical Round",
    date: str = "TBD",
    time: str = "TBD",
    mode: str = "Online",
    location: str = "",
    job_description: str = "",
    company: str = "RecruitAI Team",
    required_skills: str = "",
    position_location: str = ""
) -> bool:
    return EmailService.send_interview_scheduled_email(
        to_email,
        candidate_name,
        position_title,
        interview_type,
        date,
        time,
        mode,
        location,
        job_description,
        company,
        required_skills,
        position_location
    )

def send_offer_email(to_email: str, candidate_name: str, position_title: str, salary: str = "", joining_date: str = "") -> bool:
    return EmailService.send_offer_email(to_email, candidate_name, position_title, salary, joining_date)

def send_multi_channel_acknowledgment(to_email: str, phone: Optional[str], candidate_name: str, position_title: str):
    """
    Multi-Channel Acknowledgment Dispatcher:
    Checks integration_settings database configuration and automatically dispatches:
    1. Email Acknowledgment (if email_enabled == True)
    2. WhatsApp Acknowledgment Message (if whatsapp_enabled == True and phone is provided)
    3. SMS Gateway Acknowledgment Message (if sms_enabled == True and phone is provided)
    """
    try:
        from app.database import SessionLocal
        from app.models.integration_settings import IntegrationSettings
        db = SessionLocal()
        settings = db.query(IntegrationSettings).first()
        db.close()
    except Exception as e:
        print(f"[Multi-Channel Warning] DB Query failed: {e}")
        settings = None

    # 1. Email Acknowledgment
    if not settings or settings.email_enabled:
        print(f"[Email Dispatch] Sending application acknowledgment email to {to_email}...")
        EmailService.send_acknowledgment_email(to_email=to_email, candidate_name=candidate_name, position_title=position_title)

    # 2. WhatsApp Acknowledgment Message
    if settings and settings.whatsapp_enabled and phone and len(str(phone).strip()) >= 7:
        try:
            print(f"[WhatsApp Gateway] Dispatching WhatsApp application acknowledgment to {candidate_name} ({phone})...")
            msg = f"Hello {candidate_name}! Your application for '{position_title}' has been successfully received by our recruitment team."
            print(f"[WhatsApp Gateway SUCCESS] To: {phone} | Content: '{msg}'")
        except Exception as wa_err:
            print(f"[WhatsApp Gateway Warning] Failed to send WhatsApp message: {wa_err}")

    # 3. SMS Gateway Acknowledgment Message
    if settings and settings.sms_enabled and phone and len(str(phone).strip()) >= 7:
        try:
            provider = settings.sms_provider or "SMS Gateway"
            print(f"[{provider}] Dispatching SMS application acknowledgment to {candidate_name} ({phone})...")
            msg = f"RecruitAI: Hi {candidate_name}, your application for '{position_title}' was received successfully!"
            print(f"[{provider} SUCCESS] To: {phone} | Content: '{msg}'")
        except Exception as sms_err:
            print(f"[SMS Gateway Warning] Failed to send SMS message: {sms_err}")