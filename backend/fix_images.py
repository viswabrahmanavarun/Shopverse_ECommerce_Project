import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
from dotenv import load_dotenv
from app.models.product import Product
from app.models.user import User

load_dotenv()

async def fix_images():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    await init_beanie(database=client.shopifyx, document_models=[Product, User])
    
    products = await Product.find_all().to_list()
    updated_count = 0
    
    for product in products:
        new_images = []
        changed = False
        for img in product.images:
            if "width=10" in img:
                new_img = img.replace("width=10", "width=1200")
                new_images.append(new_img)
                changed = True
            else:
                new_images.append(img)
        
        if changed:
            product.images = new_images
            await product.save()
            updated_count += 1
            print(f"Updated product: {product.name}")
            
    print(f"Total products updated: {updated_count}")

if __name__ == "__main__":
    asyncio.run(fix_images())
