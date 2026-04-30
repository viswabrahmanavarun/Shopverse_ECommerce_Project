from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.user import User
from app.models.review import Review
from app.models.order import Order
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter()


@router.get("/{product_id}/can-review")
async def check_can_review(
    product_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Check if user has already reviewed
    existing = await Review.find_one(
        Review.product_id == product_id,
        Review.user_id == str(current_user.id)
    )
    if existing:
        return {"can_review": False, "reason": "already_reviewed"}

    # Check if user has a delivered order for this product
    order = await Order.find_one(
        Order.user_id == str(current_user.id),
        Order.order_status == "delivered",
        {"items.product_id": product_id}
    )
    
    if not order:
        return {"can_review": False, "reason": "not_purchased"}
        
    return {"can_review": True}


@router.post("/{product_id}/reviews", response_model=ReviewOut)
async def create_review(
    product_id: str,
    review_in: ReviewCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Prevent duplicate review by same user
    existing = await Review.find_one(
        Review.product_id == product_id,
        Review.user_id == str(current_user.id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")

    # Enforce purchase requirement
    order = await Order.find_one(
        Order.user_id == str(current_user.id),
        Order.order_status == "delivered",
        {"items.product_id": product_id}
    )
    if not order:
        raise HTTPException(status_code=403, detail="You can only review products you have purchased and received.")

    review = Review(
        product_id=product_id,
        user_id=str(current_user.id),
        user_name=current_user.full_name,
        rating=review_in.rating,
        title=review_in.title,
        body=review_in.body,
    )
    await review.insert()
    return {**review.dict(exclude={"id"}), "id": str(review.id)}


@router.get("/{product_id}/reviews", response_model=List[ReviewOut])
async def get_reviews(product_id: str) -> Any:
    reviews = await Review.find(Review.product_id == product_id).sort(-Review.created_at).to_list()
    return [{**r.dict(exclude={"id"}), "id": str(r.id)} for r in reviews]


@router.delete("/{product_id}/reviews/{review_id}")
async def delete_review(
    product_id: str,
    review_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    review = await Review.get(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await review.delete()
    return {"status": "deleted"}
