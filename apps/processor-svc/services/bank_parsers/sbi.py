"""SBI (State Bank of India) statement parser."""

import re
from typing import Optional
from .base import BankParser


class SBIParser(BankParser):
    BANK_NAME = "SBI"

    # ── Detection ────────────────────────────────────────────
    def detect(self, full_text: str) -> bool:
        markers = ["state bank of india", "sbi ", "onlinesbi", "sbin"]
        text_lower = full_text.lower()
        return any(m in text_lower for m in markers)

    # ── Account Info ─────────────────────────────────────────
    def get_account_info(self, full_text: str) -> dict:
        info: dict = {"bank": self.BANK_NAME}

        acc_match = re.search(r"(?:Account\s*(?:No|Number)[.:\s]*)\s*(\d{8,18})", full_text, re.IGNORECASE)
        if acc_match:
            info["account_number"] = acc_match.group(1)

        name_match = re.search(r"(?:Name|Account\s*Holder)\s*[:\s]*([A-Z][A-Za-z\s.]+)", full_text)
        if name_match:
            info["account_holder"] = name_match.group(1).strip()

        branch_match = re.search(r"(?:Branch)\s*[:\s]*([A-Za-z\s]+?)(?:\n|$)", full_text, re.IGNORECASE)
        if branch_match:
            info["branch"] = branch_match.group(1).strip()

        period_match = re.search(
            r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(?:to|[-–])\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            full_text,
        )
        if period_match:
            info["period_from"] = period_match.group(1)
            info["period_to"] = period_match.group(2)

        return info

    # ── Parse Transactions ───────────────────────────────────
    def parse(self, pages: list[dict]) -> list[dict]:
        transactions: list[dict] = []

        for page in pages:
            tables = page.get("tables", [])
            for table in tables:
                if not table or len(table) < 2:
                    continue

                header_row = self._find_header_row(table)
                if header_row is None:
                    continue

                col_map = self._map_columns(table[header_row])

                for row in table[header_row + 1:]:
                    txn = self._parse_row(row, col_map)
                    if txn:
                        transactions.append(self._standardize_transaction(txn))

        return transactions

    def _find_header_row(self, table: list[list[str]]) -> Optional[int]:
        keywords = ["txn date", "date", "description", "narration", "debit", "credit", "balance", "ref"]
        for idx, row in enumerate(table):
            row_text = " ".join(str(c).lower() for c in row if c)
            matches = sum(1 for kw in keywords if kw in row_text)
            if matches >= 2:
                return idx
        return None

    def _map_columns(self, header: list[str]) -> dict:
        col_map: dict = {}
        for idx, col in enumerate(header):
            if not col:
                continue
            col_lower = str(col).lower().strip()
            if "date" in col_lower and "value" not in col_lower:
                col_map["date"] = idx
            elif any(k in col_lower for k in ["description", "narration", "particular"]):
                col_map["description"] = idx
            elif any(k in col_lower for k in ["ref", "chq", "cheque"]):
                col_map["reference"] = idx
            elif any(k in col_lower for k in ["debit", "withdrawal", "dr"]):
                col_map["debit"] = idx
            elif any(k in col_lower for k in ["credit", "deposit", "cr"]):
                col_map["credit"] = idx
            elif "balance" in col_lower:
                col_map["balance"] = idx
        return col_map

    def _parse_row(self, row: list[str], col_map: dict) -> Optional[dict]:
        if not col_map or "date" not in col_map:
            return None

        date_val = row[col_map["date"]] if col_map["date"] < len(row) else None
        if not date_val or not str(date_val).strip():
            return None

        date_str = str(date_val).strip()
        # Support dd/mm/yyyy, dd-mm-yyyy, dd-MMM-yyyy
        if not re.match(r"\d{1,2}[/-](?:\d{1,2}|[a-zA-Z]{3})[/-]\d{2,4}", date_str):
            return None

        txn = {
            "date": str(date_val).strip(),
            "description": str(row[col_map.get("description", 1)]).strip() if col_map.get("description") is not None and col_map["description"] < len(row) else "",
            "reference": str(row[col_map.get("reference", 2)]).strip() if col_map.get("reference") is not None and col_map["reference"] < len(row) else "",
            "debit": self._clean_amount(row[col_map["debit"]] if col_map.get("debit") is not None and col_map["debit"] < len(row) else None),
            "credit": self._clean_amount(row[col_map["credit"]] if col_map.get("credit") is not None and col_map["credit"] < len(row) else None),
            "balance": self._clean_amount(row[col_map["balance"]] if col_map.get("balance") is not None and col_map["balance"] < len(row) else None),
        }
        return txn
