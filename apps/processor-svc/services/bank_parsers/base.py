"""Abstract base class for bank-specific statement parsers."""

from abc import ABC, abstractmethod
from typing import Optional
import pandas as pd


class BankParser(ABC):
    """
    Every bank parser must implement:
      - detect(text)     → True if this parser can handle the statement
      - parse(pages)     → list of transaction dicts
      - get_account_info(text) → dict with account holder, number, etc.
    """

    BANK_NAME: str = "Unknown"

    @abstractmethod
    def detect(self, full_text: str) -> bool:
        """Return True if the raw text belongs to this bank's format."""
        ...

    @abstractmethod
    def parse(self, pages: list[dict]) -> list[dict]:
        """
        Accepts a list of page dicts (from pdfplumber), each containing:
          - 'text': raw page text
          - 'tables': list of extracted tables (list[list[str]])
        Returns a list of transaction dicts with keys:
          date, description, reference, debit, credit, balance
        """
        ...

    @abstractmethod
    def get_account_info(self, full_text: str) -> dict:
        """
        Extract account metadata from the full statement text.
        Returns: { account_holder, account_number, branch, period, ... }
        """
        ...

    def _clean_amount(self, value: Optional[str]) -> Optional[float]:
        """Helper to parse an amount string to float."""
        if not value or not str(value).strip():
            return None
        cleaned = str(value).strip().replace(",", "").replace("(", "-").replace(")", "")
        # Remove trailing Cr/Dr markers
        cleaned = cleaned.replace("Cr", "").replace("Dr", "").replace("CR", "").replace("DR", "").strip()
        try:
            return round(float(cleaned), 2)
        except (ValueError, TypeError):
            return None

    def _normalize_date(self, value: str) -> str:
        """Standardize date to DD/MM/YYYY format using pandas for robustness."""
        if not value:
            return ""
        try:
            # dayfirst=True is important for Indian bank statements
            dt = pd.to_datetime(value, dayfirst=True, errors='raise')
            return dt.strftime("%d/%m/%Y")
        except:
            return value

    def _standardize_transaction(self, txn: dict) -> dict:
        """Map internal keys to user's preferred labels."""
        return {
            "date": self._normalize_date(txn.get("date", "")),
            "Particulars": txn.get("description", ""),
            "Chq./Ref.No.": txn.get("reference", ""),
            "Withdrawal": txn.get("debit"),
            "Deposit": txn.get("credit"),
            "Balance": txn.get("balance"),
        }

    def _to_dataframe(self, transactions: list[dict]) -> pd.DataFrame:
        """Convert transaction list to a pandas DataFrame."""
        df = pd.DataFrame(transactions)
        for col in ["debit", "credit", "balance", "Withdrawl", "Deposit", "Balance"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
        return df

    @staticmethod
    def _is_amount_simple(str_val: str) -> bool:
        """Check if a string looks like a currency amount (e.g. 1,234.56)."""
        import re
        if not str_val:
            return False
        # Allow trailing Cr/Dr/CR/DR and handle optional thousands separators
        return bool(re.search(r'^\s*[+-]?[\d,]+\.\d{2}(?:\s*[CD]R)?\s*$', str_val, re.IGNORECASE))

    def _post_process_with_balance_inference(self, transactions: list[dict], opening_balance: float) -> list[dict]:
        """
        Infer withdrawal/deposit from balance changes if they are unassigned.
        Based on the provided logic for ICICI and HDFC.
        """
        if not transactions:
            return transactions
        
        prev_balance = opening_balance
        for txn in transactions:
            # We use '_unassigned' as a temporary key for amounts that need placement
            if "_unassigned" in txn and txn["_unassigned"] is not None:
                unassigned = txn["_unassigned"]
                closing = txn.get("Balance") or txn.get("balance") or 0.0
                diff = closing - prev_balance
                
                # Precision handling
                if diff > 0.01:
                    txn["credit"] = unassigned
                    txn["debit"] = 0.0
                elif diff < -0.01:
                    txn["debit"] = unassigned
                    txn["credit"] = 0.0
                else:
                    # In case of zero diff or precision issues, default to withdrawal (debit)
                    txn["debit"] = unassigned
                    txn["credit"] = 0.0
                
                del txn["_unassigned"]
            
            # Update prev_balance for next iteration
            prev_balance = txn.get("Balance") or txn.get("balance") or 0.0
        
        return transactions
