"""Tally XML Exporter — Generates Tally-compatible XML vouchers."""

from lxml import etree


def export_tally_xml(transactions: list[dict], account_info: dict = None) -> bytes:
    """
    Convert transactions to Tally XML format (ENVELOPE > BODY > DATA > TALLYMESSAGE).
    Each transaction becomes a voucher entry.
    """
    info = account_info or {}
    ledger_name = info.get("account_holder", "Bank Account")

    # Root element
    envelope = etree.Element("ENVELOPE")

    header = etree.SubElement(envelope, "HEADER")
    etree.SubElement(header, "TALLYREQUEST").text = "Import Data"

    body = etree.SubElement(envelope, "BODY")
    import_data = etree.SubElement(body, "IMPORTDATA")
    request_desc = etree.SubElement(import_data, "REQUESTDESC")
    etree.SubElement(request_desc, "REPORTNAME").text = "Vouchers"
    static_vars = etree.SubElement(request_desc, "STATICVARIABLES")
    etree.SubElement(static_vars, "SVCURRENTCOMPANY").text = info.get("bank", "Company")

    request_data = etree.SubElement(import_data, "REQUESTDATA")

    for idx, txn in enumerate(transactions):
        tally_msg = etree.SubElement(request_data, "TALLYMESSAGE", xmlns_UDF="TallyUDF")
        voucher = etree.SubElement(tally_msg, "VOUCHER", REMOTEID=f"TXN-{idx + 1}", VCHTYPE="Receipt")
        voucher.set("ACTION", "Create")

        # Date (convert dd/mm/yyyy → yyyymmdd)
        date_str = txn.get("date", "")
        tally_date = _convert_date(date_str)
        etree.SubElement(voucher, "DATE").text = tally_date
        etree.SubElement(voucher, "EFFECTIVEDATE").text = tally_date

        # Narration
        etree.SubElement(voucher, "NARRATION").text = txn.get("Particulars", "")
        etree.SubElement(voucher, "REFERENCE").text = txn.get("Chq./Ref.No.", "")

        # Voucher type
        debit = txn.get("Withdrawal") or 0
        credit = txn.get("Deposit") or 0

        if credit and float(credit) > 0:
            voucher.set("VCHTYPE", "Receipt")
            amount = float(credit)
        elif debit and float(debit) > 0:
            voucher.set("VCHTYPE", "Payment")
            amount = float(debit)
        else:
            continue

        # Ledger entries
        # Party ledger
        ledger_entry = etree.SubElement(voucher, "ALLLEDGERENTRIES.LIST")
        etree.SubElement(ledger_entry, "LEDGERNAME").text = ledger_name
        etree.SubElement(ledger_entry, "ISDEEMEDPOSITIVE").text = "Yes" if credit else "No"
        etree.SubElement(ledger_entry, "AMOUNT").text = str(-amount if credit else amount)

        # Counter ledger (Bank / Cash)
        counter_entry = etree.SubElement(voucher, "ALLLEDGERENTRIES.LIST")
        etree.SubElement(counter_entry, "LEDGERNAME").text = txn.get("description", "Sundry")[:50]
        etree.SubElement(counter_entry, "ISDEEMEDPOSITIVE").text = "No" if credit else "Yes"
        etree.SubElement(counter_entry, "AMOUNT").text = str(amount if credit else -amount)

    tree = etree.ElementTree(envelope)
    return etree.tostring(tree, pretty_print=True, xml_declaration=True, encoding="utf-8")


def _convert_date(date_str: str) -> str:
    """Convert dd/mm/yyyy or dd-mm-yyyy to yyyymmdd format for Tally."""
    import re
    parts = re.split(r"[/\-.]", date_str.strip())
    if len(parts) == 3:
        day, month, year = parts
        if len(year) == 2:
            year = "20" + year
        return f"{year}{month.zfill(2)}{day.zfill(2)}"
    return date_str
