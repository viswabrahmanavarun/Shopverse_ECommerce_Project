from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.user import User
from app.models.coupon import Coupon
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Any])
async def get_coupons(
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    return await Coupon.find_all().to_list()

@router.post("/")
async def create_coupon(
    coupon_in: dict,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    coupon = Coupon(**coupon_in)
    await coupon.insert()
    return coupon

@router.get("/active")
async def list_active_coupons(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List all active coupons available for customers."""
    return await Coupon.find(Coupon.is_active == True, Coupon.expiry_date > datetime.utcnow()).to_list()

@router.post("/validate")
async def validate_coupon(
    data: dict,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    code = data.get("code")
    cart_total = data.get("cart_total", 0)
    items = data.get("items", []) # List of {product_id, price, quantity}
    
    coupon = await Coupon.find_one(Coupon.code == code, Coupon.is_active == True)
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid or expired coupon code")
        
    if coupon.expiry_date < datetime.utcnow():
        coupon.is_active = False
        await coupon.save()
        raise HTTPException(status_code=400, detail="Coupon has expired")
        
    if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
        
    if cart_total < coupon.min_purchase_amount:
        raise HTTPException(status_code=400, detail=f"Minimum purchase of ₹{coupon.min_purchase_amount} required")
        
    discount = 0
    if coupon.product_id:
        # Product specific coupon
        target_item = next((item for item in items if item.get("product_id") == coupon.product_id), None)
        if not target_item:
             # Find product name for better error message
             raise HTTPException(status_code=400, detail="This coupon is only valid for a specific product not in your cart")
        
        item_total = target_item.get("price", 0) * target_item.get("quantity", 1)
        if coupon.discount_type == "percentage":
            discount = (coupon.discount_value / 100) * item_total
        else:
            discount = coupon.discount_value
    else:
        # Cart wide coupon
        if coupon.discount_type == "percentage":
            discount = (coupon.discount_value / 100) * cart_total
            if coupon.max_discount_amount:
                discount = min(discount, coupon.max_discount_amount)
        else:
            discount = coupon.discount_value
        
    return {
        "code": coupon.code,
        "discount_amount": discount,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "product_id": coupon.product_id
    }

@router.delete("/{id}")
async def delete_coupon(
    id: str,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    coupon = await Coupon.get(id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    await coupon.delete()
    return {"message": "Coupon deleted"}
