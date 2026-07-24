import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class DealStatus(str, enum.Enum):
    active = "active"
    archived = "archived"

class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)
    status: Mapped[DealStatus] = mapped_column(
        Enum(DealStatus, name="dealstatus", native_enum=True),
        default=DealStatus.active,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationship back to the owner
    owner: Mapped["User"] = relationship("User", back_populates="deals")

    # Relationship to documents belonging to this deal
    documents: Mapped[list["Document"]] = relationship(
        "Document",
        back_populates="deal",
        cascade="all, delete-orphan",
    )

    # Relationship to messages belonging to this deal
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="deal",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )

