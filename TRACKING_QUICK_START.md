# Live Tracking - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB running
- Two browsers (or one normal + one incognito window)

### Step 1: Start the Servers

#### Terminal 1 - Backend Server
```bash
cd "d:\Projects\truckConnect MAIN\truckconnect\backend"
npm start
```
✅ Backend should start on `http://localhost:5000`

#### Terminal 2 - Frontend Server
```bash
cd "d:\Projects\truckConnect MAIN\truckconnect"
npm run dev
```
✅ Frontend should start on `http://localhost:5173`

---

## 🧪 Testing the Live Tracking

### Step 2: Setup Customer Account
1. Open Browser 1 (e.g., Chrome normal mode)
2. Go to `http://localhost:5173`
3. Click **"I'm a Customer"**
4. Register a new customer account or login
5. Create a new load:
   - Source: "Mumbai, Maharashtra"
   - Destination: "Pune, Maharashtra"
   - Load Type: "Electronics"
   - Quantity: 5
   - Estimated Fare: 15000

### Step 3: Setup Driver Account
1. Open Browser 2 (e.g., Chrome incognito or Firefox)
2. Go to `http://localhost:5173`
3. Click **"I'm a Driver"**
4. Register a new driver account with:
   - Upload all required documents
   - Set lorry type and capacity
5. Wait for admin approval (or use admin portal to approve)
6. Login as driver
7. Go to **"Available Loads"** tab
8. Find the load you created
9. Click **"Apply"** button

### Step 4: Assign Driver (Customer)
1. Switch to Browser 1 (Customer)
2. Go to **"My Loads"** tab
3. Click **"View Applicants"**
4. See your driver in the applicants list
5. Click **"Assign Driver"** button
6. ✅ Load status changes to "Assigned"
7. Notice the **blue "Track Load" button** appears

### Step 5: Start Tracking (Driver)
1. Switch to Browser 2 (Driver)
2. Go to **"Applied Loads"** tab
3. You should see the assigned load
4. Find the **"Live Tracking"** control panel
5. Click **"Start Drive"** button
6. **Allow GPS permission** when prompted
7. ✅ Button changes to "Stop Drive"
8. ✅ You should see your current coordinates displayed

### Step 6: View Live Tracking (Customer)
1. Switch to Browser 1 (Customer)
2. Click the **"Track Load"** button
3. ✅ Map modal opens
4. ✅ You should see:
   - Map with OpenStreetMap tiles
   - Truck icon at driver's location
   - Driver details (name, phone)
   - Route information (source to destination)
   - "Tracking Active" indicator

### Step 7: Test Real-time Updates
1. Keep Browser 1 (Customer) map open
2. In Browser 2 (Driver), move your device/laptop
   - If testing on laptop: Coordinates might not change much
   - For best results: Test on mobile device with actual GPS
3. ✅ Customer's map should update automatically
4. ✅ Polyline path should show route traveled

### Step 8: Stop Tracking
1. In Browser 2 (Driver)
2. Click **"Stop Drive"** button
3. ✅ Tracking stops
4. Customer can still see last known position

---

## 📱 Mobile Testing (Recommended)

For the best testing experience:

### On Mobile (Driver):
1. Open `http://YOUR_LAPTOP_IP:5173` in mobile browser
2. Login as driver
3. Start tracking and walk around
4. GPS will provide real location updates

### On Desktop (Customer):
1. Keep laptop open with customer view
2. Watch driver's location update in real-time as they move

---

## 🔍 What to Look For

### ✅ Success Indicators:
- [ ] "Start Drive" button works and requests GPS permission
- [ ] Current coordinates display updates on driver side
- [ ] "Track Load" button appears after assigning driver
- [ ] Map opens with truck icon at driver location
- [ ] Real-time location updates on customer map
- [ ] Polyline shows path traveled
- [ ] "Stop Drive" stops tracking properly
- [ ] No console errors

### ❌ Common Issues:

**Issue**: GPS permission denied
- **Solution**: Check browser location settings, allow location access

**Issue**: Map doesn't load
- **Solution**: Check internet connection (needs to load map tiles)

**Issue**: Location not updating
- **Solution**: Ensure driver has clicked "Start Drive" and GPS is enabled

**Issue**: Socket.IO connection error
- **Solution**: Ensure backend server is running on port 5000

**Issue**: "Tracking not started" message
- **Solution**: Driver must click "Start Drive" before customer can track

---

## 🛠️ Troubleshooting Commands

### Check if backend is running:
```bash
curl http://localhost:5000/api/health
```

### Check browser console:
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for any error messages (red text)

### Check Socket.IO connection:
1. In browser console, look for:
   - "New client connected"
   - "Client joined tracking room"

### Check network requests:
1. F12 → Network tab
2. Look for:
   - `/api/tracking/start` - Should return 200
   - `/api/tracking/:loadId` - Should return tracking data
   - WebSocket connections (WS tab)

---

## 🎯 Testing Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Customer account created
- [ ] Driver account created and approved
- [ ] Load posted by customer
- [ ] Driver applied for load
- [ ] Customer assigned driver to load
- [ ] "Track Load" button visible
- [ ] Driver started tracking
- [ ] GPS permission granted
- [ ] Map opens for customer
- [ ] Truck icon visible on map
- [ ] Real-time updates working
- [ ] Driver can stop tracking
- [ ] No errors in console

---

## 🌐 Production Deployment Notes

### Important for Production:
1. **HTTPS Required**: Geolocation API requires HTTPS (except localhost)
2. **Environment Variables**: Set `FRONTEND_URL` in backend `.env`
3. **CORS Configuration**: Update Socket.IO CORS settings
4. **Mobile Testing**: Test on actual mobile devices with GPS
5. **Performance**: Monitor Socket.IO connections under load

### Production .env Example:
```env
FRONTEND_URL=https://your-domain.com
PORT=5000
MONGODB_URI=mongodb://...
```

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors (F12)
2. Check backend server logs
3. Verify all dependencies are installed
4. Ensure GPS/location services are enabled
5. Try in a different browser
6. Restart both servers

---

## ✨ Features Implemented

- ✅ Real-time GPS tracking
- ✅ Interactive map with Leaflet.js
- ✅ Socket.IO for live updates
- ✅ Start/Stop tracking controls
- ✅ Path visualization
- ✅ Driver information display
- ✅ Mobile responsive design
- ✅ Error handling
- ✅ Security & authentication
- ✅ Multi-language support (EN, HI)

---

**Happy Tracking! 🚚📍**
