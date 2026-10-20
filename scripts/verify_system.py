"""TreeLedger System Verification Script.

Usage:
    python scripts/verify_system.py
"""

import sys
import os
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
API_DIR = ROOT_DIR / "apps" / "api"
WEB_DIR = ROOT_DIR / "apps" / "web"


def run_step(step_name: str, cmd: list[str], cwd: Path) -> bool:
    print(f"\n[TEST] {step_name}...")
    try:
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=True)
        print(f"  [PASS] {step_name}")
        if result.stdout.strip():
            for line in result.stdout.strip().splitlines()[-5:]:
                print(f"    | {line}")
        return True
    except subprocess.CalledProcessError as exc:
        print(f"  [FAIL] {step_name}")
        if exc.stdout.strip():
            print(f"    STDOUT:\n{exc.stdout.strip()}")
        if exc.stderr.strip():
            print(f"    STDERR:\n{exc.stderr.strip()}")
        return False


def main():
    print("=" * 60)
    print("      TreeLedger - Automated System Verification Suite")
    print("=" * 60)

    all_passed = True

    # 1. Frontend TypeScript Validation
    print("\n--- 1. Frontend Checks (apps/web) ---")
    ts_cmd = ["npm.cmd" if os.name == "nt" else "npm", "test"]
    if not run_step("Next.js TypeScript Compiler Check", ts_cmd, WEB_DIR):
        all_passed = False

    # 2. Backend Unit & API Tests
    print("\n--- 2. Backend Checks (apps/api) ---")
    venv_pytest = API_DIR / ".venv" / ("Scripts/pytest.exe" if os.name == "nt" else "bin/pytest")
    if venv_pytest.exists():
        py_cmd = [str(venv_pytest), "tests", "-v"]
    else:
        py_cmd = [sys.executable, "-m", "pytest", "tests", "-v"]

    if not run_step("FastAPI & Services Pytest Suite", py_cmd, API_DIR):
        all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print(" [SUCCESS] All TreeLedger system tests PASSED cleanly!")
        print("=" * 60)
        sys.exit(0)
    else:
        print(" [WARNING] Some tests failed. Review output above.")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
