import os
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

load_dotenv()

uri = os.getenv("MONGODB_URL")
print(f"Testing connection to: {uri.split('@')[-1]}")

try:
    client = MongoClient(
        uri,
        tls=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )
    # The 'admin' database is always there.
    client.admin.command('ping')
    print("\n✅ SUCCESS: Connection to MongoDB Atlas established!")
except Exception as e:
    print("\n❌ FAILED: Could not connect to MongoDB.")
    print(f"Error detail: {e}")
    print("\nSUGGESTION: This error usually means your IP is not whitelisted or your network is blocking the connection.")
