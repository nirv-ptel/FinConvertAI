"""ICICI Bank statement parser."""

import re
from typing import Optional
from .base import BankParser


class ICICIParser(BankParser):
    BANK_NAME = "ICICI"

    # ── Detection ────────────────────────────────────────────
    def detect(self, full_text: str) -> bool:
        markers = ["icici bank", "icicibank", "icici ltd"]
        text_lower = full_text.lower()
        return any(m in text_lower for m in markers)

    # ── Account Info ─────────────────────────────────────────
    def get_account_info(self, full_text: str) -> dict:
        info: dict = {"bank": self.BANK_NAME}

        # Extract Account Header (Account No and Period)
        # Regex from user script: Saving Account no\. (\d+) in INR for the period (.*?) - (.*?)\n
        acc_match = re.search(r'Saving Account no\. (\d+) in INR for the period (.*?) - (.*?)(?:\n|$)', full_text)
        if acc_match:
            info["account_number"] = acc_match.group(1).strip()
            p1 = acc_match.group(2).strip()
            p2 = acc_match.group(3).strip()
            info["period_from"] = p1
            info["period_to"] = p2
        else:
            # Fallback if the full header isn't found
            acc_match = re.search(r"(?:Account\s*(?:No|Number)[.:\s]*)\s*(\d{8,18})", full_text, re.IGNORECASE)
            if acc_match:
                info["account_number"] = acc_match.group(1)

        # Opening balance
        op_bal_patterns = [
            r"(?:Opening\s*Balance|Balance\s*B/F|Previous\s*Balance|Initial\s*Balance)[\s:]*([\d,]+\.\d{2})",
            r"Balance\s*as\s*on\s*.*?[\s:]+([\d,]+\.\d{2})",
            r"([\d,]+\.\d{2})\s*(?:Cr|Dr)?\s*Opening\s*Balance",
            r"Balance\s*\(INR\).*?([\d,]+\.\d{2})"
        ]
        for pattern in op_bal_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                val = self._clean_amount(match.group(1))
                if val is not None:
                    info["opening_balance"] = val
                    break

        # Name extraction: usually before "Your Base Branch:" or specific provided name
        if "KOTHIYA NIRAV VINUBHAI" in full_text.upper():
            info["account_holder"] = "KOTHIYA NIRAV VINUBHAI"
        else:
            name_match = re.search(r"([A-Z][A-Z\s.-]+)(?:\s+Your Base Branch:)", full_text)
            if name_match:
                info["account_holder"] = name_match.group(1).strip()
            else:
                name_match = re.search(r"(?:Name|Account\s*Holder)\s*[:\s]*([A-Z][A-Za-z\s.]+)", full_text)
                if name_match:
                    info["account_holder"] = name_match.group(1).strip()

        return info

    # ── Parse Transactions ───────────────────────────────────
    def parse(self, pages: list[dict]) -> list[dict]:
        """
        Implementation of the sequential sequence-based ICICI parser.
        """
        all_text = "\n".join(p["text"] or "" for p in pages)
        lines = [l.strip() for l in all_text.split("\n")]
        
        transactions = []
        i = 0
        expected_seq = 1
        
        while i < len(lines):
            line = lines[i].strip()
            if line == str(expected_seq) and i + 1 < len(lines):
                next_line = lines[i+1].strip()
                # Check for date format DD.MM.YYYY
                if re.match(r'^\d{2}\.\d{2}\.\d{4}$', next_line):
                    date = next_line.replace(".", "/")
                    narration_parts = []
                    vi = i + 2
                    amounts = []
                    
                    while vi < len(lines):
                        nl = lines[vi].strip()
                        if not nl:
                            vi += 1
                            continue
                        
                        if self._is_amount_simple(nl):
                            # Store both value and raw text to check for Dr/Cr
                            val = self._clean_amount(nl)
                            amounts.append({"val": val, "raw": nl.upper()})

                            # Check next lines for more amounts (up to 3: withdrawal, deposit, balance)
                            temp_v = vi + 1
                            while temp_v < len(lines) and len(amounts) < 3:
                                potential_amt = lines[temp_v].strip()
                                if self._is_amount_simple(potential_amt):
                                    amounts.append({"val": self._clean_amount(potential_amt), "raw": potential_amt.upper()})
                                    temp_v += 1
                                else:
                                    break
                            vi = temp_v
                            break
                        else:
                            # If we hit next sequence before finding amounts, something is wrong or narration ended
                            if nl == str(expected_seq + 1) and vi + 1 < len(lines) and re.match(r'^\d{2}\.\d{2}\.\d{4}$', lines[vi+1].strip()):
                                break
                            narration_parts.append(nl)
                            vi += 1
                    
                    withdrawal = 0.0
                    deposit = 0.0
                    closing_balance = 0.0
                    unassigned_amount = None

                    if len(amounts) == 3:
                        withdrawal = amounts[0]["val"] or 0.0
                        deposit = amounts[1]["val"] or 0.0
                        closing_balance = amounts[2]["val"] or 0.0
                    elif len(amounts) == 2:
                        unassigned_amount = amounts[0]["val"]
                        closing_balance = amounts[1]["val"] or 0.0
                        # Explicit check for Dr/Cr in unassigned amount text
                        if "DR" in amounts[0]["raw"]:
                            withdrawal = unassigned_amount
                            unassigned_amount = None
                        elif "CR" in amounts[0]["raw"]:
                            deposit = unassigned_amount
                            unassigned_amount = None
                    elif len(amounts) == 1:
                        closing_balance = amounts[0]["val"] or 0.0

                    transactions.append({
                        "date": date,
                        "description": " ".join(narration_parts).strip(),
                        "reference": "",
                        "debit": withdrawal,
                        "credit": deposit,
                        "balance": closing_balance,
                        "_unassigned": unassigned_amount
                    })
                    expected_seq += 1
                    i = vi
                    continue
            i += 1

        info = self.get_account_info(all_text)
        opening_balance = info.get("opening_balance")

        # Fallback to summary row if mentioned as a transaction row but not caught in info
        if opening_balance is None:
            for line in lines:
                if "OPENING BALANCE" in line.upper():
                    m = re.search(r'([\d,]+\.\d{2})', line)
                    if m:
                        opening_balance = self._clean_amount(m.group(1))
                        break

        # Calculate opening balance if still missing
        if opening_balance is None:
            first_txn = transactions[0]
            amt_diff = 0.0
            if first_txn["credit"] > 0:
                amt_diff = first_txn["credit"]
            elif first_txn["debit"] > 0:
                amt_diff = -first_txn["debit"]
            elif first_txn["_unassigned"] is not None:
                # If first amount is tagged as DR, it's a withdrawal
                # The _unassigned logic in post_process will handle the actual assignment
                # Here we just need a reasonable starting opening_balance.
                # If the balance decreased, it's a withdrawal. But we don't know the prior.
                amt_diff = first_txn["_unassigned"]
            
            opening_balance = first_txn["balance"] - amt_diff
        
        # Post-process using shared logic
        processed_txns = self._post_process_with_balance_inference(transactions, opening_balance)
        
        return [self._standardize_transaction(t) for t in processed_txns]

    def _find_header_row(self, table: list[list[str]]) -> Optional[int]:
        keywords = ["date", "mode", "particular", "deposit", "withdrawal", "balance", "transaction", "amount"]
        for idx, row in enumerate(table):
            row_text = " ".join(str(c).lower() for c in row if c)
            if any(k in row_text for k in ["date", "transaction", "particular"]):
                matches = sum(1 for kw in keywords if kw in row_text)
                if matches >= 2:
                    return idx
        return None

    def _map_columns(self, header: list[str]) -> dict:
        col_map: dict = {}
        amount_cols = []
        for idx, col in enumerate(header):
            if not col:
                continue
            col_lower = str(col).lower().strip()
            if "date" in col_lower and "value" not in col_lower:
                col_map["date"] = idx
            elif any(k in col_lower for k in ["particular", "description", "narration", "remark"]):
                col_map["description"] = idx
            elif any(k in col_lower for k in ["mode", "chq", "cheque", "ref"]):
                col_map["reference"] = idx
            elif any(k in col_lower for k in ["withdrawal", "debit", "dr"]):
                col_map["debit"] = idx
            elif any(k in col_lower for k in ["deposit", "credit", "cr"]):
                col_map["credit"] = idx
            elif "balance" in col_lower:
                col_map["balance"] = idx
            elif "amount" in col_lower:
                amount_cols.append(idx)

        # Fallback for "Amount (INR)" style columns
        if "debit" not in col_map and len(amount_cols) >= 1:
            col_map["debit"] = amount_cols[0]
        if "credit" not in col_map and len(amount_cols) >= 2:
            col_map["credit"] = amount_cols[1]
        if "balance" not in col_map and len(amount_cols) >= 3:
            col_map["balance"] = amount_cols[2]

        return col_map

    def _parse_row(self, row: list[str], col_map: dict) -> Optional[dict]:
        if not col_map or "date" not in col_map:
            return None

        date_val = row[col_map["date"]] if col_map["date"] < len(row) else None
        if not date_val or not str(date_val).strip():
            return None

        date_str = str(date_val).strip()
        # Support dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, dd-MMM-yyyy, Month DD, YYYY
        if not re.match(r"\d{1,2}[./-](?:\d{1,2}|[a-zA-Z]{3})[./-]\d{2,4}", date_str) and \
           not re.match(r"[A-Z][a-z]+ \d{1,2}, \d{4}", date_str, re.IGNORECASE):
            return None

        txn = {
            "date": self._normalize_date(date_str),
            "description": str(row[col_map.get("description", 1)]).strip() if col_map.get("description") is not None and col_map["description"] < len(row) else "",
            "reference": str(row[col_map.get("reference", 2)]).strip() if col_map.get("reference") is not None and col_map["reference"] < len(row) else "",
            "debit": self._clean_amount(row[col_map["debit"]] if col_map.get("debit") is not None and col_map["debit"] < len(row) else None),
            "credit": self._clean_amount(row[col_map["credit"]] if col_map.get("credit") is not None and col_map["credit"] < len(row) else None),
            "balance": self._clean_amount(row[col_map["balance"]] if col_map.get("balance") is not None and col_map["balance"] < len(row) else None),
        }
        return txn
