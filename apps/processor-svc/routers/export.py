"""
Export Router — Converts parsed transactions to CSV, JSON, or Tally XML.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

from services.exporters import export_csv, export_json, export_tally_xml

router = APIRouter()


class ExportRequest(BaseModel):
    """Request body for exporting transactions."""
    transactions: list[dict]
    account_info: Optional[dict] = None
    file_name: Optional[str] = "export"


@router.post("/export/csv")
async def export_as_csv(request: ExportRequest):
    """Export transactions as a CSV file."""
    try:
        csv_bytes = export_csv(request.transactions)
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{request.file_name}.csv"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export CSV: {str(e)}")


@router.post("/export/json")
async def export_as_json(request: ExportRequest):
    """Export transactions as a JSON file."""
    try:
        json_bytes = export_json(request.transactions, request.account_info)
        return Response(
            content=json_bytes,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{request.file_name}.json"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export JSON: {str(e)}")


@router.post("/export/tally-xml")
async def export_as_tally_xml(request: ExportRequest):
    """Export transactions as Tally-compatible XML."""
    try:
        xml_bytes = export_tally_xml(request.transactions, request.account_info)
        return Response(
            content=xml_bytes,
            media_type="application/xml",
            headers={"Content-Disposition": f'attachment; filename="{request.file_name}.xml"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export Tally XML: {str(e)}")
