#!/bin/bash

echo "🌐 Internet Computer Network Latency Test"
echo "=========================================="

# Read canister IDs from canister_ids.json
BACKEND_ID=$(cat canister_ids.json | grep -A2 '"journal_backend"' | grep '"ic"' | cut -d'"' -f4)
FRONTEND_ID=$(cat canister_ids.json | grep -A2 '"journal_frontend"' | grep '"ic"' | cut -d'"' -f4)

echo "Backend Canister: $BACKEND_ID"
echo "Frontend Canister: $FRONTEND_ID"
echo ""

# Test ping to IC boundary nodes
echo "1. Ping Test to IC Boundary Nodes:"
echo "-----------------------------------"
ping -c 3 ic0.app | tail -1

echo ""
echo "2. HTTP Response Times:"
echo "----------------------"

# Test backend canister
echo "🔧 Backend Canister ($BACKEND_ID):"
curl -o /dev/null -s -w "  Total: %{time_total}s | DNS: %{time_namelookup}s | Connect: %{time_connect}s | Response: %{time_starttransfer}s\n" \
  "https://$BACKEND_ID.icp0.io/"

# Test frontend canister  
echo "🎨 Frontend Canister ($FRONTEND_ID):"
curl -o /dev/null -s -w "  Total: %{time_total}s | DNS: %{time_namelookup}s | Connect: %{time_connect}s | Response: %{time_starttransfer}s\n" \
  "https://$FRONTEND_ID.icp0.io/"

echo ""
echo "3. Multiple Boundary Node Tests:"
echo "-------------------------------"

# Test different boundary nodes
BOUNDARY_NODES=("ic0.app" "icp0.io" "icp-api.io")

for node in "${BOUNDARY_NODES[@]}"; do
  echo "📡 Testing $node:"
  curl -o /dev/null -s -w "  Response Time: %{time_total}s\n" "https://$node/" 2>/dev/null || echo "  ❌ Failed to connect"
done

echo ""
echo "4. Canister Query Performance:"
echo "-----------------------------"

# Test an actual API call if dfx is available
if command -v dfx &> /dev/null; then
  echo "🔍 Testing getOwnHomepage query..."
  time dfx canister call journal_backend getOwnHomepage --network ic 2>/dev/null || echo "  ❌ Query failed (might need authentication)"
else
  echo "  ❌ dfx not available for query testing"
fi

echo ""
echo "📊 Performance Guidelines:"
echo "  🟢 Excellent: < 200ms"
echo "  🟡 Good: 200ms - 500ms" 
echo "  🟠 Slow: 500ms - 1000ms"
echo "  🔴 Very Slow: > 1000ms"