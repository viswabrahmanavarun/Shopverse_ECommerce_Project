import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_otp_email(email_to: str, otp_code: str):
    if not all([settings.SMTP_USER, settings.SMTP_PASSWORD, settings.EMAILS_FROM_EMAIL]):
        print(f"SMTP settings not configured. OTP for {email_to} is: {otp_code}")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = f"{otp_code} is your Shopverse Verification Code"
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6d28d9; text-align: center;">Shopverse Verification</h2>
            <p>Hello,</p>
            <p>Your verification code is below. Please enter it to complete your request.</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; background: #f3f4f6; padding: 10px 20px; border-radius: 5px;">
                    {otp_code}
                </span>
            </div>
            <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2026 Shopverse. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    part = MIMEText(html, "html")
    message.attach(part)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, email_to, message.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
