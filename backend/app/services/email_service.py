"""
Email Service - Phase 11A

SMTP integration for sending verification emails.
Currently using console logging (mock).

Phase 11A: Respects EMAIL_ENABLED config (disabled in integration test mode).
Production: Update with real SMTP credentials.
"""

import os
from typing import Optional
from app import config

class EmailService:
    """Email sending service"""

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "noreply@chatkit.com")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@chatkit.com")
        self.base_url = os.getenv("BASE_URL", "http://localhost:3000")
        self.email_enabled = config.EMAIL_ENABLED

    async def send_verification_email(self, to_email: str, token: str) -> bool:
        """
        Send email verification link.

        Production TODO:
        - Import smtplib, email.mime
        - Create MIME multipart message
        - Connect to SMTP server
        - Send email
        - Return success/failure

        Current: Mock implementation (console log)
        """
        verification_link = f"{self.base_url}/verify?token={token}"

        # Mock email template
        email_html = f"""
        <html>
        <body>
            <h2>Verify Your Email</h2>
            <p>Thank you for signing up! Please click the link below to verify your email:</p>
            <p><a href="{verification_link}">Verify Email</a></p>
            <p>Or copy this link: {verification_link}</p>
            <p>This link expires in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        </body>
        </html>
        """

        # Phase 11A: Skip email sending in integration test mode
        if not self.email_enabled:
            # Phase 12 (11C): Only log token in test mode
            print(f"🧪 EMAIL SKIPPED (Integration Test Mode) - Token: {token}")
            return True

        # Console log (mock) - Phase 12 (11C): Don't log tokens in production
        print("=" * 80)
        print("📧 EMAIL SENT (Mock)")
        print("=" * 80)
        print(f"To: {to_email}")
        print(f"From: {self.from_email}")
        print(f"Subject: Verify Your Email")
        # Phase 12 (11C): Don't log token in production (security)
        if config.INTEGRATION_TEST_MODE:
            print(f"Token: {token}")
            print(f"Link: {verification_link}")
        else:
            print(f"Token: [REDACTED - check email for verification link]")
            print(f"Link: [REDACTED - check email]")
        print("=" * 80)
        # Phase 12 (11C): Don't log HTML body in production (may contain token)
        if config.INTEGRATION_TEST_MODE:
            print("HTML Body:")
            print(email_html)
            print("=" * 80)
        else:
            print("HTML Body: [REDACTED]")
            print("=" * 80)

        # Production implementation:
        # try:
        #     import smtplib
        #     from email.mime.multipart import MIMEMultipart
        #     from email.mime.text import MIMEText
        #
        #     msg = MIMEMultipart('alternative')
        #     msg['Subject'] = "Verify Your Email"
        #     msg['From'] = self.from_email
        #     msg['To'] = to_email
        #
        #     html_part = MIMEText(email_html, 'html')
        #     msg.attach(html_part)
        #
        #     with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
        #         server.starttls()
        #         server.login(self.smtp_user, self.smtp_password)
        #         server.send_message(msg)
        #
        #     return True
        # except Exception as e:
        #     print(f"❌ Email failed: {e}")
        #     return False

        return True  # Mock always succeeds

# Singleton instance
email_service = EmailService()
