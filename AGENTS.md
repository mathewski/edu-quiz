# Agent Guidelines for informatyka6

This document provides guidelines for AI coding agents working in this repository.

## Project Overview

**Language:** Python 3.14.2  
**Type:** Educational tools for 6th-grade computer science curriculum  
**Dependencies:** PyPDF2 3.0.1  
**Virtual Environment:** `.venv/` (already configured)

## Build, Test, and Lint Commands

### Environment Setup
```bash
# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Freeze current dependencies
pip freeze > requirements.txt
```

### Testing
```bash
# Run all tests (when pytest is configured)
pytest

# Run a single test file
pytest tests/test_filename.py

# Run a specific test function
pytest tests/test_filename.py::test_function_name

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=src --cov-report=html
```

### Linting and Formatting
```bash
# Format code with black (when configured)
black .

# Lint with flake8 (when configured)
flake8 src/

# Type checking with mypy (when configured)
mypy src/

# Run all checks
black . && flake8 src/ && mypy src/ && pytest
```

## Project Structure

```
informatyka6/
├── .venv/              # Virtual environment (do not commit)
├── src/                # Source code (to be created)
├── tests/              # Test files (to be created)
├── docs/               # Documentation
├── wymagania.md        # Curriculum requirements (Polish)
├── requirements.txt    # Python dependencies
└── AGENTS.md          # This file
```

## Code Style Guidelines

### Import Organization
```python
# Standard library imports
import os
import sys
from pathlib import Path

# Third-party imports
from PyPDF2 import PdfReader, PdfWriter

# Local application imports
from src.utils import helper_function
from src.models import DataModel
```

### Formatting Standards
- **Line length:** 88 characters (Black default)
- **Indentation:** 4 spaces (no tabs)
- **Quotes:** Double quotes for strings, single quotes for characters
- **Blank lines:** 2 before top-level functions/classes, 1 between methods
- **Trailing commas:** Use in multi-line structures

### Type Hints
Use type hints for all function signatures:
```python
def process_pdf(file_path: str, output_dir: Path) -> dict[str, Any]:
    """Process a PDF file and return metadata."""
    result: dict[str, Any] = {}
    return result
```

### Naming Conventions
- **Variables/functions:** `snake_case`
- **Classes:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Private members:** `_leading_underscore`
- **Module names:** `lowercase_with_underscores`

### Documentation
Use docstrings for all public modules, functions, classes, and methods:
```python
def calculate_average(numbers: list[float]) -> float:
    """
    Calculate the arithmetic mean of a list of numbers.
    
    Args:
        numbers: List of numeric values
        
    Returns:
        The average of the input numbers
        
    Raises:
        ValueError: If the input list is empty
    """
    if not numbers:
        raise ValueError("Cannot calculate average of empty list")
    return sum(numbers) / len(numbers)
```

### Error Handling
- Use specific exception types, avoid bare `except:`
- Always provide meaningful error messages
- Clean up resources with context managers
```python
try:
    with open(file_path, 'r') as f:
        data = f.read()
except FileNotFoundError:
    logger.error(f"File not found: {file_path}")
    raise
except PermissionError:
    logger.error(f"Permission denied: {file_path}")
    raise
```

### File Operations
Prefer `pathlib.Path` over `os.path`:
```python
from pathlib import Path

file_path = Path("data") / "input.txt"
if file_path.exists():
    content = file_path.read_text()
```

### Logging
Use the `logging` module, not `print()`:
```python
import logging

logger = logging.getLogger(__name__)
logger.info("Processing started")
logger.error("An error occurred", exc_info=True)
```

## Testing Guidelines

- **Test file naming:** `test_*.py` or `*_test.py`
- **Test function naming:** `test_<description>`
- **Use pytest fixtures** for setup/teardown
- **Aim for >80% code coverage**
- **Test edge cases** and error conditions

Example test:
```python
import pytest
from src.calculator import calculate_average

def test_calculate_average_valid_input():
    assert calculate_average([1, 2, 3, 4, 5]) == 3.0

def test_calculate_average_empty_list():
    with pytest.raises(ValueError, match="empty list"):
        calculate_average([])
```

## Git Workflow

- **Do not commit:** `.venv/`, `__pycache__/`, `*.pyc`, `.DS_Store`
- **Commit messages:** Clear, concise, imperative mood
- **Branch naming:** `feature/description`, `fix/description`

## Educational Context

This project supports 6th-grade computer science curriculum including:
- Cloud storage (OneDrive)
- Spreadsheet calculations (Excel)
- Programming (Scratch)
- Image editing (GIMP)
- Email and collaboration (MS Teams)
- Internet safety and netiquette

When creating educational tools, ensure they are:
- **Age-appropriate** for 11-12 year olds
- **Clear and simple** in UI/UX
- **Well-documented** with Polish language support
- **Safe and secure** following best practices

## Best Practices

1. **Always activate virtual environment** before working
2. **Update requirements.txt** after installing new packages
3. **Write tests** before or alongside implementation
4. **Document non-obvious code** with comments
5. **Keep functions small** and focused (single responsibility)
6. **Avoid magic numbers** - use named constants
7. **Handle Polish characters** properly (UTF-8 encoding)
8. **Validate all user inputs**
9. **Use meaningful variable names** (avoid `x`, `tmp`, `data`)
10. **Follow DRY principle** - don't repeat yourself

## Common Patterns

### PDF Processing with PyPDF2
```python
from PyPDF2 import PdfReader

def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract all text from a PDF file."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text
```

### Configuration Management
```python
from pathlib import Path
import json

def load_config(config_path: Path) -> dict:
    """Load configuration from JSON file."""
    with config_path.open('r', encoding='utf-8') as f:
        return json.load(f)
```

## Resources

- Python documentation: https://docs.python.org/3/
- PyPDF2 documentation: https://pypdf2.readthedocs.io/
- PEP 8 Style Guide: https://pep8.org/
- Type hints (PEP 484): https://peps.python.org/pep-0484/
