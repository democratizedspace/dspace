# scan-secrets-python-missing

- **Date:** 2025-12-12
- **Component:** tooling:pre-push
- **Root cause:** Root tests invoked python3 unconditionally when exercising scripts/scan-secrets.py; Windows dev machines without Python failed pre-push and test:root runs even though CI passed on Linux.
- **Resolution:** Added a python3 availability check and gated the scan-secrets Vitest cases with runIf so they execute in CI but skip on hosts without Python.
- **References:**
  - tests/scanSecretsScript.test.ts
  - scripts/scan-secrets.py
