import logging
from docx import Document as DocxDocument

from app.parsers.base import DocumentParser, ParsedDocument, ParsedPage

logger = logging.getLogger(__name__)


class DocxParser(DocumentParser):
    """
    Parses .docx files using python-docx.
    DOCX has no native page concept at the text-extraction level, so the
    entire document is treated as a single logical 'page' (page_number=1).
    """

    def parse(self, file_path: str) -> ParsedDocument:
        try:
            doc = DocxDocument(file_path)
            paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
            full_text = "\n\n".join(paragraphs)
            return [ParsedPage(page_number=1, raw_text=full_text)]
        except Exception as exc:
            logger.error("DocxParser failed for %s: %s", file_path, exc)
            raise
