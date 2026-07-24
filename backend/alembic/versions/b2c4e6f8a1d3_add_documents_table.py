"""add_documents_table

Revision ID: b2c4e6f8a1d3
Revises: a81f3d64c1b2
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b2c4e6f8a1d3'
down_revision: Union[str, None] = 'a81f3d64c1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the documentstatus enum type first if it doesn't exist
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'documentstatus') THEN
                CREATE TYPE documentstatus AS ENUM ('pending', 'processing', 'ready', 'failed');
            END IF;
        END
        $$;
        """
    )


    op.create_table(
        'documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('deal_id', sa.UUID(), nullable=False),
        sa.Column('filename', sa.String(length=512), nullable=False),
        sa.Column('file_type', sa.String(length=16), nullable=False),
        sa.Column(
            'status',
            postgresql.ENUM('pending', 'processing', 'ready', 'failed', name='documentstatus', create_type=False),
            nullable=False,
        ),



        sa.Column('storage_path', sa.String(length=1024), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['deal_id'], ['deals.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_documents_deal_id'), 'documents', ['deal_id'], unique=False)
    op.create_index(op.f('ix_documents_status'), 'documents', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_documents_status'), table_name='documents')
    op.drop_index(op.f('ix_documents_deal_id'), table_name='documents')
    op.drop_table('documents')
    op.execute("DROP TYPE IF EXISTS documentstatus;")
