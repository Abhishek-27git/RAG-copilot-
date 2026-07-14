from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List


@dataclass
class ParsedPage:
    """A single parsed page with its number and raw extracted text."""
    page_number: int
    raw_text: str


# A parsed document is simply an ordered list of pages
ParsedDocument = List[ParsedPage]


class DocumentParser(ABC):
    """Abstract base class for all document parsers."""

    @abstractmethod
    def parse(self, file_path: str) -> ParsedDocument:
        """
        Parse the document at the given path and return a list of ParsedPage objects.

        Args:
            file_path: Absolute path to the file on disk.

        Returns:
            List of ParsedPage, one entry per logical page/sheet.
        """
        ...
