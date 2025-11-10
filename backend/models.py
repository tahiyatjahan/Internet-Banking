from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import db


class User(db.Model):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
	email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
	full_name: Mapped[str] = mapped_column(String(255), nullable=False)
	created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

	account: Mapped["Account"] = relationship(back_populates="user", uselist=False)


class Account(db.Model):
	__tablename__ = "accounts"

	id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
	balance: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"), nullable=False)
	currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
	updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

	user: Mapped[User] = relationship(back_populates="account")
	transactions: Mapped[list["Transaction"]] = relationship(back_populates="account", cascade="all, delete-orphan")


class Transaction(db.Model):
	__tablename__ = "transactions"

	id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
	account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False, index=True)
	type: Mapped[str] = mapped_column(String(32), nullable=False)  # e.g., 'CARD_TOPUP', 'BANK_TOPUP'
	amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
	reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
	created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

	account: Mapped[Account] = relationship(back_populates="transactions")


