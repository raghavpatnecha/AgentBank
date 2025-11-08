#!/bin/bash

# run-tests.sh - Docker-based test execution script
# Builds Docker image and runs tests in container with result collection

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
IMAGE_NAME="api-test-agent"
CONTAINER_NAME="api-test-runner"
TEST_RESULTS_DIR="${PROJECT_ROOT}/test-results"
COVERAGE_DIR="${PROJECT_ROOT}/coverage"
PLAYWRIGHT_REPORT_DIR="${PROJECT_ROOT}/playwright-report"

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Docker-based test execution script for API Test Agent

OPTIONS:
    -h, --help              Show this help message
    -b, --build             Force rebuild Docker image
    -c, --clean             Clean up containers and volumes before running
    -w, --watch             Run tests in watch mode (development)
    -t, --type TYPE         Test type to run (unit|integration|e2e|playwright|all)
    -v, --verbose           Verbose output
    --no-cache              Build Docker image without cache
    --coverage              Run tests with coverage report
    --interactive           Run container in interactive mode

EXAMPLES:
    $0                      # Run all tests
    $0 --build              # Rebuild image and run tests
    $0 --type unit          # Run unit tests only
    $0 --watch              # Run tests in watch mode
    $0 --coverage           # Run tests with coverage
    $0 --clean --build      # Clean rebuild and run tests

EOF
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handler
error_handler() {
    local line_number=$1
    log_error "Script failed at line ${line_number}"
    cleanup_on_error
    exit 1
}

trap 'error_handler ${LINENO}' ERR

# Cleanup function
cleanup_containers() {
    log_info "Cleaning up existing containers..."

    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "Removing existing container: ${CONTAINER_NAME}"
        docker rm -f "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    fi

    if docker ps -a --format '{{.Names}}' | grep -q "^api-test-dev$"; then
        log_info "Removing development container"
        docker rm -f api-test-dev > /dev/null 2>&1 || true
    fi
}

cleanup_volumes() {
    log_info "Cleaning up Docker volumes..."
    docker volume prune -f > /dev/null 2>&1 || true
}

cleanup_results() {
    log_info "Cleaning up previous test results..."
    rm -rf "${TEST_RESULTS_DIR}" "${COVERAGE_DIR}" "${PLAYWRIGHT_REPORT_DIR}"
    mkdir -p "${TEST_RESULTS_DIR}" "${COVERAGE_DIR}" "${PLAYWRIGHT_REPORT_DIR}"
}

cleanup_on_error() {
    log_warning "Cleaning up after error..."
    docker logs "${CONTAINER_NAME}" 2>/dev/null || true
}

# Build Docker image
build_image() {
    local no_cache=""
    if [ "${NO_CACHE}" = true ]; then
        no_cache="--no-cache"
    fi

    log_info "Building Docker image: ${IMAGE_NAME}"
    log_info "Build args: ${no_cache}"

    if [ "${VERBOSE}" = true ]; then
        docker build ${no_cache} \
            --target test-runner \
            --tag "${IMAGE_NAME}:latest" \
            --tag "${IMAGE_NAME}:$(git rev-parse --short HEAD 2>/dev/null || echo 'dev')" \
            "${PROJECT_ROOT}"
    else
        docker build ${no_cache} \
            --target test-runner \
            --tag "${IMAGE_NAME}:latest" \
            --tag "${IMAGE_NAME}:$(git rev-parse --short HEAD 2>/dev/null || echo 'dev')" \
            "${PROJECT_ROOT}" > /dev/null
    fi

    log_success "Docker image built successfully"
}

# Check if image exists
image_exists() {
    docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}:latest$"
}

