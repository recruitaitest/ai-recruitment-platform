import os

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType


conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True") == "True",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False") == "True",
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME"),
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


async def send_verification_email(
    email: str,
    name: str,
    verification_link: str,
):
    html = f"""
    <html>
    <body>
        <h2>Welcome to RecruitAI</h2>

        <p>Hello <b>{name}</b>,</p>

        <p>
            Thank you for signing up.
        </p>

        <p>
            Please click the button below to verify your email address.
        </p>

        <p>
            <a href="{verification_link}"
               style="
                    background:#2563eb;
                    color:white;
                    padding:12px 24px;
                    text-decoration:none;
                    border-radius:6px;
               ">
               Verify Email
            </a>
        </p>

        <p>
            This link will expire in 24 hours.
        </p>

        <p>
            RecruitAI Team
        </p>

    </body>
    </html>
    """

    message = MessageSchema(
        subject="Verify your RecruitAI account",
        recipients=[email],
        body=html,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)

    await fm.send_message(message)
    
async def send_password_reset_email(
    email: str,
    name: str,
    reset_link: str,
):
    html = f"""
    <html>
    <body>
        <h2>RecruitAI Password Reset</h2>

        <p>Hello <b>{name}</b>,</p>

        <p>
            We received a request to reset your password.
        </p>

        <p>
            Click the button below to create a new password.
        </p>

        <p>
            <a href="{reset_link}"
               style="
                    background:#dc2626;
                    color:white;
                    padding:12px 24px;
                    text-decoration:none;
                    border-radius:6px;
               ">
               Reset Password
            </a>
        </p>

        <p>
            This link expires in <b>1 hour</b>.
        </p>

        <p>
            If you didn't request this password reset, you can safely ignore this email.
        </p>

        <br>

        <p>
            RecruitAI Team
        </p>

    </body>
    </html>
    """

    message = MessageSchema(
        subject="Reset your RecruitAI password",
        recipients=[email],
        body=html,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)

    await fm.send_message(message)

async def send_interview_scheduled_email(
    email: str,
    name: str,
    interview_type: str,
    interview_mode: str,
    date: str,
    time: str,
    location_or_link: str,
):
    html = f"""
    <html>
    <body>
        <h2>RecruitAI Interview Scheduled</h2>

        <p>Hello <b>{name}</b>,</p>

        <p>
            Your <b>{interview_type}</b> interview has been scheduled.
        </p>

        <p>
            <b>Date:</b> {date} <br/>
            <b>Time:</b> {time} <br/>
            <b>Mode:</b> {interview_mode} <br/>
            <b>Location/Link:</b> <a href="{location_or_link}">{location_or_link}</a>
        </p>

        <p>
            Please ensure you are prepared and on time. We look forward to speaking with you!
        </p>

        <br>
        <p>
            RecruitAI Team
        </p>
    </body>
    </html>
    """

    message = MessageSchema(
        subject=f"Interview Scheduled: {interview_type}",
        recipients=[email],
        body=html,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)

    await fm.send_message(message)

async def send_offer_email(
    email: str,
    name: str,
    position: str,
    salary: str,
    employment_type: str,
    joining_date: str,
    expiry_date: str,
    offer_letter_path: str,
):
    html = f"""
    <html>
    <body>
        <h2>Job Offer: {position}</h2>

        <p>Dear <b>{name}</b>,</p>

        <p>
            We are thrilled to offer you the position of <b>{position}</b> at our company.
        </p>

        <p>
            <b>Salary:</b> {salary} <br/>
            <b>Employment Type:</b> {employment_type} <br/>
            <b>Expected Joining Date:</b> {joining_date} <br/>
        </p>

        <p>
            Please find your official offer letter attached to this email. You can review the details and sign it. This offer is valid until <b>{expiry_date}</b>.
        </p>

        <p>
            We look forward to having you on the team!
        </p>

        <br>
        <p>
            RecruitAI Team
        </p>
    </body>
    </html>
    """

    message = MessageSchema(
        subject=f"Job Offer for {position}",
        recipients=[email],
        body=html,
        subtype=MessageType.html,
        attachments=[offer_letter_path] if os.path.exists(offer_letter_path) else []
    )

    fm = FastMail(conf)

    await fm.send_message(message)