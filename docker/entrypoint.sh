#!/bin/bash
# Entrypoint script for API Test Agent Docker container
# Handles environment setup, health checks, and test execution

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly APP_DIR="/app"
readonly HEALTH_CHECK_PORT="${HEALTH_CHECK_PORT:-3000}"
readonly LOG_LEVEL="${LOG_LEVEL:-info}"
readonly PLAYWRIGHT_HEADLESS="${PLAYWRIGHT_HEADLESS:-true}"
readonly MAX_RETRIES=3
readonly RETRY_DELAY=5

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*" >&2
}

# Error handler
error_exit() {
    log_error "$1"
    exit "${2:-1}"
}

# Cleanup handler
cleanup() {
    local exit_code=$?
    log_info "Cleaning up..."

    # Kill background processes
    if [[ -n "${HEALTH_SERVER_PID:-}" ]]; then
        kill "${HEALTH_SERVER_PID}" 2>/dev/null || true
    fi

    # Save test results if they exist
    if [[ -d "test-results" ]]; then
        log_info "Test results saved in /app/test-results"
    fi

    if [[ $exit_code -eq 0 ]]; then
        log_success "Container shutdown complete"
    else
        log_error "Container exited with code: $exit_code"
    fi

    exit "$exit_code"
}

# Register cleanup handler
trap cleanup EXIT INT TERM

# Validate environment
validate_environment() {
    log_info "Validating environment..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        error_exit "Node.js not found" 127
    fi
    log_info "Node.js version: $(node --version)"

    # Check npm
    if ! command -v npm &> /dev/null; then
        error_exit "npm not found" 127
    fi
    log_info "npm version: $(npm --version)"

    # Check Playwright
    if ! command -v playwright &> /dev/null; then
        error_exit "Playwright not found" 127
    fi
    log_info "Playwright version: $(playwright --version)"

    # Check required directories
    if [[ ! -d "$APP_DIR/dist" ]]; then
        error_exit "Application not built - /app/dist directory missing" 1
    fi

    # Check required files
    if [[ ! -f "$APP_DIR/package.json" ]]; then
        error_exit "package.json not found" 1
    fi

    log_success "Environment validation passed"
}

# Start simple health check server
start_health_server() {
    log_info "Starting health check server on port ${HEALTH_CHECK_PORT}..."

    # Create a simple HTTP server using Node.js
    node -e "
        const http = require('http');
        const server = http.createServer((req, res) => {
            if (req.url === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: require('./package.json').version
                }));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        server.listen(${HEALTH_CHECK_PORT}, '0.0.0.0', () => {
            console.log('Health check server listening on port ${HEALTH_CHECK_PORT}');
        });
    " &

    HEALTH_SERVER_PID=$!

    # Wait for server to start
    sleep 2

    # Verify server is running
    if ! kill -0 "${HEALTH_SERVER_PID}" 2>/dev/null; then
        error_exit "Failed to start health check server" 1
    fi

    log_success "Health check server started (PID: ${HEALTH_SERVER_PID})"
}

# Perform health check
perform_health_check() {
    log_info "Performing health check..."

    local retry_count=0

    while [[ $retry_count -lt $MAX_RETRIES ]]; do
        if curl -f -s "http://localhost:${HEALTH_CHECK_PORT}/health" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi

        retry_count=$((retry_count + 1))
        if [[ $retry_count -lt $MAX_RETRIES ]]; then
            log_warning "Health check failed, retrying in ${RETRY_DELAY}s... (${retry_count}/${MAX_RETRIES})"
            sleep "$RETRY_DELAY"
        fi
    done

    error_exit "Health check failed after ${MAX_RETRIES} attempts" 1
}

# Setup test environment
setup_test_environment() {
    log_info "Setting up test environment..."

    # Create test output directories
    mkdir -p test-results playwright-report coverage

    # Set Playwright environment variables
    export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/ms-playwright}"
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="${PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:-1}"
    export PLAYWRIGHT_HEADLESS="${PLAYWRIGHT_HEADLESS}"

    # Set Node environment
    export NODE_ENV="${NODE_ENV:-production}"
    export LOG_LEVEL="${LOG_LEVEL}"

    log_success "Test environment configured"
}

# Run Playwright tests
run_tests() {
    log_info "Running Playwright tests..."

    # Determine test command from environment or use default
    local test_command="${TEST_COMMAND:-npm run test:playwright}"

    log_info "Executing: $test_command"

    # Run tests with proper error handling
    if eval "$test_command"; then
        log_success "All tests passed"
        return 0
    else
        local exit_code=$?
        log_error "Tests failed with exit code: $exit_code"

        # Save test results
        if [[ -d "playwright-report" ]]; then
            log_info "Test report available at /app/playwright-report"
        fi

        return "$exit_code"
    fi
}

# Main execution flow
main() {
    log_info "========================================="
    log_info "API Test Agent Container Starting"
    log_info "========================================="

    # Change to app directory
    cd "$APP_DIR" || error_exit "Failed to change to app directory" 1

    # Execute setup steps
    validate_environment
    setup_test_environment
    start_health_server
    perform_health_check

    log_info "========================================="
    log_info "Container Ready - Starting Tests"
    log_info "========================================="

    # Run tests
    run_tests
    test_exit_code=$?

    log_info "========================================="
    log_info "Test Execution Complete"
    log_info "========================================="

    # Keep container running if KEEP_ALIVE is set
    if [[ "${KEEP_ALIVE:-false}" == "true" ]]; then
        log_info "KEEP_ALIVE enabled - container will continue running"
        log_info "Health endpoint: http://localhost:${HEALTH_CHECK_PORT}/health"

        # Wait indefinitely
        wait "${HEALTH_SERVER_PID}"
    fi

    exit "$test_exit_code"
}

# Execute main function
main "$@"
