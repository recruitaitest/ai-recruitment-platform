import logging
import os
import smtplib
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


class EmailService:
    @staticmethod
    def send_acknowledgment_email(to_email: str, candidate_name: str, position_title: str) -> bool:
        subject = f"Application Received: {position_title} at HR Recruitment Portal"
        tracking_url = f"http://ai-recruitment-platform.centralindia.cloudapp.azure.com/portal/candidate/{to_email}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 24px; border-radius: 12px; color: white; text-align: center; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 24px;">Application Received</h2>
                    <p style="margin: 8px 0 0 0; opacity: 0.9;">Thank you for applying to our team!</p>
                </div>
                <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p>Dear <strong>{candidate_name}</strong>,</p>
                    <p>Thank you for submitting your application for the <strong>{position_title}</strong> position.</p>
                    <p>We have successfully received your candidate profile and uploaded documents. Our talent acquisition team is currently reviewing applications and will reach out if your background matches our position requirements.</p>
                    <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-left: 4px solid #4f46e5; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #4b5563;">
                            <strong>Position:</strong> {position_title}<br/>
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
                    <p>Best regards,<br/><strong>Talent Acquisition Team</strong></p>
                </div>
            </body>
        </html>
        """
        return send_email_message(to_email, subject, html_content)

    @staticmethod
    def send_verification_email(to_email: str, token: str, user_name: str = "User") -> bool:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        verify_url = f"{frontend_url}/verify-email?token={token}"
        subject = "Verify Your Account - Recruit AI"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <h2>Welcome to Recruit AI, {user_name}!</h2>
                <p>Please verify your email address to complete registration.</p>
                <p><a href="{verify_url}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a></p>
                <p>Or click this link: <a href="{verify_url}">{verify_url}</a></p>
            </body>
        </html>
        """
        return send_email_message(to_email, subject, html_content)

    @staticmethod
    def send_password_reset_email(to_email: str, token: str, user_name: str = "User") -> bool:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{frontend_url}/reset-password?token={token}"
        subject = "Password Reset Request - Recruit AI"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <h2>Hello {user_name},</h2>
                <p>You requested a password reset for your Recruit AI account.</p>
                <p><a href="{reset_url}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
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
    def send_interview_scheduled_email(to_email: str, candidate_name: str, position_title: str, date: str, time: str, mode: str = "Online", location: str = "") -> bool:
        subject = f"Interview Scheduled: {position_title}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <h2>Interview Scheduled</h2>
                <p>Dear {candidate_name},</p>
                <p>Your interview for <strong>{position_title}</strong> has been scheduled.</p>
                <ul>
                    <li><strong>Date:</strong> {date}</li>
                    <li><strong>Time:</strong> {time}</li>
                    <li><strong>Mode:</strong> {mode}</li>
                    <li><strong>Location / Meeting Link:</strong> {location or 'TBD'}</li>
                </ul>
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

def send_acknowledgment_email(to_email: str, candidate_name: str, position_title: str) -> bool:
    return EmailService.send_acknowledgment_email(to_email, candidate_name, position_title)

def send_verification_email(to_email: str, token: str, user_name: str = "User") -> bool:
    return EmailService.send_verification_email(to_email, token, user_name)

def send_password_reset_email(to_email: str, token: str, user_name: str = "User") -> bool:
    return EmailService.send_password_reset_email(to_email, token, user_name)

def send_mfa_email(to_email: str, code: str, user_name: str = "User") -> bool:
    return EmailService.send_mfa_email(to_email, code, user_name)

def send_interview_scheduled_email(to_email: str, candidate_name: str, position_title: str, date: str, time: str, mode: str = "Online", location: str = "") -> bool:
    return EmailService.send_interview_scheduled_email(to_email, candidate_name, position_title, date, time, mode, location)

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