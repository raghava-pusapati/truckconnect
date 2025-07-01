# Truck Connect Backend

## Admin Account Setup

The application requires a single admin account to manage the platform. Follow these steps to set up an admin account:

1. Make sure your MongoDB database is running
2. Make sure all dependencies are installed by running `npm install`
3. Run the admin creation script with:

```bash
node scripts/createAdmin.js
```

This will create an admin account with the following credentials:
- Email: admin@truckconnect.com
- Password: admin123

For security reasons, please change the password after the first login through the admin dashboard.

## Running the Application

1. Start the backend server:

```bash
npm start
```

2. The server will run on port 5000 by default

## Admin Access

- Admin login is only available through the direct URL path: `/admin`
- The admin login page is not linked from the landing page for security reasons
- Only accounts with the role "admin" can access the admin dashboard

## API Routes

- Authentication: `/api/auth`
- Customer routes: `/api/customer`
- Driver routes: `/api/driver`
- Admin routes: `/api/admin` 