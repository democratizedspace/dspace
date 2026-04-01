#!/bin/bash

# Script to run all tests for DSPACE

# Set colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track if any tests fail
FAILURES=0

# Start time
START_TIME=$(date +%s)

# Function to display section header
print_header() {
  echo -e "\n${BLUE}==============================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}==============================================${NC}\n"
}

# Function to handle errors
handle_error() {
  FAILURES=$((FAILURES+1))
  echo -e "\n${RED}❌ $1 FAILED${NC}\n"
}

# Function to handle success
handle_success() {
  echo -e "\n${GREEN}✅ $1 PASSED${NC}\n"
}

# Run linting checks
run_linting() {
  print_header "RUNNING LINTING CHECKS"
  
  echo -e "${YELLOW}Running ESLint...${NC}"
  npm run lint
  if [ $? -ne 0 ]; then
    echo -e "\n${YELLOW}⚠️ ESLint reported issues but continuing with tests.${NC}"
  else
    echo -e "\n${GREEN}✅ ESLint checks passed${NC}"
  fi
  
  echo -e "${YELLOW}Running Prettier checks...${NC}"
  npm run format:check
  if [ $? -ne 0 ]; then
    echo -e "\n${YELLOW}⚠️ Prettier format issues found but continuing with tests.${NC}"
  else
    echo -e "\n${GREEN}✅ Prettier checks passed${NC}"
  fi
  
  handle_success "LINTING CHECKS"
  return 0
}

# Run unit tests
run_unit_tests() {
  print_header "RUNNING UNIT TESTS"
  
  npm test
  if [ $? -ne 0 ]; then
    handle_error "UNIT TESTS"
    return 1
  fi
  
  handle_success "UNIT TESTS"
  return 0
}

# Run Playwright e2e tests
run_e2e_tests() {
  print_header "RUNNING END-TO-END TESTS"
  
  npm run test:e2e
  if [ $? -ne 0 ]; then
    handle_error "END-TO-END TESTS"
    return 1
  fi
  
  handle_success "END-TO-END TESTS"
  return 0
}

# Generate coverage report
generate_coverage() {
  print_header "GENERATING COVERAGE REPORT"
  
  npm run coverage
  if [ $? -ne 0 ]; then
    handle_error "COVERAGE REPORT"
    return 1
  fi
  
  handle_success "COVERAGE REPORT"
  return 0
}

# Main execution
echo -e "${BLUE}Running all tests for DSPACE${NC}"

# Run each test phase
run_linting
run_unit_tests
run_e2e_tests
generate_coverage

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - START_TIME))
MINUTES=$((ELAPSED_TIME / 60))
SECONDS=$((ELAPSED_TIME % 60))

# Show summary
print_header "TEST SUMMARY"
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
else
  echo -e "${RED}$FAILURES test phases failed.${NC}"
  echo -e "${RED}Please fix the issues before committing.${NC}"
fi

echo -e "${BLUE}Total time: ${MINUTES}m ${SECONDS}s${NC}"

# Exit with status
if [ $FAILURES -eq 0 ]; then
  exit 0
else
  exit 1
fi 