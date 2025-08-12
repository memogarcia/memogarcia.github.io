# Google OpenID Authentication Setup Guide

This guide will walk you through setting up Google OpenID authentication for the Writer app.

## Prerequisites

- A Google account
- Node.js and npm installed
- The Writer app codebase

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Writer App")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and then click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type (unless you have a Google Workspace account)
   - Fill in the required fields:
     - App name: "Writer App"
     - User support email: Your email
     - Developer contact information: Your email
   - Click "Save and Continue"
   - Skip the scopes section (click "Save and Continue")
   - Add test users if needed (optional)
   - Click "Save and Continue"

4. Now create the OAuth client ID:
   - Application type: "Web application"
   - Name: "Writer App Web Client"
   - Authorized JavaScript origins:
     - Add: `http://localhost:5173` (for local development)
     - Add: `http://localhost:5174` (alternative port)
     - Add: `http://localhost:3000` (if using different port)
     - Add your production URL when deploying (e.g., `https://your-app.com`)
   - Click "Create"

5. Copy the Client ID from the popup (it will look like: `xxxxx.apps.googleusercontent.com`)

## Step 4: Configure the Writer App

1. In your Writer app directory, create a `.env.local` file:
   ```bash
   touch .env.local
   ```

2. Add your Google Client ID to the file:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

3. Make sure `.env.local` is in your `.gitignore` file (it should already be there)

## Step 5: Test the Authentication

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

4. You should see the login page with a "Sign in with Google" button

5. Click the button and follow the Google authentication flow

## Troubleshooting

### "Invalid Client" Error

- Double-check that your Client ID is correctly copied
- Ensure the URL in your browser matches one of the authorized origins
- Wait a few minutes after creating credentials (Google needs time to propagate)

### "Redirect URI Mismatch" Error

- Add the exact URL shown in the error message to your authorized JavaScript origins
- Make sure you're not mixing http/https or including trailing slashes

### Login Button Not Appearing

- Check browser console for errors
- Verify that `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart the development server after adding environment variables

### "Pop-up Blocked" Error

- Enable pop-ups for localhost in your browser settings
- Try using the redirect flow instead of popup (may require code changes)

## Production Deployment

When deploying to production:

1. Add your production URL to the authorized JavaScript origins in Google Cloud Console
2. Set the `VITE_GOOGLE_CLIENT_ID` environment variable in your hosting platform
3. Update your OAuth consent screen with production information
4. Consider moving from "Testing" to "Production" status in OAuth consent screen

## Security Best Practices

1. **Never commit your Client ID to version control** - Always use environment variables
2. **Use HTTPS in production** - Google OAuth requires secure origins for production
3. **Restrict origins** - Only add the specific domains you need
4. **Monitor usage** - Check Google Cloud Console for unusual activity
5. **Implement proper logout** - Ensure users can fully sign out

## Additional Configuration Options

### Customizing User Data

The app currently stores these user fields:
- Email
- Name  
- Profile picture URL

To access additional user data, you may need to:
1. Request additional OAuth scopes
2. Modify the JWT decoding in `App.tsx`

### Session Management

Current implementation:
- Sessions persist in localStorage
- No automatic expiration
- Manual logout through settings

Consider implementing:
- Session timeouts
- Refresh tokens
- Server-side session validation

## Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth2 | Google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

If you encounter issues not covered in this guide:
1. Check the browser console for detailed error messages
2. Review the Google Cloud Console logs
3. Ensure all URLs are correctly configured
4. Try clearing browser cache and cookies