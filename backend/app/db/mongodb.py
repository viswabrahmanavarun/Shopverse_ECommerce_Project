from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.review import Review
from app.models.coupon import Coupon
from app.models.otp import OTP

import certifi

# Global client (optional but recommended)
client: AsyncIOMotorClient | None = None


async def init_db():
    global client

    # Create MongoDB client with proper TLS config
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tls=True,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=5000
    )

    # Get database
    db = client[settings.DATABASE_NAME]

    # Initialize Beanie
    await init_beanie(
        database=db,
        document_models=[
            User,
            Product,
            Order,
            Review,
            Coupon,
            OTP
        ],
        allow_index_dropping=True
    )

    print("✅ Database initialized successfully")


# Optional: close connection on shutdown
async def close_db():
    global client
    if client:
        client.close()
        print("❌ Database connection closed")