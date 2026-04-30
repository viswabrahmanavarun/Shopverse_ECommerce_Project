import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import certifi

async def make_admin():
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tls=True,
        tlsCAFile=certifi.where()
    )
    db = client[settings.DATABASE_NAME]
    users_collection = db["User"]
    
    # Update all users to be admin for development purposes, 
    # or target a specific email if you prefer.
    result = await users_collection.update_many(
        {}, 
        {"$set": {"role": "admin"}}
    )
    print(f"✅ Updated {result.modified_count} users to Admin role.")
    client.close()

if __name__ == "__main__":
    asyncio.run(make_admin())
