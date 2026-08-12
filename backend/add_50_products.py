import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
import random
from dotenv import load_dotenv
from app.models.product import Product
from app.models.user import User

load_dotenv()

CATEGORIES = [
    "Electronics", "Mobiles", "Footwear", "Men's Fashion", 
    "Women's Fashion", "Smart Watches", "Televisions", "Accessories"
]

BRANDS = ["Apple", "Samsung", "Nike", "Adidas", "Sony", "LG", "Zara", "Puma", "Dell", "HP"]

ADJECTIVES = ["Premium", "Sleek", "Durable", "Modern", "Classic", "Elegant", "High-Performance", "Compact", "Advanced", "Stylish"]

NOUNS = {
    "Electronics": ["Laptop", "Tablet", "Headphones", "Speaker", "Camera", "Drone"],
    "Mobiles": ["Smartphone", "Phablet", "Foldable Phone", "Gaming Phone"],
    "Footwear": ["Sneakers", "Running Shoes", "Boots", "Sandals", "Loafers"],
    "Men's Fashion": ["T-Shirt", "Jeans", "Jacket", "Suit", "Shirt"],
    "Women's Fashion": ["Dress", "Handbag", "Skirt", "Blouse", "Heels"],
    "Smart Watches": ["Smartwatch", "Fitness Tracker", "Sport Watch"],
    "Televisions": ["OLED TV", "QLED TV", "4K Smart TV", "8K Display"],
    "Accessories": ["Sunglasses", "Wallet", "Belt", "Backpack", "Cap"]
}

async def generate_products():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    await init_beanie(database=client.shopifyx, document_models=[Product, User])
    
    admin = await User.find_one({"email": "admin@shopifyx.com"})
    seller_id = str(admin.id) if admin else "dummy_seller_id"

    products_to_insert = []
    
    for i in range(50):
        category = random.choice(CATEGORIES)
        brand = random.choice(BRANDS)
        adj = random.choice(ADJECTIVES)
        noun = random.choice(NOUNS[category])
        name = f"{brand} {adj} {noun} {random.randint(100, 999)}"
        
        description = f"This is a {adj.lower()} {noun.lower()} by {brand}. It features state-of-the-art design and excellent build quality, perfect for everyday use."
        price = round(random.uniform(500, 100000), 2)
        stock = random.randint(10, 500)
        
        images = [
            f"https://picsum.photos/seed/{random.randint(1, 10000)}/800/600",
            f"https://picsum.photos/seed/{random.randint(1, 10000)}/800/600"
        ]
        
        product = Product(
            name=name,
            brand=brand,
            description=description,
            price=price,
            category=category,
            images=images,
            stock=stock,
            seller_id=seller_id
        )
        products_to_insert.append(product)

    await Product.insert_many(products_to_insert)
    print(f"Successfully inserted {len(products_to_insert)} dummy products.")

if __name__ == "__main__":
    asyncio.run(generate_products())
