import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.models.user import User, UserRole

async def fix_roles():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User])
    
    # List of users who should definitely NOT be admin
    to_downgrade = ["vijju@gmail.com", "tester@example.com"]
    
    for email in to_downgrade:
        user = await User.find_one(User.email == email)
        if user:
            user.role = UserRole.CUSTOMER
            await user.save()
            print(f"✅ Downgraded {email} to CUSTOMER")
        else:
            print(f"❓ User {email} not found")

if __name__ == "__main__":
    asyncio.run(fix_roles())
