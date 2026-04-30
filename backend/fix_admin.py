import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
from dotenv import load_dotenv
from app.models.user import User, UserRole
from app.core.security import get_password_hash

load_dotenv()

async def fix_admin():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    await init_beanie(database=client.shopifyx, document_models=[User])
    
    admin_email = "admin@shopifyx.com"
    admin = await User.find_one(User.email == admin_email)
    
    if not admin:
        print(f"Admin {admin_email} not found. Creating...")
        admin = User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),
            full_name="System Admin",
            role=UserRole.ADMIN,
            is_active=True
        )
        await admin.insert()
        print("Admin created successfully.")
    else:
        print(f"Admin found. Current role: {admin.role}")
        if admin.role != UserRole.ADMIN:
            print("Fixing role to ADMIN...")
            admin.role = UserRole.ADMIN
            await admin.save()
            print("Role fixed.")
        else:
            print("Admin already has correct role.")

if __name__ == "__main__":
    asyncio.run(fix_admin())
