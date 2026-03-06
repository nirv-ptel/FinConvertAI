"""JSON Exporter — Converts parsed transactions to JSON bytes."""

import json


def export_json(transactions: list[dict], account_info: dict = None) -> bytes:
    """Convert transaction list to JSON file bytes."""
    output = {
        "account_info": account_info or {},
        "transactions": transactions,
        "total_transactions": len(transactions),
    }
    return json.dumps(output, indent=2, ensure_ascii=False, default=str).encode("utf-8")
