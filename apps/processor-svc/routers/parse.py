"""
Parse Router — Accepts a PDF file path + optional password.
Returns structured parsed bank statement data.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

from services.pdf_parser import parse_statement

router = APIRouter()


class ParseRequest(BaseModel):
    """Request body for parsing a PDF bank statement."""
    file_path: str
    password: Optional[str] = None
    bank: Optional[str] = None


class ParseResponse(BaseModel):
    """Response body with parsed statement data."""
    bank: str
    account_info: dict
    transactions: list[dict]
    total_transactions: int
    source: str


@router.post("/parse", response_model=ParseResponse)
async def parse_pdf(request: ParseRequest):
    """
    Parse a PDF bank statement.

    - **file_path**: Absolute path to the uploaded PDF file
    - **password**: Optional password for encrypted PDFs
    """
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {request.file_path}")

    if not request.file_path.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        result = parse_statement(request.file_path, request.password, request.bank)
    except Exception as e:
        error_msg = str(e)
        if "password" in error_msg.lower() or "encrypted" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Invalid password or encrypted PDF could not be opened")
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {error_msg}")

    if not result.get("transactions"):
        raise HTTPException(
            status_code=422,
            detail="No transactions found in the PDF. The format may not be supported.",
        )

    return result
