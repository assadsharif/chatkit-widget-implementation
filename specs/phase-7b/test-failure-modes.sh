#!/bin/bash
# Phase 7B Failure Mode Test Script
#
# Quick manual verification of error handling

echo "============================================================"
echo "Phase 7B Failure Mode Tests"
echo "============================================================"
echo

# Test 1: Backend Down
echo "Test 1: Backend Down"
echo "-------------------"
echo "1. Stop backend (Ctrl+C in backend terminal)"
echo "2. Open test.html in browser"
echo "3. Send message: 'Test offline'"
echo "Expected: 'Unable to connect to the service. Please check your connection.'"
echo
read -p "Press Enter when ready to continue..."
echo

# Test 2: Timeout (30s)
echo "Test 2: Request Timeout"
echo "-----------------------"
echo "Timeout is set to 30s by default."
echo "To test, add delay to backend:"
echo "  import asyncio"
echo "  await asyncio.sleep(35)  # Exceeds 30s timeout"
echo
echo "Expected: 'I'm offline right now, I'll reconnect shortly.'"
echo
read -p "Press Enter when ready to continue..."
echo

# Test 3: Rapid Failures
echo "Test 3: Rapid Repeated Failures"
echo "--------------------------------"
echo "1. Ensure backend is stopped"
echo "2. Send 5 messages rapidly"
echo "Expected: All 5 error messages appear, widget survives"
echo
read -p "Press Enter when ready to continue..."
echo

# Test 4: Network Offline
echo "Test 4: Network Offline"
echo "-----------------------"
echo "1. Open browser DevTools → Network tab"
echo "2. Enable 'Offline' mode"
echo "3. Send message"
echo "Expected: 'Unable to connect to the service...'"
echo
read -p "Press Enter when ready to continue..."
echo

echo "============================================================"
echo "All manual tests complete!"
echo "Check FAILURE_MODE_TESTS.md for detailed checklist"
echo "============================================================"
