from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.user import User
from app.models.order import Order, StatusUpdate
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderOut, OrderUpdate
from app.services import payment

from datetime import datetime, timedelta
from collections import defaultdict
router = APIRouter()

@router.get("/stats")
async def get_order_stats(
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    # Get last 7 days of orders
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    orders = await Order.find(Order.created_at >= seven_days_ago).to_list()
    
    # Initialize days
    stats_map = {}
    for i in range(8):
        date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        stats_map[date] = {"revenue": 0, "orders": 0}
        
    for o in orders:
        date_str = o.created_at.strftime("%Y-%m-%d")
        if date_str in stats_map:
            if o.payment_status in ["paid", "cod"]:
                stats_map[date_str]["revenue"] += o.total_amount
            stats_map[date_str]["orders"] += 1
            
    # Format for recharts
    chart_data = []
    for date in sorted(stats_map.keys()):
        chart_data.append({
            "date": datetime.strptime(date, "%Y-%m-%d").strftime("%d %b"),
            "revenue": stats_map[date]["revenue"],
            "orders": stats_map[date]["orders"]
        })
        
    return chart_data


@router.post("/", response_model=OrderOut)
async def create_order(
    *,
    order_in: OrderCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    is_cod = order_in.payment_method == "cod"
    # Check stock and decrement

    for item in order_in.items:
        product = await Product.get(item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.name} not found")
        
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item.name}")
        
        # Atomically decrease stock
        await product.update({"$inc": {"stock": -item.quantity}})

    order = Order(
        **order_in.dict(exclude={"payment_method"}),
        user_id=str(current_user.id),
        payment_status="cod" if is_cod else "pending",
        order_status="processing",
        status_history=[StatusUpdate(status="processing", message="Order placed successfully")]
    )
    await order.insert()

    # If coupon used, increment usage count
    if order.coupon_code:
        from app.models.coupon import Coupon
        coupon = await Coupon.find_one(Coupon.code == order.coupon_code)
        if coupon:
            coupon.used_count += 1
            await coupon.save()


    # Only create Razorpay order for online payments
    if not is_cod:
        try:
            razorpay_order = payment.create_razorpay_order(order.total_amount)
            order.payment_id = razorpay_order["id"]
            await order.save()
        except Exception as e:
            print(f"Razorpay Error: {e}")

    return {
        **order.dict(exclude={"id"}),
        "id": str(order.id)
    }


@router.post("/{id}/verify-payment")
async def verify_payment(
    *,
    id: str,
    payment_data: dict,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    order = await Order.get(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    is_valid = payment.verify_payment_signature(
        payment_id=payment_data.get("razorpay_payment_id"),
        order_id=payment_data.get("razorpay_order_id"),
        signature=payment_data.get("razorpay_signature")
    )
    
    if is_valid:
        order.payment_status = "paid"
        order.order_status = "processing"
        order.status_history.append(StatusUpdate(status="processing", message="Payment confirmed online"))
        await order.save()
        return {"status": "success", "message": "Payment verified"}
    else:
        order.payment_status = "failed"
        await order.save()
        raise HTTPException(status_code=400, detail="Invalid payment signature")

@router.get("/me", response_model=List[OrderOut])
async def get_my_orders(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    orders = await Order.find(Order.user_id == str(current_user.id)).to_list()
    return [{**o.dict(exclude={"id"}), "id": str(o.id)} for o in orders]

@router.get("/", response_model=List[OrderOut])
async def get_all_orders(
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    orders = await Order.find_all().to_list()
    return [{**o.dict(exclude={"id"}), "id": str(o.id)} for o in orders]

@router.get("/{id}", response_model=OrderOut)
async def get_order(
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    order = await Order.get(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.user_id != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    return order

@router.put("/{id}", response_model=OrderOut)
async def update_order_status(
    *,
    id: str,
    order_update: OrderUpdate,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    order = await Order.get(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = order_update.dict(exclude_unset=True)
    
    if "order_status" in update_data:
        order.status_history.append(StatusUpdate(
            status=update_data["order_status"],
            message=f"Order status updated to {update_data['order_status']}"
        ))
        order.order_status = update_data["order_status"]
    
    if "payment_status" in update_data:
        order.payment_status = update_data["payment_status"]
    
    await order.save()
    
    # Reload to get fresh data
    order = await Order.get(id)
    return {**order.dict(exclude={"id"}), "id": str(order.id)}
