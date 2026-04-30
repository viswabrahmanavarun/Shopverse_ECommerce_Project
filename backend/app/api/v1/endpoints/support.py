import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.user import User
from app.core.config import settings
from typing import Any, List
import os

# Router
router = APIRouter()

SYSTEM_PROMPT = """
You are "Shopverse AI", a helpful and premium customer support assistant for Shopverse, an elite eCommerce platform.
Your goal is to assist customers with their shopping experience, provide product information, and answer questions about orders, shipping, and coupons.

Tone: Professional, friendly, and enthusiastic. Use emojis occasionally for a modern feel. ✨

Platform context:
- Name: Shopverse
- Categories: Electronics, Footwear, Men's Fashion, Women's Fashion, Accessories, Smart Watches.
- Features: Product Comparison, Wishlist, Coupon Discounts, Fast Delivery, Secure Payments (Razorpay).
- Support Hours: 24/7.

If asked about specific orders or complex issues, advise them to check their "My Orders" section or wait for a human agent.
Keep responses concise and helpful.
"""

@router.post("/chat")
async def chat_with_support(
    data: dict,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    message = data.get("message")
    history = data.get("history", []) # List of {role: "user"|"model", parts: [text]}

    if not settings.GOOGLE_API_KEY:
        return {"reply": "I'm currently in offline mode (API key missing). How can I help you manually? Shopverse is great!"}

    # Configure Gemini inside to ensure it uses the current key
    key = settings.GOOGLE_API_KEY.strip()
    genai.configure(api_key=key)

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        chat = model.start_chat(history=history)
        
        # Include system prompt in the first message if history is empty
        full_message = f"{SYSTEM_PROMPT}\n\nCustomer: {message}" if not history else message
        
        response = chat.send_message(full_message)
        reply_text = response.text if response.parts else "I'm sorry, I cannot respond to that message due to safety guidelines."
        
        return {
            "reply": reply_text,
            "history": history + [
                {"role": "user", "parts": [message]},
                {"role": "model", "parts": [reply_text]}
            ]
        }
    except Exception as e:
        print(f"Gemini error: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to AI support")
