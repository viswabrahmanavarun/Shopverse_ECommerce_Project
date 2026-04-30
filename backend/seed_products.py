import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
from dotenv import load_dotenv
from app.models.product import Product
from app.models.user import User

load_dotenv()

async def seed_products():
    """
    Manual seeding script. 
    Currently empty as per user request to manage catalog manually.
    """
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    await init_beanie(database=client.shopifyx, document_models=[Product, User])
    print("Seeding script is currently empty. Add products to CUSTOM_CATALOG if needed.")

if __name__ == "__main__":
    asyncio.run(seed_products())
