import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.deal import Deal
from app.schemas.deal import DealCreate, DealUpdate, DealOut

router = APIRouter(prefix="/deals", tags=["Deals"])

@router.post("", response_model=DealOut, status_code=status.HTTP_201_CREATED)
async def create_deal(
    payload: DealCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deal = Deal(
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description,
        status=payload.status
    )
    db.add(deal)
    await db.flush()
    return deal

@router.get("", response_model=List[DealOut])
async def list_deals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Deal).where(Deal.owner_id == current_user.id).order_by(Deal.created_at.desc())
    result = await db.execute(stmt)
    deals = result.scalars().all()
    return deals

@router.get("/{id}", response_model=DealOut)
async def get_deal(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Deal).where(Deal.id == id)
    result = await db.execute(stmt)
    deal = result.scalar_one_or_none()
    
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
    stmt = select(Deal).where(Deal.id == id)
    result = await db.execute(stmt)
    deal = result.scalar_one_or_none()
    
    if not deal or deal.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(deal, key, value)
        
    db.add(deal)
    await db.flush()
    return deal

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Deal).where(Deal.id == id)
    result = await db.execute(stmt)
    deal = result.scalar_one_or_none()
    
    if not deal or deal.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
        
    await db.delete(deal)
    await db.flush()
    return None
