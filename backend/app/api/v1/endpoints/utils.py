from fastapi import APIRouter, UploadFile, File, Depends
from app.services import cloudinary
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.post("/upload", response_model=str)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_seller),
):
    url = cloudinary.upload_image(file.file)
    return url
