from fastapi import APIRouter
from app.api.v1.endpoints import auth, products, utils, orders, reviews, users, coupons, support

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(reviews.router, prefix="/products", tags=["reviews"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(coupons.router, prefix="/coupons", tags=["coupons"])
api_router.include_router(support.router, prefix="/support", tags=["support"])

