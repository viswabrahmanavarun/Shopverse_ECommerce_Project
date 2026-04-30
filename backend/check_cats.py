import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import certifi

async def check_categories():
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tls=True,
        tlsCAFile=certifi.where()
    )
    db = client[settings.DATABASE_NAME]
    
    # Get unique categories
    categories = await db["products"].distinct("category")
    print(f"📊 Unique categories in database: {categories}")
    
    # Sample product to see case
    sample = await db["products"].find_one({})
    if sample:
        print(f"📄 Sample Product Category: '{sample.get('category')}'")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_categories())
