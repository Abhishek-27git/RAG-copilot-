"""
Parser factory — resolves file_type string to the correct DocumentParser implementation.
"""
from app.parsers.base import DocumentParser, ParsedDocument, ParsedPage
from app.parsers.pdf_parser import PDFParser
from app.parsers.docx_parser import DocxParser
from app.parsers.xlsx_parser import XlsxParser

_REGISTRY: dict[str, type[DocumentParser]] = {
    "pdf": PDFParser,
    "docx": DocxParser,
    "xlsx": XlsxParser,
}

SUPPORTED_FILE_TYPES = set(_REGISTRY.keys())


def get_parser(file_type: str) -> DocumentParser:
    """
    Return the appropriate parser instance for the given file type.

    Args:
        file_type: Lowercase extension without the dot (e.g. 'pdf', 'docx', 'xlsx').

    Raises:
        ValueError: If the file_type is not supported.
    """
    parser_cls = _REGISTRY.get(file_type.lower())
    if parser_cls is None:
        raise ValueError(
            f"Unsupported file type: '{file_type}'. "
            f"Supported types: {sorted(SUPPORTED_FILE_TYPES)}"
        )
    return parser_cls()


__all__ = [
    "DocumentParser",
    "ParsedDocument",
    "ParsedPage",
    "PDFParser",
    "DocxParser",
    "XlsxParser",
    "get_parser",
    "SUPPORTED_FILE_TYPES",
]
