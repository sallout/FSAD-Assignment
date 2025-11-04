# School Management System - Ngrok Setup Guide

## Updated Configuration

✅ **Frontend API Configuration Updated**
- All API calls now point to: `https://3f9091d61249.ngrok-free.app`
- Created centralized config file: `src/config/api.js`

✅ **Backend CORS Configuration Updated**
- Now accepts requests from: `https://flo-sanidinic-interpolatively.ngrok-free.dev`

## How to Start Your Application

### 1. Start Backend Server (Terminal 1)
```bash
cd c:\Users\levono\OneDrive\Desktop\School_Managment\phase2\backend
npm start
```

### 2. Start Backend Ngrok Tunnel (Terminal 2)
```bash
ngrok http 5000
```
**Make sure this generates the URL**: `https://3f9091d61249.ngrok-free.app`

### 3. Start Frontend Server (Terminal 3)
```bash
cd c:\Users\levono\OneDrive\Desktop\School_Managment\phase2\frontend
npm start
```

### 4. Start Frontend Ngrok Tunnel (Terminal 4)
```bash
ngrok http 3000
```
**Make sure this generates the URL**: `https://flo-sanidinic-interpolatively.ngrok-free.dev`

## Test Your Setup

1. Open your frontend ngrok URL in a browser: `https://flo-sanidinic-interpolatively.ngrok-free.dev`
2. Try logging in or signing up
3. The frontend will automatically connect to your backend via: `https://3f9091d61249.ngrok-free.app`

## Share with Client

Give your client this URL: `https://flo-sanidinic-interpolatively.ngrok-free.dev`

They will be able to access your full application (frontend + backend) through this single link!

## Important Notes

- If you restart ngrok, the URLs might change - you'll need to update the configuration files again
- Keep both ngrok tunnels running while your client is testing
- The backend ngrok tunnel needs to match the URL in `src/config/api.js`
- The frontend ngrok tunnel needs to match the CORS origin in `backend/index.js`