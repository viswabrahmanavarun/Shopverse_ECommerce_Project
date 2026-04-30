import cloudinary
import cloudinary.uploader
from app.core.config import settings

if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET
    )

def upload_image(file) -> str:
    if not settings.CLOUDINARY_CLOUD_NAME:
        # Fallback for dev if no keys provided
        return "https://via.placeholder.com/400"
    
    result = cloudinary.uploader.upload(file)
    return result.get("secure_url")
