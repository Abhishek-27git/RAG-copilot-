import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal
from app.schemas.deal import DealCreate, DealUpdate

class DealService:
    @staticmethod
    async def get_by_id(db: AsyncSession, deal_id: uuid.UUID) -> Optional[Deal]:
        """
        Retrieve a deal by its UUID.
        """
        stmt = select(Deal).where(Deal.id == deal_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_owner(db: AsyncSession, owner_id: uuid.UUID) -> List[Deal]:
        """
        List all deals belonging to the specified owner, ordered by creation date descending.
        """
        stmt = select(Deal).where(Deal.owner_id == owner_id).order_by(Deal.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def create(db: AsyncSession, owner_id: uuid.UUID, payload: DealCreate) -> Deal:
        """
        Create a new deal workspace.
        """
        deal = Deal(
            owner_id=owner_id,
            name=payload.name,
            description=payload.description,
            status=payload.status
        )
        db.add(deal)
        await db.flush()  # Populates deal.id and timestamps
        return deal

    @staticmethod
    async def update(db: AsyncSession, deal: Deal, payload: DealUpdate) -> Deal:
        """
        Update deal attributes based on payload.
        """
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(deal, key, value)
        db.add(deal)
        await db.flush()
        return deal

    @staticmethod
    async def delete(db: AsyncSession, deal: Deal) -> None:
        """
        Delete a deal workspace.
        """
        await db.delete(deal)
        await db.flush()
