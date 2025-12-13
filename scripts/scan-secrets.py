#!/usr/bin/env python3
"""Simple diff scanner for credential-like strings.

Reads a unified diff from stdin and exits with a non-zero status when lines that
look like secrets are introduced. Intended to be used as:

    git diff --cached | ./scripts/scan-secrets.py
"""
from __future__ import annotations

import re
import sys
from typing import Iterable, List, Tuple

# Each tuple contains (pattern, human readable description)
SUSPICIOUS_PATTERNS: List[Tuple[re.Pattern[str], str]] = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS access key"),
    (re.compile(r"ASIA[0-9A-Z]{16}"), "Temporary AWS access key"),
    (
        re.compile(r"(?i)aws_secret_access_key"),
        "AWS secret access key identifier",
    ),  # scan-secrets: ignore
    (
        re.compile(r"(?i)aws_access_key_id"),
        "AWS access key identifier",
    ),  # scan-secrets: ignore
    (re.compile(r"ghp_[0-9A-Za-z]{36}"), "GitHub personal access token"),
    (re.compile(r"(?i)-----BEGIN [A-Z ]+PRIVATE KEY-----"), "Private key block"),
    (re.compile(r"sk-[A-Za-z0-9]{16,}"), "OpenAI/Stripe style secret key"),
    (
        re.compile(r"(?i)(?:api[_-]?key|secret|token|password)\s*[:=]\s*"),
        "Credential keyword assignment",
    ),
]


def collect_findings(lines: Iterable[str]) -> List[Tuple[int, str, str]]:
    """Return a list of suspicious additions.

    Each entry is a tuple of (line number in diff, description, code snippet).
    """

    findings: List[Tuple[int, str, str]] = []
    for index, raw_line in enumerate(lines, start=1):
        if not raw_line.startswith("+") or raw_line.startswith("+++"):
            continue
        candidate = raw_line[1:]
        if "scan-secrets: ignore" in candidate.lower() or "re.compile" in candidate:
            continue

        for pattern, description in SUSPICIOUS_PATTERNS:
            if pattern.search(candidate):
                snippet = candidate.strip()
                if len(snippet) > 120:
                    snippet = snippet[:117] + "..."
                findings.append((index, description, snippet))
                break
    return findings


def main() -> int:
    content = sys.stdin.read()
    if not content:
        return 0

    findings = collect_findings(content.splitlines())
    if not findings:
        return 0

    print("Potential secret detected in diff:\n", file=sys.stderr)
    for index, description, snippet in findings:
        print(f"  • Line {index}: {description}", file=sys.stderr)
        if snippet:
            print(f"    {snippet}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
