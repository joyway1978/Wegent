#!/bin/bash

# Wegent Integration Tests Runner
# This script handles dependency installation, authentication setup, and test execution

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTH_FILE="$SCRIPT_DIR/.auth/user.json"
NODE_MODULES="$SCRIPT_DIR/node_modules"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dependencies are installed
check_dependencies() {
    if [ ! -d "$NODE_MODULES" ]; then
        return 1
    fi

    # Check if @playwright/test is installed
    if [ ! -d "$NODE_MODULES/@playwright" ]; then
        return 1
    fi

    return 0
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    cd "$SCRIPT_DIR"
    npm install

    print_info "Installing Playwright browsers..."
    npx playwright install chromium

    print_success "Dependencies installed successfully!"
}

# Check if auth state exists and is valid
check_auth() {
    if [ ! -f "$AUTH_FILE" ]; then
        return 1
    fi

    # Check if file is not empty and has valid JSON
    if [ ! -s "$AUTH_FILE" ]; then
        return 1
    fi

    # Basic check for auth_token in the file
    if grep -q "auth_token" "$AUTH_FILE" 2>/dev/null; then
        return 0
    fi

    return 1
}

# Run authentication setup
setup_auth() {
    print_info "Starting authentication setup..."
    print_info "A browser will open. Please scan the QR code to login."
    echo ""

    cd "$SCRIPT_DIR"
    npx ts-node setup-auth.ts

    if check_auth; then
        print_success "Authentication setup completed!"
    else
        print_error "Authentication setup failed. Please try again."
        exit 1
    fi
}

# Run tests
run_tests() {
    local mode=$1

    cd "$SCRIPT_DIR"

    case $mode in
        "headed")
            print_info "Running tests in headed mode (with browser UI)..."
            npm run test:headed
            ;;
        "headless")
            print_info "Running tests in headless mode..."
            npm test
            ;;
        "debug")
            print_info "Running tests in debug mode..."
            npm run test:debug
            ;;
        *)
            print_error "Unknown mode: $mode"
            exit 1
            ;;
    esac
}

# Show usage
show_usage() {
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --headed     Run tests with browser UI visible"
    echo "  -l, --headless   Run tests without browser UI (default)"
    echo "  -d, --debug      Run tests in debug mode"
    echo "  -a, --auth       Force re-authentication (re-scan QR code)"
    echo "  -i, --install    Force reinstall dependencies"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0               # Run tests in headless mode"
    echo "  $0 -h            # Run tests with browser visible"
    echo "  $0 -a            # Re-authenticate and run tests"
    echo ""
}

# Main script
main() {
    local mode="headless"
    local force_auth=false
    local force_install=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--headed)
                mode="headed"
                shift
                ;;
            -l|--headless)
                mode="headless"
                shift
                ;;
            -d|--debug)
                mode="debug"
                shift
                ;;
            -a|--auth)
                force_auth=true
                shift
                ;;
            -i|--install)
                force_install=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    echo ""
    echo "=========================================="
    echo "   Wegent Integration Tests Runner"
    echo "=========================================="
    echo ""

    # Step 1: Check and install dependencies
    if [ "$force_install" = true ] || ! check_dependencies; then
        print_warning "Dependencies not found or force install requested."
        install_dependencies
    else
        print_success "Dependencies already installed."
    fi

    echo ""

    # Step 2: Check and setup authentication
    if [ "$force_auth" = true ]; then
        print_warning "Force re-authentication requested."
        setup_auth
    elif ! check_auth; then
        print_warning "Authentication state not found."
        setup_auth
    else
        print_success "Authentication state found."
    fi

    echo ""

    # Step 3: Run tests
    print_info "Test mode: $mode"
    echo ""
    run_tests "$mode"
}

# Run main function
main "$@"
