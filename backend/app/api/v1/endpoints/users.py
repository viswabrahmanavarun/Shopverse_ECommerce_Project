from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.user import User, UserAddress
from app.schemas.user import UserAddressCreate, UserAddressOut, UserOut

router = APIRouter()

@router.get("/addresses", response_model=List[UserAddressOut])
async def get_addresses(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return current_user.addresses

@router.post("/addresses", response_model=UserAddressOut)
async def add_address(
    address_in: UserAddressCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    new_address = UserAddress(**address_in.dict())
    
    if new_address.is_default:
        for addr in current_user.addresses:
            addr.is_default = False
            
    current_user.addresses.append(new_address)
    await current_user.save()
    return new_address

@router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    address_to_remove = None
    for addr in current_user.addresses:
        if addr.id == address_id:
            address_to_remove = addr
            break
            
    if not address_to_remove:
        raise HTTPException(status_code=404, detail="Address not found")
        
    current_user.addresses.remove(address_to_remove)
    await current_user.save()
    return {"message": "Address deleted"}

@router.put("/addresses/{address_id}/default")
async def set_default_address(
    address_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    found = False
    for addr in current_user.addresses:
        if addr.id == address_id:
            addr.is_default = True
            found = True
        else:
            addr.is_default = False
            
    if not found:
        raise HTTPException(status_code=404, detail="Address not found")
        
    await current_user.save()
    return {"message": "Default address updated"}
