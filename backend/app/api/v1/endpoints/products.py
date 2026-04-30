from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api import deps
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter()

@router.get("/categories", response_model=List[str])
async def get_all_categories() -> Any:
    categories = await Product.distinct("category")
    return categories

@router.get("/search/suggestions")
async def search_suggestions(
    q: str = Query(..., min_length=1)
) -> Any:
    # Search by name with case-insensitive regex for autocomplete
    products = await Product.find({"name": {"$regex": q, "$options": "i"}}).limit(5).to_list()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "price": p.price,
            "image": p.image,
            "category": p.category
        } for p in products
    ]

@router.get("/", response_model=List[ProductOut])
async def get_products(
    categories: Optional[List[str]] = Query(None),
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "newest",  # newest | price_asc | price_desc
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    query_obj = {}
    
    if categories:
        # Some clients send a single string instead of a list, or comma-separated
        actual_categories = []
        for cat in categories:
            if "," in cat:
                actual_categories.extend([c.strip() for c in cat.split(",")])
            else:
                actual_categories.append(cat)
        
        if actual_categories:
            query_obj["category"] = {"$in": actual_categories}
    
    if brand:
        query_obj["brand"] = brand
    
    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        query_obj["price"] = price_query

    # Combine with search if present
    if search:
        query_obj["$text"] = {"$search": search}

    # Sorting
    sort_criteria = "-created_at"  # Default
    if sort_by == "price_asc":
        sort_criteria = "price"
    elif sort_by == "price_desc":
        sort_criteria = "-price"
    elif sort_by == "newest":
        sort_criteria = "-created_at"

    products = await Product.find(query_obj).sort(sort_criteria).skip(skip).limit(limit).to_list()
    
    return [
        {
            **p.dict(exclude={"id"}), 
            "id": str(p.id)
        } for p in products
    ]


@router.get("/{id}", response_model=ProductOut)
async def get_product(id: str) -> Any:
    product = await Product.get(id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        **product.dict(exclude={"id"}),
        "id": str(product.id)
    }

@router.post("/", response_model=ProductOut)
async def create_product(
    *,
    product_in: ProductCreate,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    product = Product(
        **product_in.dict(),
        seller_id=str(current_user.id)
    )
    await product.insert()
    return product

@router.put("/{id}", response_model=ProductOut)
async def update_product(
    *,
    id: str,
    product_in: ProductUpdate,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    product = await Product.get(id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_in.dict(exclude_unset=True)
    await product.set(update_data)
    return product

@router.delete("/{id}")
async def delete_product(
    *,
    id: str,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    product = await Product.get(id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await product.delete()
    return {"message": "Product deleted successfully"}
