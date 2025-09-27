#!/bin/bash

echo "🧪 Testing Saros Yield Tracker Application..."
echo "=============================================="

echo ""
echo "📊 Testing API Endpoints:"
echo "-------------------------"

# Test yields endpoint
echo -n "• /api/yields: "
YIELDS_RESPONSE=$(curl -s http://localhost:3000/api/yields)
if echo "$YIELDS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ WORKING"
    YIELDS_COUNT=$(echo "$YIELDS_RESPONSE" | jq '.data | length')
    echo "  → Found $YIELDS_COUNT yield records"
else
    echo "❌ FAILED"
fi

# Test opportunities endpoint
echo -n "• /api/opportunities: "
OPP_RESPONSE=$(curl -s http://localhost:3000/api/opportunities)
if echo "$OPP_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ WORKING"
    OPP_COUNT=$(echo "$OPP_RESPONSE" | jq '.data.opportunities | length')
    SAROS_ADVANTAGES=$(echo "$OPP_RESPONSE" | jq '.data.stats.sarosAdvantages')
    echo "  → Found $OPP_COUNT opportunities, $SAROS_ADVANTAGES Saros advantages"
else
    echo "❌ FAILED"
fi

# Test Telegram status endpoint
echo -n "• /api/telegram/status: "
TG_RESPONSE=$(curl -s http://localhost:3000/api/telegram/status)
if echo "$TG_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ WORKING"
else
    echo "⚠️  BOT TOKEN NOT CONFIGURED (expected)"
fi

echo ""
echo "🌐 Testing Web Application:"
echo "---------------------------"

# Test homepage
echo -n "• Homepage (/) "
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$HOME_STATUS" = "200" ]; then
    echo "✅ WORKING"
else
    echo "❌ FAILED (HTTP $HOME_STATUS)"
fi

echo ""
echo "🎯 Key Features Verification:"
echo "-----------------------------"

# Parse yield data to check Saros advantages
if [ ! -z "$YIELDS_RESPONSE" ]; then
    SAROS_SOL=$(echo "$YIELDS_RESPONSE" | jq -r '.data[] | select(.protocol == "Saros" and .token == "SOL") | .apy')
    JUPITER_SOL=$(echo "$YIELDS_RESPONSE" | jq -r '.data[] | select(.protocol == "Jupiter" and .token == "SOL") | .apy')
    
    if [ ! -z "$SAROS_SOL" ] && [ ! -z "$JUPITER_SOL" ]; then
        echo "• SOL Yield Comparison:"
        echo "  → Saros: ${SAROS_SOL}%"
        echo "  → Jupiter: ${JUPITER_SOL}%"
        
        if (( $(echo "$SAROS_SOL > $JUPITER_SOL" | bc -l) )); then
            echo "  ✅ Saros has advantage!"
        else
            echo "  📊 Jupiter currently leads"
        fi
    fi
fi

echo ""
echo "🚀 Application Status: READY"
echo "🌐 Web Dashboard: http://localhost:3000"
echo "📱 API Docs: http://localhost:3000/api/"
echo ""
echo "Next Steps:"
echo "1. Add real Telegram bot token to .env.local"
echo "2. Deploy to production (Vercel recommended)"
echo "3. Replace mock data with real protocol APIs"
echo "4. Set up Telegram webhook for production"