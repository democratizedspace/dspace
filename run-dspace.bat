@echo off
setlocal enabledelayedexpansion

:: Script to help with running the DSPACE application and Playwright tests in Docker

:: Display usage information
if "%1"=="" goto :show_help
if "%1"=="help" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

:: Check if Docker and Docker Compose are installed
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed. Please install Docker first.
    exit /b 1
)

docker compose version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker Compose is not available. Please install Docker Compose first.
    exit /b 1
)

:: Save current directory
set CURR_DIR=%CD%

:: Process command
if "%1"=="start" (
    call :start_app
    goto :eof
)
if "%1"=="test" (
    call :run_tests
    goto :eof
)
if "%1"=="test:all" (
    call :run_all_tests
    goto :eof
)
if "%1"=="start-test" (
    call :start_and_test
    goto :eof
)
if "%1"=="start-test:all" (
    call :start_and_test_all
    goto :eof
)
if "%1"=="stop" (
    call :stop_containers
    goto :eof
)
if "%1"=="clean" (
    call :clean_environment
    goto :eof
)
if "%1"=="prune" (
    call :prune_docker_resources
    goto :eof
)
if "%1"=="report" (
    call :open_report
    goto :eof
)

echo Unknown command: %1
call :show_help
exit /b 1

:show_help
echo Usage: run-dspace.bat [COMMAND]
echo.
echo Commands:
echo   start           - Start the application only
echo   test            - Run Playwright tests against the running application
echo   test:all        - Run all tests (linter, unit tests, and end-to-end tests)
echo   start-test      - Start the application and run Playwright tests (all-in-one)
echo   start-test:all  - Start the application and run all tests (all-in-one)
echo   stop            - Stop all containers
echo   clean           - Stop containers and remove volumes
echo   prune           - Remove all unused containers, networks, images and volumes
echo   report          - Open the Playwright HTML report (if it exists)
echo   help            - Show this help message
echo.
exit /b 0

:start_app
echo Starting DSPACE application...
cd %CURR_DIR%\frontend
docker compose up -d app

echo Waiting for application to be ready...
:wait_loop
docker compose exec app wget --spider -q http://localhost:3002 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo .
    timeout /t 1 /nobreak >nul
    goto :wait_loop
)
echo.
echo Application is ready at http://localhost:3003
cd %CURR_DIR%
exit /b 0

:run_tests
echo Running Playwright tests...
cd %CURR_DIR%\frontend
docker compose run --rm test
cd %CURR_DIR%

echo Tests completed. Results available in ./frontend/playwright-report/
exit /b 0

:run_all_tests
echo Running all tests (linter, unit tests, and end-to-end tests)...
cd %CURR_DIR%\frontend

echo Running linter checks...
docker compose run --rm app npm run check

echo Running unit tests...
docker compose run --rm app npm test

echo Running Playwright tests...
docker compose run --rm test

cd %CURR_DIR%

echo All tests completed. Results available in ./frontend/
exit /b 0

:start_and_test
call :start_app
call :run_tests
exit /b 0

:start_and_test_all
call :start_app
call :run_all_tests
exit /b 0

:stop_containers
echo Stopping all containers...
cd %CURR_DIR%\frontend
docker compose down
cd %CURR_DIR%
exit /b 0

:clean_environment
echo Cleaning up the environment...
cd %CURR_DIR%\frontend
docker compose down -v
cd %CURR_DIR%
echo Done. All containers and volumes removed.
exit /b 0

:prune_docker_resources
echo Stopping all project containers...
cd %CURR_DIR%\frontend
docker compose down
cd %CURR_DIR%

echo Removing dangling containers, networks, and images...
docker container prune -f
docker network prune -f

echo Removing unused images related to this project...
for /f "tokens=3" %%i in ('docker images ^| findstr "dspace"') do (
    docker rmi %%i -f
)

echo Pruning unused volumes...
docker volume prune -f

echo Docker environment pruned successfully.
exit /b 0

:open_report
if exist "%CURR_DIR%\frontend\playwright-report\index.html" (
    echo Opening Playwright HTML report...
    start %CURR_DIR%\frontend\playwright-report\index.html
) else (
    echo No test report found. Please run tests first.
)
exit /b 0 