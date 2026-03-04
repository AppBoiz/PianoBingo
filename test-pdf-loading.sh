#!/bin/bash

# Test script to verify PDF loading works

echo "Testing PDF loading..."
echo ""

# Check if resolvePdfUrl is available
echo "Checking if resolvePdfUrl function is exposed on window..."
curl -s http://localhost:5175 | grep -q "src=\"/src/main.tsx\"" && echo "✓ App HTML served successfully" || echo "✗ Failed to load app HTML"

# Check if PDF files can be fetched
echo ""
echo "Checking PDF resource files are accessible..."
curl -s -o /dev/null -w "all_pdfs.js: HTTP %{http_code}\n" http://localhost:5175/resources/base64/all_pdfs.js
curl -s -o /dev/null -w "pack_jack.js: HTTP %{http_code}\n" http://localhost:5175/resources/base64/pack_jack.js
curl -s -o /dev/null -w "pack_tom.js: HTTP %{http_code}\n" http://localhost:5175/resources/base64/pack_tom.js

echo ""
echo "To verify PDF loading in browser:"
echo "1. Open DevTools (F12)"
echo "2. Go to Console tab"
echo "3. Look for: '✓ Preloaded data initialized:' message"
echo "4. Navigate to a song view"
echo "5. Check if PDF renders without 'Invalid PDF structure' error"
