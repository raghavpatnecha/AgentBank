#!/bin/bash

# ci-test.sh - CI/CD optimized test execution script
# Runs tests in Docker with caching, parallel execution, and result aggregation

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# CI configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
IMAGE_NAME="${DOCKER_IMAGE:-api-test-agent}"
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
TAG="${GITHUB_SHA:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

# Result directories
TEST_RESULTS_DIR="${PROJECT_ROOT}/test-results"
COVERAGE_DIR="${PROJECT_ROOT}/coverage"
PLAYWRIGHT_REPORT_DIR="${PROJECT_ROOT}/playwright-report"

# CI flags
IS_CI="${CI:-false}"
IS_GITHUB_ACTIONS="${GITHUB_ACTIONS:-false}"
PARALLEL="${PARALLEL:-true}"
CACHE_FROM="${CACHE_FROM:-true}"

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
    log_error "CI test script failed at line ${line_number}"

    # Dump container logs on failure
    docker-compose -f docker-compose.ci.yml logs || true

    # Cleanup
    cleanup

    exit 1
}

trap 'error_handler ${LINENO}' ERR

# Cleanup function
cleanup() {
    log_info "Cleaning up CI environment..."

    # Stop and remove containers
    docker-compose -f docker-compose.ci.yml down --volumes --remove-orphans 2>/dev/null || true

    # Remove dangling images (optional, saves space)
    if [ "${CLEANUP_IMAGES:-false}" = "true" ]; then
        docker image prune -f > /dev/null 2>&1 || true
    fi
}

# Setup CI environment
setup_ci_env() {
    log_info "Setting up CI environment"
    log_info "CI: ${IS_CI}"
    log_info "GitHub Actions: ${IS_GITHUB_ACTIONS}"
    log_info "Image: ${FULL_IMAGE}"

    # Create result directories
    mkdir -p "${TEST_RESULTS_DIR}" "${COVERAGE_DIR}" "${PLAYWRIGHT_REPORT_DIR}"

    # Export environment variables for docker-compose
    export DOCKER_REGISTRY="${REGISTRY}"
    export DOCKER_IMAGE="${IMAGE_NAME}"
    export GITHUB_SHA="${TAG}"
    export BUILDKIT_PROGRESS=plain

    # Enable Docker BuildKit for better caching
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1

    log_success "CI environment configured"
}

# Pull cache images
pull_cache() {
    if [ "${CACHE_FROM}" = "true" ]; then
        log_info "Pulling cache images..."

        # Try to pull latest image for cache
        docker pull "${REGISTRY}/${IMAGE_NAME}:latest" 2>/dev/null || {
            log_warning "Could not pull cache image, building from scratch"
        }
    fi
}

# Build Docker image with caching
build_image() {
    log_info "Building Docker image for CI"

    local cache_args=""
    if [ "${CACHE_FROM}" = "true" ]; then
        cache_args="--cache-from ${REGISTRY}/${IMAGE_NAME}:latest"
    fi

    # Build using docker-compose for consistency
    docker-compose -f docker-compose.ci.yml build ${cache_args}

    log_success "Docker image built: ${FULL_IMAGE}"
}

# Run tests in parallel
run_parallel_tests() {
    log_info "Running tests in parallel mode"

    # Start all services in parallel
    docker-compose -f docker-compose.ci.yml up \
        --abort-on-container-exit \
        --exit-code-from test-runner \
        lint typecheck test-runner

    local exit_code=$?

    if [ ${exit_code} -eq 0 ]; then
        log_success "All parallel tests passed"
    else
        log_error "Parallel tests failed with exit code: ${exit_code}"
        return ${exit_code}
    fi
}

# Run tests sequentially
run_sequential_tests() {
    log_info "Running tests in sequential mode"

    # Run lint
    log_info "Running linter..."
    docker-compose -f docker-compose.ci.yml run --rm lint

    # Run type check
    log_info "Running type check..."
    docker-compose -f docker-compose.ci.yml run --rm typecheck

    # Run main tests
    log_info "Running test suite..."
    docker-compose -f docker-compose.ci.yml run --rm test-runner

    log_success "All sequential tests passed"
}

# Collect and aggregate results
collect_results() {
    log_info "Collecting test results..."

    # Check test results
    if [ -d "${TEST_RESULTS_DIR}" ] && [ "$(ls -A ${TEST_RESULTS_DIR} 2>/dev/null)" ]; then
        log_success "Test results collected: $(find ${TEST_RESULTS_DIR} -type f | wc -l) files"

        # List result files
        find "${TEST_RESULTS_DIR}" -type f -exec basename {} \; | while read file; do
            log_info "  - ${file}"
        done
    else
        log_warning "No test results found in ${TEST_RESULTS_DIR}"
    fi

    # Check coverage
    if [ -d "${COVERAGE_DIR}" ] && [ "$(ls -A ${COVERAGE_DIR} 2>/dev/null)" ]; then
        log_success "Coverage report collected"

        # Display coverage summary
        if [ -f "${COVERAGE_DIR}/coverage-summary.json" ]; then
            log_info "Coverage summary:"

            # Extract coverage percentages using basic tools
            if command -v jq &> /dev/null; then
                jq -r '.total | to_entries[] | "\(.key): \(.value.pct)%"' \
                    "${COVERAGE_DIR}/coverage-summary.json" | while read line; do
                    log_info "  ${line}"
                done
            else
                log_warning "jq not found, skipping coverage summary"
            fi
        fi
    else
        log_warning "No coverage report found"
    fi

    # Check Playwright results
    if [ -d "${PLAYWRIGHT_REPORT_DIR}" ] && [ "$(ls -A ${PLAYWRIGHT_REPORT_DIR} 2>/dev/null)" ]; then
        log_success "Playwright report collected"
    fi
}

