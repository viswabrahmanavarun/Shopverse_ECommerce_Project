import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.models.user import User
from app.models.order import Order

async def delete_admin_orders():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Order])
    
    user = await User.find_one(User.email == 'admin@shopifyx.com')
    if user:
        # Find all orders for this user
        orders = await Order.find(Order.user_id == str(user.id)).to_list()
        count = len(orders)
        for order in orders:
            await order.delete()
        print(f"✅ Successfully deleted {count} orders for admin@shopifyx.com")
    else:
        print("❌ User admin@shopifyx.com not found")

if __name__ == "__main__":
    asyncio.run(delete_admin_orders())
