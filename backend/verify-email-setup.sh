#!/bin/bash

# Email Configuration Verification Script
# Run this before deploying to verify everything is set up correctly

echo "======================================================================"
echo "  📧 EMAIL CONFIGURATION VERIFICATION FOR DEPLOYMENT"
echo "======================================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Error: Not in backend directory${NC}"
    echo "Please run this script from the backend directory:"
    echo "  cd backend && bash verify-email-setup.sh"
    exit 1
fi

echo "Step 1: Checking local environment variables..."
echo "----------------------------------------------------------------------"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo "Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠ .env file created. Please edit it with your credentials.${NC}"
    fi
fi

# Load .env file
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✓ .env file found${NC}"
else
    echo -e "${RED}✗ .env file still missing${NC}"
    exit 1
fi

# Check EMAIL_USER
if [ -z "$EMAIL_USER" ]; then
    echo -e "${RED}✗ EMAIL_USER not set${NC}"
    EMAIL_USER_STATUS="NOT SET"
else
    echo -e "${GREEN}✓ EMAIL_USER is set: $EMAIL_USER${NC}"
    EMAIL_USER_STATUS="SET"
fi

# Check EMAIL_PASS
if [ -z "$EMAIL_PASS" ]; then
    echo -e "${RED}✗ EMAIL_PASS not set${NC}"
    EMAIL_PASS_STATUS="NOT SET"
else
    PASS_LENGTH=${#EMAIL_PASS}
    echo -e "${GREEN}✓ EMAIL_PASS is set (${PASS_LENGTH} characters)${NC}"
    
    if [ $PASS_LENGTH -eq 16 ]; then
        echo -e "${GREEN}  ✓ Length is correct (16 chars - typical App Password)${NC}"
    else
        echo -e "${YELLOW}  ⚠ Length is ${PASS_LENGTH} chars (App Passwords are usually 16)${NC}"
    fi
    
    # Check for spaces
    if [[ "$EMAIL_PASS" =~ [[:space:]] ]]; then
        echo -e "${RED}  ✗ PASSWORD CONTAINS SPACES - Remove them!${NC}"
        echo -e "${RED}  This will cause authentication to fail on Render${NC}"
    else
        echo -e "${GREEN}  ✓ No spaces in password${NC}"
    fi
    
    EMAIL_PASS_STATUS="SET"
fi

echo ""
echo "Step 2: Testing email functionality..."
echo "----------------------------------------------------------------------"

# Run the diagnostic tool
if [ -f "diagnose-email.js" ]; then
    echo "Running email diagnostic..."
    node diagnose-email.js
    DIAG_EXIT_CODE=$?
    
    if [ $DIAG_EXIT_CODE -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Email diagnostic passed!${NC}"
        EMAIL_TEST="PASSED"
    else
        echo ""
        echo -e "${RED}❌ Email diagnostic failed!${NC}"
        EMAIL_TEST="FAILED"
    fi
else
    echo -e "${YELLOW}⚠ diagnose-email.js not found, skipping email test${NC}"
    EMAIL_TEST="SKIPPED"
fi

echo ""
echo "======================================================================"
echo "  📋 VERIFICATION SUMMARY"
echo "======================================================================"
echo ""
echo "Local Configuration:"
echo "  EMAIL_USER: $EMAIL_USER_STATUS"
echo "  EMAIL_PASS: $EMAIL_PASS_STATUS"
echo "  Email Test: $EMAIL_TEST"
echo ""

if [ "$EMAIL_USER_STATUS" = "SET" ] && [ "$EMAIL_PASS_STATUS" = "SET" ] && [ "$EMAIL_TEST" = "PASSED" ]; then
    echo -e "${GREEN}✅ LOCAL SETUP IS CORRECT!${NC}"
    echo ""
    echo "======================================================================"
    echo "  🚀 READY FOR RENDER DEPLOYMENT"
    echo "======================================================================"
    echo ""
    echo "Next steps for Render:"
    echo ""
    echo "1. Log into Render Dashboard:"
    echo "   https://dashboard.render.com"
    echo ""
    echo "2. Open your backend service and go to 'Environment' tab"
    echo ""
    echo "3. Add these environment variables:"
    echo -e "   ${BLUE}EMAIL_USER${NC} = ${GREEN}$EMAIL_USER${NC}"
    echo -e "   ${BLUE}EMAIL_PASS${NC} = ${GREEN}[Your 16-char App Password - NO SPACES]${NC}"
    echo ""
    echo "4. Save and wait for Render to redeploy (~2-3 minutes)"
    echo ""
    echo "5. Test by registering for an event on your live site"
    echo ""
    echo "======================================================================"
    echo ""
    echo "📖 For detailed instructions, see:"
    echo "   - DIAGNOSIS_SUMMARY.md (complete guide)"
    echo "   - QUICK_EMAIL_FIX.md (5-minute checklist)"
    echo "   - EMAIL_FIX_GUIDE.md (troubleshooting)"
    echo ""
else
    echo -e "${RED}❌ LOCAL SETUP HAS ISSUES${NC}"
    echo ""
    echo "Please fix the issues above before deploying to Render."
    echo ""
    echo "Common fixes:"
    echo "  - Add EMAIL_USER and EMAIL_PASS to your .env file"
    echo "  - Use Gmail App Password (not regular password)"
    echo "  - Remove spaces from EMAIL_PASS"
    echo "  - Enable 2FA on Gmail: https://myaccount.google.com/security"
    echo "  - Generate App Password: https://myaccount.google.com/apppasswords"
    echo ""
    exit 1
fi

echo "======================================================================"
