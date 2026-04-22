#!/bin/bash

# POS Kasir Quick Setup Script
# This script will setup the POS system with demo data

echo "=================================="
echo "POS Kasir - Quick Setup"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and configure your database"
    exit 1
fi

echo "📦 Installing dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader
npm install

echo ""
echo "🔧 Running migrations..."
php artisan migrate --force

echo ""
echo "🌱 Seeding database..."
echo "  - Creating roles and users (Kasir & Admin)..."
php artisan db:seed --class=POSSetupSeeder

echo "  - Creating sales users..."
php artisan db:seed --class=SalesSeeder

echo "  - Creating membership tiers and members..."
php artisan db:seed --class=MembershipSeeder

echo ""
echo "🔑 Generating application key (if not set)..."
php artisan key:generate --force

echo ""
echo "🎨 Building frontend assets..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "=================================="
echo "Login Credentials"
echo "=================================="
echo ""
echo "Admin:"
echo "  URL: http://localhost/login"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""
echo "Kasir:"
echo "  Email: kasir01@example.com"
echo "  Password: password"
echo ""
echo "Sales:"
echo "  Email: sales01@example.com"
echo "  Password: password"
echo ""
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Start the development server:"
echo "   php artisan serve"
echo ""
echo "2. Open browser and go to:"
echo "   http://localhost:8000"
echo ""
echo "3. Login with credentials above"
echo ""
echo "4. For kasir: Go to /pos to start"
echo ""
echo "📖 Read POS_SETUP_GUIDE.md for detailed instructions"
echo ""
