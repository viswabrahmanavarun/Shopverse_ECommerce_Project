import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import certifi

async def fix_data():
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tls=True,
        tlsCAFile=certifi.where()
    )
    db = client[settings.DATABASE_NAME]
    
    # 1. Fix User Roles (collection name is 'users')
    users_result = await db["users"].update_many(
        {}, 
        {"$set": {"role": "admin"}}
    )
    print(f"✅ Updated {users_result.modified_count} users to Admin.")
    
    # 2. Fix Product Stock (collection name is 'products')
    products_result = await db["products"].update_many(
        {}, 
        {"$set": {"stock": 50}}
    )
    print(f"✅ Updated {products_result.modified_count} products to 50 stock.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_data())
