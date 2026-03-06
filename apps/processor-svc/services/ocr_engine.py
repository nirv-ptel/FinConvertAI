"""
OCR Engine — Converts scanned PDF pages to text using Tesseract.
Used as a fallback when pdfplumber cannot extract text.
"""

from typing import Optional
from pdf2image import convert_from_path
import pytesseract

from config import settings

pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD


def ocr_pages(file_path: str, password: Optional[str] = None) -> list[dict]:
    """
    Convert PDF pages to images, run OCR, and return structured page data.
    Same output format as pdf_parser.extract_pages for compatibility.
    """
    convert_kwargs = {}
    if password:
        convert_kwargs["userpw"] = password

    try:
        images = convert_from_path(file_path, dpi=300, **convert_kwargs)
    except Exception:
        return []

    pages_data: list[dict] = []
    for img in images:
        text = pytesseract.image_to_string(img, lang="eng")
        # OCR doesn't produce structured tables, so tables list is empty
        pages_data.append({
            "text": text,
            "tables": [],
        })

    return pages_data
