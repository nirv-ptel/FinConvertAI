import pdfplumber
import fitz  # PyMuPDF
from typing import Optional

from services.ocr_engine import ocr_pages
from services.bank_parsers import HDFCParser, ICICIParser, SBIParser, GenericParser


# Order matters — specific parsers first, generic last
PARSERS = [HDFCParser(), ICICIParser(), SBIParser(), GenericParser()]


def extract_pages(file_path: str, password: Optional[str] = None) -> list[dict]:
    """
    Extract text and tables from each page of a PDF.
    Returns a list of dicts: [{ text, tables }, ...]
    We use fitz for text (more robust) and pdfplumber for tables.
    """
    pages_data: list[dict] = []
    
    # ── Text extraction with fitz ───────────────────────────
    try:
        doc = fitz.open(file_path)
        if doc.is_encrypted and password:
            doc.authenticate(password)
        
        fitz_pages_text = [page.get_text("text") for page in doc]
        doc.close()
    except Exception as e:
        print(f"ERROR: fitz failed to extract text: {e}")
        fitz_pages_text = []

    # ── Table extraction with pdfplumber ────────────────────
    open_kwargs = {}
    if password:
        open_kwargs["password"] = password

    try:
        with pdfplumber.open(file_path, **open_kwargs) as pdf:
            for i, page in enumerate(pdf.pages):
                # Use fitz text if available for this page index
                text = fitz_pages_text[i] if i < len(fitz_pages_text) else (page.extract_text() or "")
                tables = page.extract_tables() or []

                # Clean table cells
                cleaned_tables = []
                for table in tables:
                    cleaned_table = []
                    for row in table:
                        cleaned_row = [str(cell).strip() if cell else "" for cell in row]
                        cleaned_table.append(cleaned_row)
                    cleaned_tables.append(cleaned_table)

                pages_data.append({
                    "text": text,
                    "tables": cleaned_tables,
                })
    except Exception as e:
        print(f"ERROR: pdfplumber failed: {e}")
        # If pdfplumber fails but we have fitz text, return what we have
        if fitz_pages_text:
            for text in fitz_pages_text:
                pages_data.append({"text": text, "tables": []})

    return pages_data


def detect_bank(full_text: str) -> str:
    """Detect which bank the statement belongs to."""
    for parser in PARSERS:
        if parser.detect(full_text):
            return parser.BANK_NAME
    return "Unknown"


def parse_statement(file_path: str, password: Optional[str] = None, bank_hint: Optional[str] = None) -> dict:
    """
    Main entry point: parse a PDF bank statement.
    """
    pages = extract_pages(file_path, password)

    # Combine all page text
    full_text = "\n".join(p["text"] for p in pages)
    print(f"DEBUG: Extracted text preview: {full_text[:500]}...")

    # Check if we got meaningful text; if not, try OCR
    source = "text"
    if len(full_text.strip()) < 50:
        pages = ocr_pages(file_path, password)
        full_text = "\n".join(p["text"] for p in pages)
        source = "ocr"

    # Find the right parser
    parser = GenericParser()
    if bank_hint:
        for p in PARSERS:
            if p.BANK_NAME.upper() == bank_hint.upper():
                parser = p
                break
    else:
        for p in PARSERS:
            if p.detect(full_text):
                parser = p
                break

    account_info = parser.get_account_info(full_text)
    transactions = parser.parse(pages)

    if not transactions:
        print(f"WARNING: No transactions found using parser: {parser.BANK_NAME}")

    return {
        "bank": parser.BANK_NAME,
        "account_info": account_info,
        "transactions": transactions,
        "total_transactions": len(transactions),
        "source": source,
    }
