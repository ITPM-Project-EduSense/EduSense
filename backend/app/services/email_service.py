import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    async def send_password_reset_email(email: str, reset_token: str, user_name: str = ""):
        """Send password reset email"""
        try:
            # Build reset link
            reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Reset Your EduSense Password"
            msg["From"] = settings.FROM_EMAIL
            msg["To"] = email

            # HTML body
            html_body = f"""
            <html>
              <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #4F46E5;">Password Reset Request</h2>
                  
                  <p>Hi {user_name or 'Student'},</p>
                  
                  <p>We received a request to reset your EduSense password. 
                  Click the button below to create a new password.</p>
                  
                  <p style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                      Reset Password
                    </a>
                  </p>
                  
                  <p style="font-size: 12px; color: #666;">
                    Or copy and paste this link: <br/>
                    {reset_link}
                  </p>
                  
                  <p style="font-size: 12px; color: #999; margin-top: 30px;">
                    This link will expire in {settings.RESET_TOKEN_EXPIRE_HOURS} hours.
                    <br/>
                    If you didn't request this, please ignore this email.
                  </p>
                </div>
              </body>
            </html>
            """

            part = MIMEText(html_body, "html")
            msg.attach(part)

            # Send email
            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)

            logger.info(f"Password reset email sent to {email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")
            # Don't raise error, just log it
            return False

    @staticmethod
    async def send_password_reset_confirmation(email: str, user_name: str = ""):
        """Send confirmation email after password reset"""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Your EduSense Password Has Been Reset"
            msg["From"] = settings.FROM_EMAIL
            msg["To"] = email

            html_body = f"""
            <html>
              <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #4F46E5;">Password Reset Successful</h2>
                  
                  <p>Hi {user_name or 'Student'},</p>
                  
                  <p>Your password has been successfully reset. You can now log in with your new password.</p>
                  
                  <p style="text-align: center; margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/login" 
                       style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                      Back to Login
                    </a>
                  </p>
                  
                  <p style="font-size: 12px; color: #999; margin-top: 30px;">
                    If you didn't make this change, please contact support immediately.
                  </p>
                </div>
              </body>
            </html>
            """

            part = MIMEText(html_body, "html")
            msg.attach(part)

            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)

            logger.info(f"Password reset confirmation sent to {email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send confirmation email: {str(e)}")
            return False