# Run tests in Docker container
run_tests() {
    local test_command=""

    # Determine test command based on type
    case "${TEST_TYPE}" in
        unit)
            test_command="npm run test:unit"
            ;;
        integration)
            test_command="npm run test:integration"
            ;;
        e2e)
            test_command="npm run test:e2e"
            ;;
        playwright)
            test_command="npm run test:playwright"
            ;;
        all)
            if [ "${COVERAGE}" = true ]; then
                test_command="npm run test:coverage -- --run"
            else
                test_command="npm run test"
            fi
            ;;
        *)
            log_error "Invalid test type: ${TEST_TYPE}"
            usage
            exit 1
            ;;
    esac

    # Add coverage flag if requested
    if [ "${COVERAGE}" = true ] && [ "${TEST_TYPE}" != "all" ]; then
        test_command="${test_command} -- --coverage"
    fi

    log_info "Running tests with command: ${test_command}"
    log_info "Test type: ${TEST_TYPE}"
    log_info "Container: ${CONTAINER_NAME}"

    # Prepare docker run command
    local docker_opts="-e FORCE_COLOR=1"

    if [ "${INTERACTIVE}" = true ]; then
        docker_opts="${docker_opts} -it"
    fi

    # Run container using docker-compose
    if [ "${WATCH_MODE}" = true ]; then
        log_info "Starting tests in watch mode..."
        docker-compose up test-dev
    else
        log_info "Running tests in container..."

        # Use docker-compose for consistent environment
        docker-compose run --rm \
            --name "${CONTAINER_NAME}" \
            test-runner \
            sh -c "${test_command}"
    fi

    local exit_code=$?

    if [ ${exit_code} -eq 0 ]; then
        log_success "Tests completed successfully"
    else
        log_error "Tests failed with exit code: ${exit_code}"
        return ${exit_code}
    fi
}

# Collect test results
collect_results() {
    log_info "Collecting test results..."

    # Check if results were generated
    if [ -d "${TEST_RESULTS_DIR}" ] && [ "$(ls -A ${TEST_RESULTS_DIR})" ]; then
        log_success "Test results collected in: ${TEST_RESULTS_DIR}"
    else
        log_warning "No test results found"
    fi

    if [ -d "${COVERAGE_DIR}" ] && [ "$(ls -A ${COVERAGE_DIR})" ]; then
        log_success "Coverage report collected in: ${COVERAGE_DIR}"

        # Display coverage summary if available
        if [ -f "${COVERAGE_DIR}/coverage-summary.json" ]; then
            log_info "Coverage summary:"
            cat "${COVERAGE_DIR}/coverage-summary.json" | jq '.total' 2>/dev/null || true
        fi
    fi

    if [ -d "${PLAYWRIGHT_REPORT_DIR}" ] && [ "$(ls -A ${PLAYWRIGHT_REPORT_DIR})" ]; then
        log_success "Playwright report collected in: ${PLAYWRIGHT_REPORT_DIR}"
    fi
}

# Display results summary
show_summary() {
    echo ""
    echo "========================================="
    echo "Test Execution Summary"
    echo "========================================="
    echo "Image: ${IMAGE_NAME}:latest"
    echo "Test Type: ${TEST_TYPE}"
    echo "Coverage: ${COVERAGE}"
    echo ""

    if [ -d "${TEST_RESULTS_DIR}" ]; then
        echo "Test Results: ${TEST_RESULTS_DIR}"
    fi

    if [ -d "${COVERAGE_DIR}" ] && [ "$(ls -A ${COVERAGE_DIR})" ]; then
        echo "Coverage Report: ${COVERAGE_DIR}/index.html"
    fi

    if [ -d "${PLAYWRIGHT_REPORT_DIR}" ] && [ "$(ls -A ${PLAYWRIGHT_REPORT_DIR})" ]; then
        echo "Playwright Report: ${PLAYWRIGHT_REPORT_DIR}/index.html"
    fi

    echo "========================================="
    echo ""
}

# Main function
main() {
    log_info "Starting Docker-based test execution"
    log_info "Project root: ${PROJECT_ROOT}"

    # Change to project root
    cd "${PROJECT_ROOT}"

    # Clean up if requested
    if [ "${CLEAN}" = true ]; then
        cleanup_containers
        cleanup_volumes
        cleanup_results
    fi

    # Build image if needed
    if [ "${BUILD}" = true ] || ! image_exists; then
        build_image
    else
        log_info "Using existing Docker image"
    fi

    # Ensure result directories exist
    mkdir -p "${TEST_RESULTS_DIR}" "${COVERAGE_DIR}" "${PLAYWRIGHT_REPORT_DIR}"

    # Run tests
    run_tests

    # Collect results
    collect_results

    # Show summary
    show_summary

    # Cleanup containers
    if [ "${CLEAN}" = true ]; then
        cleanup_containers
    fi

    log_success "Test execution completed"
}

# Parse command line arguments
BUILD=false
CLEAN=false
WATCH_MODE=false
TEST_TYPE="all"
VERBOSE=false
NO_CACHE=false
COVERAGE=false
INTERACTIVE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -w|--watch)
            WATCH_MODE=true
            shift
            ;;
        -t|--type)
            TEST_TYPE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            BUILD=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --interactive)
            INTERACTIVE=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main
