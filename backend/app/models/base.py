# Import Base and all models here so that Alembic's env.py
# can discover them via target_metadata = Base.metadata
from app.core.database import Base
from app.models.user import User
from app.models.deal import Deal
from app.models.document import Document
