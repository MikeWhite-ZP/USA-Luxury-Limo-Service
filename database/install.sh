#!/bin/bash

# USA Luxury Limo Database Installation Script
# Quick installer for PostgreSQL database

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         USA Luxury Limo Database Installation            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set DATABASE_URL to your PostgreSQL connection string:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    exit 1
fi

echo "📊 Database URL detected: ${DATABASE_URL%%@*}@***"
echo ""

# Function to run SQL file
run_sql() {
    local file=$1
    local description=$2
    
    echo "📝 $description..."
    if psql "$DATABASE_URL" -f "$file" > /dev/null 2>&1; then
        echo "   ✓ Success"
        return 0
    else
        echo "   ✗ Failed"
        return 1
    fi
}

# Check PostgreSQL connection
echo "🔌 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "   ✓ Connected successfully"
else
    echo "   ✗ Connection failed"
    echo ""
    echo "Please check your DATABASE_URL and ensure PostgreSQL is running."
    exit 1
fi
echo ""

# Ask user what to install
echo "What would you like to install?"
echo ""
echo "1) Fresh install (schema only)"
echo "2) Fresh install with test data"
echo "3) Drop everything and reinstall with test data"
echo "4) Verify existing installation"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo ""
        echo "Installing schema only..."
        echo ""
        run_sql "database/schema.sql" "Creating database tables"
        echo ""
        echo "✅ Schema installation complete!"
        echo ""
        echo "Next steps:"
        echo "  • Start your application"
        echo "  • Create admin account via the application"
        echo "  • Configure payment providers"
        ;;
        
    2)
        echo ""
        echo "Installing schema and test data..."
        echo ""
        run_sql "database/schema.sql" "Creating database tables"
        run_sql "database/test-data.sql" "Loading test data"
        echo ""
        echo "✅ Installation complete!"
        echo ""
        echo "Test accounts created:"
        echo "  • Admin: admin@usaluxurylimo.com"
        echo "  • Dispatcher: dispatcher@usaluxurylimo.com"
        echo "  • 4 test passengers"
        echo "  • 3 test drivers"
        echo ""
        echo "Next steps:"
        echo "  • Start your application"
        echo "  • Log in with admin account"
        echo "  • Configure payment providers"
        ;;
        
    3)
        echo ""
        echo "⚠️  WARNING: This will DELETE all existing data!"
        read -p "Are you sure? Type 'yes' to continue: " confirm
        
        if [ "$confirm" = "yes" ]; then
            echo ""
            run_sql "database/drop-all.sql" "Dropping all tables"
            run_sql "database/schema.sql" "Creating database tables"
            run_sql "database/test-data.sql" "Loading test data"
            echo ""
            echo "✅ Complete reinstallation done!"
        else
            echo "Cancelled."
        fi
        ;;
        
    4)
        echo ""
        echo "Running verification checks..."
        echo ""
        psql "$DATABASE_URL" -f "database/verify.sql"
        ;;
        
    5)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════"
echo "For more information, see database/README.md"
echo "════════════════════════════════════════════════════════════"
