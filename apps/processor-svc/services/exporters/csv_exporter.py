"""CSV Exporter — Converts parsed transactions to CSV bytes."""

import io
import pandas as pd


def export_csv(transactions: list[dict]) -> bytes:
    """Convert transaction list to CSV file bytes."""
    df = pd.DataFrame(transactions)

    # Ensure column order matches standardized keys
    columns = ["date", "Particulars", "Chq./Ref.No.", "Withdrawal", "Deposit", "Balance"]
    existing = [c for c in columns if c in df.columns]
    df = df[existing]

    buffer = io.StringIO()
    df.to_csv(buffer, index=False, encoding="utf-8")
    return buffer.getvalue().encode("utf-8")
