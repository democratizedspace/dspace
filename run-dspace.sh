#!/bin/bash

# Script to help with running the DSPACE application and Playwright tests in Docker

# Save the current directory
CURR_DIR=$(pwd)

# Display usage information
function show_help {
  echo "Usage: ./run-dspace.sh [COMMAND]"
  echo ""
  echo "Commands:"
  echo "  start           - Start the application only"
  echo "  test            - Run Playwright tests against the running application"
  echo "  test:all        - Run all tests (linter, unit tests, and end-to-end tests)"
  echo "  start-test      - Start the application and run Playwright tests (all-in-one)"
  echo "  start-test:all  - Start the application and run all tests (all-in-one)"
  echo "  stop            - Stop all containers"
  echo "  clean           - Stop containers and remove volumes"
  echo "  prune           - Remove all unused containers, networks, images and volumes"
  echo "  report          - Open the Playwright HTML report (if it exists)"
  echo "  help            - Show this help message"
  echo ""
}

# Check if Docker and Docker Compose are installed
function check_dependencies {
  if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
  fi
  
  if ! docker compose version &> /dev/null; then
    echo "Docker Compose is not available. Please install Docker Compose first."
    exit 1
  fi
}

# Start the application container
function start_app {
  echo "Starting DSPACE application..."
  cd "$CURR_DIR/frontend" && docker compose up -d app
  
  # Wait for the application to be ready
  echo "Waiting for application to be ready..."
  until docker compose exec app wget --spider -q http://localhost:3002 2>/dev/null; do
    echo -n "."
    sleep 1
  done
  echo -e "\nApplication is ready at http://localhost:3003"
  cd "$CURR_DIR"
}

# Run Playwright tests
function run_tests {
  echo "Running Playwright tests..."
  cd "$CURR_DIR/frontend" && docker compose run --rm test
  cd "$CURR_DIR"
  
  # Copy test results to local directory for easier access
  echo "Tests completed. Results available in ./frontend/playwright-report/"
}

# Run all tests (linting, unit tests, and end-to-end tests)
function run_all_tests {
  echo "Running all tests (linter, unit tests, and end-to-end tests)..."
  cd "$CURR_DIR/frontend"
  
  echo "Running linter checks..."
  docker compose run --rm app npm run check
  
  echo "Running unit tests..."
  docker compose run --rm app npm test
  
  echo "Running Playwright tests..."
  docker compose run --rm test
  
  cd "$CURR_DIR"
  
  echo "All tests completed. Results available in ./frontend/"
}

# Start application and run tests
function start_and_test {
  start_app
  run_tests
}

# Start application and run all tests
function start_and_test_all {
  start_app
  run_all_tests
}

# Stop all containers
function stop_containers {
  echo "Stopping all containers..."
  cd "$CURR_DIR/frontend" && docker compose down
  cd "$CURR_DIR"
}

# Clean up everything
function clean_environment {
  echo "Cleaning up the environment..."
  cd "$CURR_DIR/frontend" && docker compose down -v
  cd "$CURR_DIR"
  echo "Done. All containers and volumes removed."
}

# Prune unused Docker resources
function prune_docker_resources {
  echo "Stopping all project containers..."
  cd "$CURR_DIR/frontend" && docker compose down
  cd "$CURR_DIR"
  
  echo "Removing dangling containers, networks, and images..."
  docker container prune -f
  docker network prune -f
  
  echo "Removing unused images related to this project..."
  # Get image IDs related to this project
  PROJECT_IMAGES=$(docker images | grep "dspace" | awk '{print $3}')
  if [ ! -z "$PROJECT_IMAGES" ]; then
    docker rmi $PROJECT_IMAGES -f
  fi
  
  echo "Pruning unused volumes..."
  docker volume prune -f
  
  echo "Docker environment pruned successfully."
}

# Open the test report if it exists
function open_report {
  if [ -f "$CURR_DIR/frontend/playwright-report/index.html" ]; then
    echo "Opening Playwright HTML report..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
      open "$CURR_DIR/frontend/playwright-report/index.html"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      xdg-open "$CURR_DIR/frontend/playwright-report/index.html"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
      start "$CURR_DIR/frontend/playwright-report/index.html"
    else
      echo "Could not automatically open the report. Please open it manually at:"
      echo "$CURR_DIR/frontend/playwright-report/index.html"
    fi
  else
    echo "No test report found. Please run tests first."
  fi
}

# Check dependencies
check_dependencies

# Process command
case "$1" in
  start)
    start_app
    ;;
  test)
    run_tests
    ;;
  test:all)
    run_all_tests
    ;;
  start-test)
    start_and_test
    ;;
  start-test:all)
    start_and_test_all
    ;;
  stop)
    stop_containers
    ;;
  clean)
    clean_environment
    ;;
  prune)
    prune_docker_resources
    ;;
  report)
    open_report
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo "Unknown command: $1"
    show_help
    exit 1
    ;;
esac

exit 0 