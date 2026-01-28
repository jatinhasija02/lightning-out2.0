# Lightning Out 2.0 Deployment Guide for Vercel

This guide explains how to deploy the Lightning Out 2.0 application to Vercel.

## Overview

This application consists of:
- A frontend HTML page that handles Salesforce OAuth and component mounting
- A Node.js backend server that manages OAuth authentication

## Deployment Options

### Option 1: Static Frontend Only (Recommended for Vercel)
Deploy only the HTML file to Vercel. The OAuth authentication will still work, but you'll need to host the backend separately.

### Option 2: Full Application (Requires Node.js Hosting)
Deploy the entire application to a platform that supports Node.js (Heroku, Render, etc.).

## Files to Deploy to Vercel

For a basic static deployment to Vercel:

1. `vercel-deploy-ready.html` - The modified HTML file ready for Vercel
2. `.env` - Environment variables (Note: This will be handled by Vercel's environment variables)
3. `package.json` - For dependency management

## Vercel Configuration

### Environment Variables
In Vercel, set the following environment variables:
- `SF_LOGIN_URL` - Your Salesforce login URL (default: https://login.salesforce.com)
- `SF_CLIENT_ID` - Your Connected App Consumer Key
- `SF_CLIENT_SECRET` - Your Connected App Consumer Secret
- `SF_REDIRECT_URI` - Your Vercel domain URL + `/auth/callback` (e.g., https://your-vercel-domain.vercel.app/auth/callback)
- `SESSION_SECRET` - A strong random string for session management

### Build Settings
- **Framework Preset**: None (Static Site)
- **Build Command**: `echo "No build needed"`
- **Output Directory**: `.` (root)

## Important Notes

1. The OAuth flow requires a backend server to handle the authentication callbacks
2. When deployed to Vercel, you'll need to host the Node.js backend separately
3. The redirect URI in your Salesforce Connected App must match your Vercel domain
4. For production use, ensure you're using HTTPS for all URLs

## Backend Hosting Alternative

If you want to host everything on Vercel, you can:
1. Use Vercel's Serverless Functions for the backend
2. Or deploy the Node.js server to a service like Heroku, Render, or AWS

## Troubleshooting

### OAuth Redirect Issues
If you get redirect errors:
1. Verify the redirect URI in your Salesforce Connected App matches exactly
2. Check that the `SF_REDIRECT_URI` environment variable is set correctly
3. Ensure your Vercel domain is properly configured

### Component Mounting Issues
If components don't mount:
1. Verify your Lightning Out App and Aura wrapper components exist in Salesforce
2. Check that the component names in the JavaScript match your Salesforce components
3. Review the diagnostics log for specific error messages