# Generate CI artifacts
generate_artifacts() {
    log_info "Generating CI artifacts..."

    # Create artifacts directory
    local artifacts_dir="${PROJECT_ROOT}/artifacts"
    mkdir -p "${artifacts_dir}"

    # Copy all results to artifacts
    if [ -d "${TEST_RESULTS_DIR}" ] && [ "$(ls -A ${TEST_RESULTS_DIR})" ]; then
        cp -r "${TEST_RESULTS_DIR}" "${artifacts_dir}/"
    fi

    if [ -d "${COVERAGE_DIR}" ] && [ "$(ls -A ${COVERAGE_DIR})" ]; then
        cp -r "${COVERAGE_DIR}" "${artifacts_dir}/"
    fi

    if [ -d "${PLAYWRIGHT_REPORT_DIR}" ] && [ "$(ls -A ${PLAYWRIGHT_REPORT_DIR})" ]; then
        cp -r "${PLAYWRIGHT_REPORT_DIR}" "${artifacts_dir}/"
    fi

    # Create summary file
    cat > "${artifacts_dir}/summary.txt" << EOF
CI Test Execution Summary
=========================

Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Image: ${FULL_IMAGE}
CI: ${IS_CI}
GitHub Actions: ${IS_GITHUB_ACTIONS}
Parallel: ${PARALLEL}

Build Information:
- Git SHA: ${GITHUB_SHA:-N/A}
- Git Ref: ${GITHUB_REF:-N/A}
- Run ID: ${GITHUB_RUN_ID:-N/A}
- Run Number: ${GITHUB_RUN_NUMBER:-N/A}

Test Results:
- Location: ${TEST_RESULTS_DIR}
- Files: $(find ${TEST_RESULTS_DIR} -type f 2>/dev/null | wc -l)

Coverage:
- Location: ${COVERAGE_DIR}
- Report: ${COVERAGE_DIR}/index.html

Playwright:
- Location: ${PLAYWRIGHT_REPORT_DIR}
- Report: ${PLAYWRIGHT_REPORT_DIR}/index.html

EOF

    log_success "Artifacts generated in: ${artifacts_dir}"
}

# Display summary
show_summary() {
    echo ""
    echo "========================================="
    echo "CI Test Execution Summary"
    echo "========================================="
    echo "Image: ${FULL_IMAGE}"
    echo "Parallel: ${PARALLEL}"
    echo ""
    echo "Results:"
    echo "  - Test Results: ${TEST_RESULTS_DIR}"
    echo "  - Coverage: ${COVERAGE_DIR}/index.html"
    echo "  - Playwright: ${PLAYWRIGHT_REPORT_DIR}/index.html"
    echo ""

    if [ -f "${PROJECT_ROOT}/artifacts/summary.txt" ]; then
        echo "Artifacts: ${PROJECT_ROOT}/artifacts"
    fi

    echo "========================================="
    echo ""
}

# GitHub Actions specific output
github_actions_output() {
    if [ "${IS_GITHUB_ACTIONS}" = "true" ]; then
        log_info "Setting GitHub Actions outputs"

        # Set outputs for use in workflow
        echo "test-results-path=${TEST_RESULTS_DIR}" >> $GITHUB_OUTPUT
        echo "coverage-path=${COVERAGE_DIR}" >> $GITHUB_OUTPUT
        echo "playwright-report-path=${PLAYWRIGHT_REPORT_DIR}" >> $GITHUB_OUTPUT

        # Create annotations for coverage
        if [ -f "${COVERAGE_DIR}/coverage-summary.json" ] && command -v jq &> /dev/null; then
            local lines_pct=$(jq -r '.total.lines.pct' "${COVERAGE_DIR}/coverage-summary.json")
            echo "::notice::Code coverage: ${lines_pct}%"
        fi
    fi
}

# Main function
main() {
    log_info "Starting CI test execution"
    log_info "Project root: ${PROJECT_ROOT}"

    # Change to project root
    cd "${PROJECT_ROOT}"

    # Setup CI environment
    setup_ci_env

    # Pull cache images
    pull_cache

    # Build Docker image
    build_image

    # Run tests
    if [ "${PARALLEL}" = "true" ]; then
        run_parallel_tests
    else
        run_sequential_tests
    fi

    # Collect results
    collect_results

    # Generate artifacts
    generate_artifacts

    # GitHub Actions output
    github_actions_output

    # Show summary
    show_summary

    # Cleanup
    cleanup

    log_success "CI test execution completed successfully"
}

# Handle script termination
cleanup_on_exit() {
    log_info "Script terminated, cleaning up..."
    cleanup
}

trap cleanup_on_exit EXIT

# Run main function
main

exit 0
