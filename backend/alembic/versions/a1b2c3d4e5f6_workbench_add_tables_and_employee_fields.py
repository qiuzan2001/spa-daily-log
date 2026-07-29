"""add workbench tables + employee fields

Revision ID: a1b2c3d4e5f6
Revises: 43c9855ab40e
Create Date: 2026-07-29 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "43c9855ab40e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Employee new columns
    op.add_column("work_log_employees", sa.Column("hire_date", sa.String(), server_default="", nullable=False))
    op.add_column("work_log_employees", sa.Column("leave_date", sa.String(), server_default="", nullable=False))
    op.add_column("work_log_employees", sa.Column("sort_order", sa.Integer(), server_default="9999", nullable=False))

    # Workbench work entries
    op.create_table(
        "work_log_work_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("worksheet_id", sa.Integer(), sa.ForeignKey("work_log_worksheets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("row_number", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.String(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("finish_early_five_minutes", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("calculated_end_time", sa.String(), server_default="", nullable=False),
        sa.Column("original_log", sa.Text(), server_default="", nullable=False),
        sa.Column("service_total", sa.Float(), server_default="0", nullable=False),
        sa.Column("payment_status", sa.String(), server_default="unpaid", nullable=False),
        sa.Column("tip_resolved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("status", sa.String(), server_default="completed", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("worksheet_id", "row_number", name="uq_work_log_work_entry_row"),
    )
    op.create_index("ix_work_log_work_entries_worksheet", "work_log_work_entries", ["worksheet_id"])

    # Workbench entry items
    op.create_table(
        "work_log_work_entry_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entry_id", sa.Integer(), sa.ForeignKey("work_log_work_entries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("service_id", sa.String(), nullable=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("shorthand", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), server_default="0", nullable=False),
        sa.Column("duration_minutes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_custom", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Payment entries
    op.create_table(
        "work_log_payment_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entry_id", sa.Integer(), sa.ForeignKey("work_log_work_entries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("method", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), server_default="0", nullable=False),
        sa.Column("recorded_at", sa.String(), server_default="", nullable=False),
        sa.Column("card_time", sa.String(), nullable=True),
        sa.Column("gift_card_number", sa.String(), nullable=True),
        sa.Column("gift_card_image", sa.Text(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Platform sync records
    op.create_table(
        "work_log_platform_syncs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("date", sa.String(), nullable=False),
        sa.Column("spa_platform_employee_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), server_default="pending", nullable=False),
        sa.Column("request_snapshot", sa.JSON(), nullable=True),
        sa.Column("response_snapshot", sa.JSON(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("date", "spa_platform_employee_id", name="uq_work_log_platform_sync_date_employee"),
    )


def downgrade() -> None:
    op.drop_table("work_log_platform_syncs")
    op.drop_table("work_log_payment_entries")
    op.drop_table("work_log_work_entry_items")
    op.drop_table("work_log_work_entries")
    op.drop_column("work_log_employees", "sort_order")
    op.drop_column("work_log_employees", "leave_date")
    op.drop_column("work_log_employees", "hire_date")