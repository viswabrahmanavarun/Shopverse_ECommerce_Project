def send_otp_sms(phone_number: str, otp_code: str):
    # In a real app, you'd use Twilio, AWS SNS, etc.
    # For now, we'll just mock it and print to console.
    print(f"📱 SMS SENT TO {phone_number}: Your Shopverse verification code is {otp_code}. Valid for 10 minutes.")
    return True
