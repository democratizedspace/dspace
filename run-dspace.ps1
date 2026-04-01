# Script to help with running the DSPACE application and Playwright tests in Docker

# Save current directory
$CURR_DIR = Get-Location

# Display usage information
function Show-Help {
    Write-Host "Usage: .\run-dspace.ps1 [COMMAND]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  start           - Start the application only"
    Write-Host "  test            - Run Playwright tests against the running application"
    Write-Host "  test:all        - Run all tests (linter, unit tests, and end-to-end tests)"
    Write-Host "  start-test      - Start the application and run Playwright tests (all-in-one)"
    Write-Host "  start-test:all  - Start the application and run all tests (all-in-one)"
    Write-Host "  stop            - Stop all containers"
    Write-Host "  clean           - Stop containers and remove volumes"
    Write-Host "  prune           - Remove all unused containers, networks, images and volumes"
    Write-Host "  report          - Open the Playwright HTML report (if it exists)"
    Write-Host "  help            - Show this help message"
    Write-Host ""
}

# Check if Docker and Docker Compose are installed
function Test-Dependencies {
    try {
        docker --version | Out-Null
    }
    catch {
        Write-Host "Docker is not installed. Please install Docker first."
        exit 1
    }

    try {
        docker compose version | Out-Null
    }
    catch {
        Write-Host "Docker Compose is not available. Please install Docker Compose first."
        exit 1
    }
}

# Start the application container
function Start-App {
    Write-Host "Starting DSPACE application..."
    Set-Location "$CURR_DIR\frontend"
    docker compose up -d app

    Write-Host "Waiting for application to be ready..."
    $ready = $false
    while (-not $ready) {
        try {
            docker compose exec app wget --spider -q http://localhost:3002 2>$null
            $ready = $true
        }
        catch {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 1
        }
    }
    Write-Host "`nApplication is ready at http://localhost:3003"
    Set-Location $CURR_DIR
}

# Run Playwright tests
function Start-Tests {
    Write-Host "Running Playwright tests..."
    Set-Location "$CURR_DIR\frontend"
    docker compose run --rm test
    Set-Location $CURR_DIR

    Write-Host "Tests completed. Results available in ./frontend/playwright-report/"
}

# Run all tests (linting, unit tests, and end-to-end tests)
function Start-AllTests {
    Write-Host "Running all tests (linter, unit tests, and end-to-end tests)..."
    Set-Location "$CURR_DIR\frontend"
    
    Write-Host "Running linter checks..."
    docker compose run --rm app npm run check
    
    Write-Host "Running unit tests..."
    docker compose run --rm app npm test
    
    Write-Host "Running Playwright tests..."
    docker compose run --rm test
    
    Set-Location $CURR_DIR
    
    Write-Host "All tests completed. Results available in ./frontend/"
}

# Start application and run tests
function Start-AppAndTests {
    Start-App
    Start-Tests
}

# Start application and run all tests
function Start-AppAndAllTests {
    Start-App
    Start-AllTests
}

# Stop all containers
function Stop-Containers {
    Write-Host "Stopping all containers..."
    Set-Location "$CURR_DIR\frontend"
    docker compose down
    Set-Location $CURR_DIR
}

# Clean up everything
function Clean-Environment {
    Write-Host "Cleaning up the environment..."
    Set-Location "$CURR_DIR\frontend"
    docker compose down -v
    Set-Location $CURR_DIR
    Write-Host "Done. All containers and volumes removed."
}

# Prune unused Docker resources
function Prune-DockerResources {
    Write-Host "Stopping all project containers..."
    Set-Location "$CURR_DIR\frontend"
    docker compose down
    Set-Location $CURR_DIR
    
    Write-Host "Removing dangling containers, networks, and images..."
    docker container prune -f
    docker network prune -f
    
    Write-Host "Removing unused images related to this project..."
    $projectImages = docker images | Select-String "dspace"
    if ($projectImages) {
        foreach ($img in $projectImages) {
            $imgId = $img -split '\s+' | Select-Object -Index 2
            docker rmi $imgId -f
        }
    }
    
    Write-Host "Pruning unused volumes..."
    docker volume prune -f
    
    Write-Host "Docker environment pruned successfully."
}

# Open the test report if it exists
function Open-Report {
    $reportPath = "$CURR_DIR\frontend\playwright-report\index.html"
    if (Test-Path $reportPath) {
        Write-Host "Opening Playwright HTML report..."
        Start-Process $reportPath
    }
    else {
        Write-Host "No test report found. Please run tests first."
    }
}

# Check dependencies
Test-Dependencies

# Process command
$command = $args[0]
switch ($command) {
    "start" { Start-App }
    "test" { Start-Tests }
    "test:all" { Start-AllTests }
    "start-test" { Start-AppAndTests }
    "start-test:all" { Start-AppAndAllTests }
    "stop" { Stop-Containers }
    "clean" { Clean-Environment }
    "prune" { Prune-DockerResources }
    "report" { Open-Report }
    "help" { Show-Help }
    "--help" { Show-Help }
    "-h" { Show-Help }
    default {
        if ($command) {
            Write-Host "Unknown command: $command"
        }
        Show-Help
        exit 1
    }
} 