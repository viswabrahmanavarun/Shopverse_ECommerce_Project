from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.mongodb import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation Error: {exc.errors()}")
    print(f"Body: {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    
    # Seed Admin User
    from app.models.user import User
    from app.core import security
    
    admin_user = await User.find_one(User.email == "admin@shopifyx.com")
    if not admin_user:
        admin = User(
            full_name="System Admin",
            email="admin@shopifyx.com",
            hashed_password=security.get_password_hash("Admin@123"),
            role="admin",
            is_active=True,
            is_superuser=True
        )
        await admin.insert()
        print("Admin user created: admin@shopifyx.com / Admin@123")

@app.get("/")
async def root():
    return {"message": "Welcome to ShopifyX API"}

from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)
