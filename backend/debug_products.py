import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
from dotenv import load_dotenv
from app.models.product import Product
from app.models.user import User

load_dotenv()

async def list_products():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    await init_beanie(database=client.shopifyx, document_models=[Product, User])
    products = await Product.find_all().to_list()
    for p in products:
        print(f"ID: {p.id}")
        print(f"Name: {p.name}")
        print(f"Images: {p.images}")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(list_products())
