import razorpay
from app.core.config import settings

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

def create_razorpay_order(amount: float, currency: str = "INR"):
    """
    Amount should be in INR (not paisa). We convert it to paisa here.
    """
    data = {
        "amount": int(amount * 100),
        "currency": currency,
        "payment_capture": 1
    }
    order = client.order.create(data=data)
    return order

def verify_payment_signature(payment_id: str, order_id: str, signature: str):
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        return True
    except Exception:
        return False
