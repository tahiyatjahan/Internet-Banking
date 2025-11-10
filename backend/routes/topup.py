from decimal import Decimal, InvalidOperation
from typing import Any, Dict

from flask import jsonify, request

from database import db
from models import Account, Transaction, User
from . import api_bp


def _parse_amount(value: Any) -> Decimal:
	try:
		return Decimal(str(value)).quantize(Decimal("0.01"))
	except (InvalidOperation, TypeError, ValueError):
		raise ValueError("Invalid amount")


def _get_or_create_account(user_id: int) -> Account:
	user = User.query.get(user_id)
	if not user:
		raise ValueError("User not found")
	if user.account:
+		return user.account
	account = Account(user_id=user.id)
	db.session.add(account)
	db.session.flush()
	return account


def _mock_validate_card(payload: Dict[str, Any]) -> None:
	card_number = str(payload.get("cardNumber", "")).strip()
	expiry_month = str(payload.get("expiryMonth", "")).strip()
	expiry_year = str(payload.get("expiryYear", "")).strip()
	cvv = str(payload.get("cvv", "")).strip()
	if not (card_number and expiry_month and expiry_year and cvv):
		raise ValueError("Missing card details")
	if len(card_number) < 12 or len(card_number) > 19:
		raise ValueError("Invalid card number")
	if not (cvv.isdigit() and 3 <= len(cvv) <= 4):
		raise ValueError("Invalid CVV")


def _mock_validate_bank(payload: Dict[str, Any]) -> None:
	bank_name = str(payload.get("bankName", "")).strip()
	account_number = str(payload.get("accountNumber", "")).strip()
	routing_number = str(payload.get("routingNumber", "")).strip()
	if not (bank_name and account_number and routing_number):
		raise ValueError("Missing bank transfer details")
	if not (len(routing_number) in (9,)):
		raise ValueError("Invalid routing number")


@api_bp.post("/topup/card")
def topup_card():
	try:
		data = request.get_json(silent=True) or {}
		user_id = int(data.get("userId"))
		amount = _parse_amount(data.get("amount"))
		if amount <= 0:
			raise ValueError("Amount must be positive")
		_mock_validate_card(data)

		account = _get_or_create_account(user_id)
		account.balance = (account.balance or Decimal("0.00")) + amount
		txn = Transaction(account_id=account.id, type="CARD_TOPUP", amount=amount, reference="CARD")
		db.session.add(txn)
		db.session.commit()
		return jsonify({"success": True, "balance": str(account.balance), "transactionId": txn.id}), 201
	except Exception as exc:
		db.session.rollback()
		return jsonify({"success": False, "error": str(exc)}), 400


@api_bp.post("/topup/bank")
def topup_bank():
	try:
		data = request.get_json(silent=True) or {}
		user_id = int(data.get("userId"))
		amount = _parse_amount(data.get("amount"))
		if amount <= 0:
			raise ValueError("Amount must be positive")
		_mock_validate_bank(data)

		account = _get_or_create_account(user_id)
		account.balance = (account.balance or Decimal("0.00")) + amount
		txn = Transaction(account_id=account.id, type="BANK_TOPUP", amount=amount, reference="BANK")
		db.session.add(txn)
		db.session.commit()
		return jsonify({"success": True, "balance": str(account.balance), "transactionId": txn.id}), 201
	except Exception as exc:
		db.session.rollback()
		return jsonify({"success": False, "error": str(exc)}), 400


