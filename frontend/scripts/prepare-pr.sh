#!/bin/bash

# Script to run before submitting a PR
# This script runs all necessary checks to ensure the PR is ready for review

echo "Running pre-PR checks for DSPACE..."
echo "====================================="

# Store original directory to return at end
ORIGINAL_DIR=$(pwd)

# Navigate to frontend directory if needed
SCRIPT_DIR=$(dirname "$(realpath "$0")")
cd "$SCRIPT_DIR/.." || exit 1

# Ensure Playwright browsers are installed when running E2E tests
if [ -z "$SKIP_E2E" ]; then
  npx playwright install --with-deps >/dev/null 2>&1
fi

# Step 1: Run linting and formatting
echo "Step 1/3: Checking code formatting and linting..."
npm run check
if [ $? -ne 0 ]; then
  echo "❌ Formatting or linting issues found. Please fix them before submitting your PR."
  cd "$ORIGINAL_DIR" || exit 1
  exit 1
fi
echo "✅ Code formatting and linting passed!"

# Step 2: Run unit tests
echo -e "\nStep 2/3: Running unit tests..."
TEST_OUTPUT=$(npm test 2>&1)
TEST_EXIT=$?
echo "$TEST_OUTPUT"
if [ $TEST_EXIT -ne 0 ]; then
  echo "❌ Unit tests failed. Please fix them before submitting your PR."
  cd "$ORIGINAL_DIR" || exit 1
  exit 1
fi
if echo "$TEST_OUTPUT" | grep -Eq "Test Files\\s+0|Tests\\s+0|No test files? found"; then
  echo "⚠️  Warning: no unit tests were run."
fi
echo "✅ Unit tests passed!"

# Step 3: Run grouped E2E tests (unless disabled)
if [ -z "$SKIP_E2E" ]; then
  echo -e "\nStep 3/3: Running end-to-end tests (grouped)..."
  E2E_OUTPUT=$(npm run test:e2e:groups 2>&1)
  E2E_EXIT=$?
  echo "$E2E_OUTPUT"
  if [ $E2E_EXIT -ne 0 ]; then
    echo "❌ End-to-end tests failed. Please fix them before submitting your PR."
    cd "$ORIGINAL_DIR" || exit 1
    exit 1
  fi
  if echo "$E2E_OUTPUT" | grep -Eq "Test Files\\s+0|Tests\\s+0|No test files? found"; then
    echo "⚠️  Warning: no end-to-end tests were run."
  fi
  echo "✅ End-to-end tests passed!"
else
  echo -e "\nStep 3/3: SKIP_E2E is set, skipping end-to-end tests..."
  echo "⚠️ Remember to run them locally before submitting your PR."
fi

# All done!
echo -e "\n🎉 All tests passed! Your PR is ready for submission."
echo "Don't forget to update any relevant documentation if you've added new features."

# Return to original directory
cd "$ORIGINAL_DIR" || exit 1 
