"""
Fix all admin forms using action={handleSubmit} pattern (broken RSC form pattern).
Converts them to proper onSubmit with e.preventDefault() + formRef.
"""
import re
import os
from pathlib import Path

ROOT = Path(r"c:\Users\saksa\OneDrive\Desktop\spinpin\spinpin\frontend")

def fix_file(path: Path):
    content = path.read_text(encoding="utf-8")
    original = content

    # Skip if already fixed
    if "onSubmit={handleSubmit}" in content and "formRef" in content:
        return False

    # Skip if doesn't have the broken pattern
    if '<form action={handleSubmit}' not in content:
        return False

    changed = False

    # 1. Add useRef to import (if not already there)
    if "useRef" not in content:
        content = content.replace(
            "import { useState }",
            "import { useState, useRef }"
        ).replace(
            "import { useState,",
            "import { useState, useRef,"
        )
        changed = True

    # 2. Add formRef declaration after loading/error state
    if "const formRef" not in content:
        # Insert after the last useState line in the component
        content = re.sub(
            r"(const \[error, setError\] = useState[^\n]*\n)",
            r"\1    const formRef = useRef<HTMLFormElement>(null);\n",
            content
        )
        changed = True

    # 3. Fix the handleSubmit signature - change (formData: FormData) to proper event handler
    content = re.sub(
        r"async function handleSubmit\(formData: FormData\) \{",
        "async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {\n        e.preventDefault();\n        const formData = new FormData(formRef.current!);",
        content
    )

    # 4. Fix the form element - replace action= with ref + onSubmit
    content = content.replace(
        "<form action={handleSubmit}",
        "<form ref={formRef} onSubmit={handleSubmit}"
    )

    if content != original:
        path.write_text(content, encoding="utf-8")
        return True

    return False

# Find all TSX files in admin portal
fixed = []
skipped = []

for tsx in ROOT.rglob("*.tsx"):
    if "admin" not in str(tsx):
        continue
    try:
        if fix_file(tsx):
            fixed.append(tsx.relative_to(ROOT))
        else:
            if '<form action={handleSubmit}' in tsx.read_text(encoding="utf-8"):
                skipped.append(tsx.relative_to(ROOT))
    except Exception as e:
        print(f"ERROR {tsx}: {e}")

print(f"\n✅ Fixed {len(fixed)} files:")
for f in fixed:
    print(f"  - {f}")

if skipped:
    print(f"\n⚠️  Still has action= (needs manual fix): {len(skipped)}")
    for f in skipped:
        print(f"  - {f}")
