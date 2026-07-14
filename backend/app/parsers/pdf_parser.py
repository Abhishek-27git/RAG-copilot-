import logging
import fitz  # PyMuPDF

from app.parsers.base import DocumentParser, ParsedDocument, ParsedPage

logger = logging.getLogger(__name__)


class PDFParser(DocumentParser):
    """
    Parses PDF files using PyMuPDF (fitz).
    Each PDF page maps directly to a ParsedPage.
    """

    def parse(self, file_path: str) -> ParsedDocument:
        pages: ParsedDocument = []
        try:
            doc = fitz.open(file_path)
            for page_index in range(len(doc)):
                page = doc[page_index]
                text = page.get_text("text")  # plain text extraction
                pages.append(ParsedPage(page_number=page_index + 1, raw_text=text or ""))
            doc.close()
        except Exception as exc:
            logger.error("PDFParser failed for %s: %s", file_path, exc)
            raise
        return pages
