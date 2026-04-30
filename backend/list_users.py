import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.models.user import User

async def list_users():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User])
    users = await User.find_all().to_list()
    for u in users:
        print(f"Email: {u.email}, Name: {u.full_name}, Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(list_users())
