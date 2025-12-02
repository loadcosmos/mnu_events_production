#!/bin/bash

# ============================================================================
# MNU Events Platform - Development Environment Startup Script
# ============================================================================
# This script starts the fully containerized development environment using
# docker-compose. It handles service startup, health checks, database setup,
# and provides helpful information for daily development use.
# ============================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emoji indicators
ROCKET="🚀"
HOURGLASS="⏳"
CHECK="✅"
CROSS="❌"
INFO="ℹ️"
WRENCH="🔧"
DATABASE="🗄️"
GLOBE="🌐"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_info() {
    echo -e "${YELLOW}${INFO} $1${NC}"
}

print_step() {
    echo -e "${BLUE}${HOURGLASS} $1${NC}"
}

# ============================================================================
# Main Script
# ============================================================================

print_header "${ROCKET} Starting MNU Events Development Environment"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed or not in PATH"
    exit 1
fi

# Step 1: Stop any existing containers
print_step "Stopping any existing containers..."
docker-compose down > /dev/null 2>&1
print_success "Previous containers stopped"

# Step 2: Build and start all services
print_step "Building and starting all services (postgres, pgadmin, backend, frontend)..."
if docker-compose up --build -d; then
    print_success "All services started in detached mode"
else
    print_error "Failed to start services"
    exit 1
fi

# Step 3: Wait for services to be healthy
print_step "Waiting for services to be healthy..."
echo -e "${YELLOW}   This may take 30-60 seconds...${NC}"

# Wait for postgres to be ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U mnu_user > /dev/null 2>&1; then
        print_success "PostgreSQL is ready"
        break
    fi
    attempt=$((attempt + 1))
    echo -ne "   Waiting for PostgreSQL... ($attempt/$max_attempts)\r"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "PostgreSQL failed to become healthy"
    print_info "Check logs with: docker-compose logs postgres"
    exit 1
fi

# Give other services a moment to initialize
sleep 5

# Check if backend service exists in docker-compose
if docker-compose ps | grep -q backend; then
    # Step 4: Run Prisma migrations
    print_step "Running Prisma migrations in backend container..."
    if docker-compose exec -T backend npx prisma migrate dev --name auto_migration; then
        print_success "Prisma migrations completed"
    else
        print_error "Prisma migrations failed (this might be okay if already migrated)"
    fi

    # Step 5: Seed the database
    print_step "Seeding database with initial data..."
    if docker-compose exec -T backend npx prisma db seed; then
        print_success "Database seeded successfully"
    else
        print_error "Database seeding failed (this might be okay if already seeded)"
    fi
else
    print_info "Backend service not found in docker-compose.yml - skipping migrations and seeding"
fi

# Step 6: Display service status
print_header "${CHECK} Services Running Successfully!"

echo -e "${GREEN}Active Services:${NC}"
docker-compose ps

echo ""
print_header "${GLOBE} Service URLs"

echo -e "${CYAN}Frontend:${NC}     http://localhost:5173"
echo -e "${CYAN}Backend API:${NC}  http://localhost:3001"
echo -e "${CYAN}API Docs:${NC}     http://localhost:3001/api/docs"
echo -e "${CYAN}PgAdmin:${NC}      http://localhost:5050"
echo -e "                ${YELLOW}Email:${NC} admin@mnuevents.kz"
echo -e "                ${YELLOW}Password:${NC} admin"
echo ""
echo -e "${CYAN}Test Accounts (Password: Password123!):${NC}"
echo -e "  ${GREEN}Admin:${NC}      admin@kazguu.kz"
echo -e "  ${GREEN}Organizer:${NC}  organizer@kazguu.kz"
echo -e "  ${GREEN}Moderator:${NC}  moderator@kazguu.kz"
echo -e "  ${GREEN}Student:${NC}    student1@kazguu.kz"
echo ""
print_header "${WRENCH} Helpful Commands"

echo -e "${YELLOW}View all logs:${NC}"
echo -e "  docker-compose logs -f"
echo ""
echo -e "${YELLOW}View specific service logs:${NC}"
echo -e "  docker-compose logs -f [service]"
echo -e "  Example: docker-compose logs -f backend"
echo ""
echo -e "${YELLOW}Stop all services:${NC}"
echo -e "  docker-compose down"
echo ""
echo -e "${YELLOW}Restart a service:${NC}"
echo -e "  docker-compose restart [service]"
echo -e "  Example: docker-compose restart backend"
echo ""
echo -e "${YELLOW}Rebuild and restart:${NC}"
echo -e "  docker-compose up --build"
echo ""
echo -e "${YELLOW}Clean everything (including volumes):${NC}"
echo -e "  docker-compose down -v"
echo -e "  ${RED}WARNING: This will delete all database data!${NC}"
echo ""
echo -e "${YELLOW}Execute command in container:${NC}"
echo -e "  docker-compose exec [service] [command]"
echo -e "  Example: docker-compose exec backend npm run test"
echo ""
echo -e "${YELLOW}Access container shell:${NC}"
echo -e "  docker-compose exec [service] sh"
echo -e "  Example: docker-compose exec backend sh"

echo ""
print_header "${ROCKET} Development Environment Ready!"

print_success "All services are up and running!"
print_info "Press Ctrl+C to view this information again, or use the commands above"

echo ""
