import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
import random
from dotenv import load_dotenv
from app.models.product import Product
from app.models.user import User

load_dotenv()

async def update_images():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    await init_beanie(database=client.shopifyx, document_models=[Product, User])
    
    products = await Product.find_all().to_list()
    updated_count = 0
    
    category_mapping = {
        "Electronics": "electronics,gadget",
        "Mobiles": "smartphone,mobile",
        "Footwear": "shoes,sneakers",
        "Men's Fashion": "menswear,suit",
        "Women's Fashion": "womenswear,dress",
        "Smart Watches": "smartwatch,watch",
        "Televisions": "television,tv",
        "Accessories": "accessories,bag"
    }

    for product in products:
        keyword = category_mapping.get(product.category, "product")
        
        # generate 2 relevant images
        new_images = [
            f"https://loremflickr.com/800/600/{keyword}?lock={random.randint(1, 100000)}",
            f"https://loremflickr.com/800/600/{keyword}?lock={random.randint(1, 100000)}"
        ]
        product.images = new_images
        await product.save()
        updated_count += 1
            
    print(f"Total products updated: {updated_count}")

if __name__ == "__main__":
    asyncio.run(update_images())
