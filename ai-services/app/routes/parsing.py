import io
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from PyPDF2 import PdfReader
from docx import Document
import structlog

logger = structlog.get_logger()

router = APIRouter()


@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """Parse uploaded resume (PDF or DOCX) and extract text content."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    filename = file.filename.lower()
    content = await file.read()

    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        if filename.endswith(".pdf"):
            parsed_text = _parse_pdf(content)
        elif filename.endswith(".docx"):
            parsed_text = _parse_docx(content)
        else:
            raise HTTPException(
                status_code=400, detail="Unsupported file format. Use PDF or DOCX."
            )

        if not parsed_text.strip():
            raise HTTPException(
                status_code=422, detail="Could not extract text from document"
            )

        logger.info("Resume parsed successfully", filename=file.filename, length=len(parsed_text))

        return {
            "success": True,
            "parsed_text": parsed_text,
            "char_count": len(parsed_text),
            "word_count": len(parsed_text.split()),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Resume parsing failed", error=str(e), filename=file.filename)
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")


def _parse_pdf(content: bytes) -> str:
    """Extract text from PDF bytes."""
    reader = PdfReader(io.BytesIO(content))
    text_parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    return "\n".join(text_parts)


def _parse_docx(content: bytes) -> str:
    """Extract text from DOCX bytes."""
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=True) as tmp:
        tmp.write(content)
        tmp.flush()
        doc = Document(tmp.name)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)
