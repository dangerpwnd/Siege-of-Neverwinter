# API Key Setup Guide

This guide explains how to obtain and configure API keys for the Siege of Neverwinter application.

## Table of Contents
1. [OpenAI API Key (for AI Assistant)](#openai-api-key)
2. [Security Best Practices](#security-best-practices)
3. [Troubleshooting](#troubleshooting)

## OpenAI API Key

The AI Assistant feature uses OpenAI's ChatGPT API to provide narrative suggestions and rules guidance. You'll need an OpenAI API key to use this feature.

### Step 1: Create an OpenAI Account

1. Go to https://platform.openai.com/signup
2. Sign up with your email address or use Google/Microsoft authentication
3. Verify your email address if required

### Step 2: Add Payment Method

OpenAI's API is a paid service with usage-based pricing:

1. Log in to https://platform.openai.com
2. Click on your profile icon (top right)
3. Select "Billing" from the dropdown
4. Click "Add payment method"
5. Enter your credit card information

**Pricing Information** (as of 2024):
- GPT-3.5-turbo: ~$0.002 per 1K tokens (~750 words)
- GPT-4: ~$0.03 per 1K tokens (~750 words)
- Typical DM assistant query: $0.01-0.05

**Cost Management**:
- Set usage limits in the billing settings
- Start with a low limit (e.g., $10/month)
- Monitor usage in the OpenAI dashboard

### Step 3: Generate API Key

1. Navigate to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Give it a descriptive name (e.g., "Siege of Neverwinter")
4. Click "Create secret key"
5. **IMPORTANT**: Copy the key immediately - you won't be able to see it again!
6. Store it securely (see Security Best Practices below)

The key will look like: `sk-proj-...` (starts with `sk-`)

### Step 4: Configure in Application

#### Option A: Environment Variable (Recommended for Server)

1. Open the `.env` file in the project root
2. Add or update the line:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Save the file
4. Restart the server:
   ```bash
   npm start
   ```

#### Option B: Browser Storage (Recommended for Client)

1. Start the application and open it in your browser
2. Navigate to the AI Assistant module
3. Click the settings/gear icon
4. Paste your API key in the input field
5. Click "Save"
6. The key is stored in your browser's local storage

**Note**: Option B is more secure as the key never touches the server or version control.

### Step 5: Test the Connection

1. Open the AI Assistant module
2. Type a test message: "Hello, are you working?"
3. If configured correctly, you should receive a response
4. If you see an error, check the troubleshooting section below

## Security Best Practices

### Protecting Your API Key

**DO**:
- ✅ Store keys in environment variables
- ✅ Use `.env` files (already in `.gitignore`)
- ✅ Set usage limits in OpenAI dashboard
- ✅ Rotate keys periodically (every 90 days)
- ✅ Use separate keys for development and production
- ✅ Delete keys you're no longer using

**DON'T**:
- ❌ Commit keys to version control
- ❌ Share keys in screenshots or videos
- ❌ Hardcode keys in source files
- ❌ Share keys with others (create separate keys instead)
- ❌ Use the same key across multiple projects

### If Your Key is Compromised

1. **Immediately revoke the key**:
   - Go to https://platform.openai.com/api-keys
   - Find the compromised key
   - Click "Revoke"

2. **Generate a new key**:
   - Follow Step 3 above to create a new key
   - Update your `.env` file or browser storage

3. **Monitor usage**:
   - Check your OpenAI usage dashboard for unexpected activity
   - Review your billing for unauthorized charges

4. **Update payment method if needed**:
   - If you see unauthorized charges, contact OpenAI support
   - Consider updating your payment method

### Environment File Security

The `.env` file should **never** be committed to version control:

```bash
# Check if .env is in .gitignore
cat .gitignore | grep .env

# If not, add it:
echo ".env" >> .gitignore
```

Always use `.env.example` as a template:
```bash
# .env.example (safe to commit)
DATABASE_URL=postgresql://username:password@localhost:5432/siege_of_neverwinter
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here

# .env (never commit)
DATABASE_URL=postgresql://myuser:mypass@localhost:5432/siege_of_neverwinter
PORT=3000
OPENAI_API_KEY=sk-proj-actual-secret-key-here
```

## Troubleshooting

### Error: "Invalid API Key"

**Possible Causes**:
- Key was copied incorrectly (extra spaces, missing characters)
- Key was revoked in OpenAI dashboard
- Key hasn't been activated yet (wait a few minutes)

**Solutions**:
1. Double-check the key for typos
2. Verify the key exists in OpenAI dashboard
3. Generate a new key and try again
4. Ensure no extra spaces before/after the key

### Error: "Rate Limit Exceeded"

**Cause**: You've exceeded OpenAI's rate limits

**Solutions**:
1. Wait a few minutes before trying again
2. Upgrade your OpenAI account tier
3. Reduce the frequency of requests
4. Check if you have multiple applications using the same key

### Error: "Insufficient Quota"

**Cause**: Your OpenAI account has no remaining credits

**Solutions**:
1. Add credits to your OpenAI account
2. Check your billing settings
3. Verify your payment method is valid
4. Contact OpenAI support if you believe this is an error

### Error: "Network Error" or "Failed to Fetch"

**Possible Causes**:
- No internet connection
- Firewall blocking OpenAI API
- CORS issues (if running locally)
- OpenAI API is down

**Solutions**:
1. Check your internet connection
2. Try accessing https://api.openai.com/v1/models in your browser
3. Check OpenAI status page: https://status.openai.com
4. Disable VPN or proxy temporarily
5. Check browser console for detailed error messages

### AI Assistant Not Responding

**Checklist**:
1. ✅ API key is entered correctly
2. ✅ Internet connection is working
3. ✅ OpenAI account has available credits
4. ✅ No rate limiting errors in console
5. ✅ Browser console shows no errors

**Debug Steps**:
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try sending a message
4. Look for error messages
5. Check Network tab for failed requests

### Key Not Saving in Browser

**Possible Causes**:
- Browser blocking local storage
- Private/incognito mode
- Browser extension interference

**Solutions**:
1. Ensure you're not in private/incognito mode
2. Check browser settings for local storage permissions
3. Try a different browser
4. Disable browser extensions temporarily
5. Use the environment variable method instead

## Usage Monitoring

### Tracking API Usage

1. Go to https://platform.openai.com/usage
2. View usage by:
   - Date range
   - Model (GPT-3.5 vs GPT-4)
   - Cost

### Setting Usage Limits

1. Go to https://platform.openai.com/account/billing/limits
2. Set:
   - **Hard limit**: Maximum monthly spend (billing stops when reached)
   - **Soft limit**: Email notification threshold
3. Recommended starting limits:
   - Soft limit: $5
   - Hard limit: $10

### Estimating Costs

**Typical Usage Patterns**:
- Light use (5-10 queries/session): ~$0.50/month
- Moderate use (20-30 queries/session): ~$2-5/month
- Heavy use (50+ queries/session): ~$10-20/month

**Cost Optimization**:
- Use GPT-3.5-turbo instead of GPT-4 (10x cheaper)
- Keep prompts concise
- Clear conversation history when starting new topics
- Use the AI for complex questions, not simple lookups

## Alternative: Running Without AI Assistant

The AI Assistant is optional. The application works fully without it:

1. Simply don't configure an API key
2. Hide the AI Assistant module
3. All other features work normally
4. Use traditional D&D resources for rules and narrative

## Support

### OpenAI Support
- Documentation: https://platform.openai.com/docs
- Help Center: https://help.openai.com
- Community Forum: https://community.openai.com

### Application Support
- Check the DM_GUIDE.md for usage help
- Review TROUBLESHOOTING.md for technical issues
- Check browser console for error messages

---

**Remember**: Keep your API keys secure and monitor your usage to avoid unexpected charges!
