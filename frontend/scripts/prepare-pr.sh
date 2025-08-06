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

# Step 1: Run linting and formatting
echo "Step 1/3: Checking code formatting and linting..."
pnpm run check
if [ $? -ne 0 ]; then
  echo "❌ Formatting or linting issues found. Please fix them before submitting your PR."
  cd "$ORIGINAL_DIR" || exit 1
  exit 1
fi
echo "✅ Code formatting and linting passed!"

# Step 2: Run unit tests
echo -e "\nStep 2/3: Running unit tests..."
pnpm test
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed. Please fix them before submitting your PR."
  cd "$ORIGINAL_DIR" || exit 1
  exit 1
fi
echo "✅ Unit tests passed!"

# Step 3: Run grouped E2E tests (unless disabled)
if [ -z "$SKIP_E2E" ]; then
  echo -e "\nStep 3/3: Running end-to-end tests (grouped)..."
  pnpm run test:e2e:groups
  if [ $? -ne 0 ]; then
    echo "❌ End-to-end tests failed. Please fix them before submitting your PR."
    cd "$ORIGINAL_DIR" || exit 1
    exit 1
  fi
  echo "✅ End-to-end tests passed!"
else
  echo -e "\nStep 3/3: SKIP_E2E is set, skipping end-to-end tests..."
fi

# All done!
echo -e "\n🎉 All tests passed! Your PR is ready for submission."
echo "Don't forget to update any relevant documentation if you've added new features."

# Return to original directory
cd "$ORIGINAL_DIR" || exit 1 