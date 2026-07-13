import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.deal import DealCreate, DealUpdate, DealOut
from app.services.deal import DealService

router = APIRouter(prefix="/deals", tags=["Deals"])

@router.post("", response_model=DealOut, status_code=status.HTTP_201_CREATED)
async def create_deal(
    payload: DealCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DealService.create(db, current_user.id, payload)

@router.get("", response_model=List[DealOut])
async def list_deals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DealService.list_by_owner(db, current_user.id)

@router.get("/{id}", response_model=DealOut)
async def get_deal(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deal = await DealService.get_by_id(db, id)
    
    # Return 404 (not 403) if a deal exists but belongs to another user
    if not deal or deal.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    return deal

@router.patch("/{id}", response_model=DealOut)
async def update_deal(
    id: uuid.UUID,
    payload: DealUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deal = await DealService.get_by_id(db, id)
    
    if not deal or deal.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
        
    return await DealService.update(db, deal, payload)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deal = await DealService.get_by_id(db, id)
    
    if not deal or deal.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
        
    await DealService.delete(db, deal)
    return None
