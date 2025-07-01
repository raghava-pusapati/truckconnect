# Truck Connect Platform

A platform that connects truck drivers with customers who need to transport goods.

## Features

- Customer dashboard to post loads and track their status
- Driver dashboard to find and apply for available loads
- Admin dashboard to manage driver applications
- MongoDB integration for data storage
- User authentication with JWT

## Setup

### Prerequisites

- Node.js (v14+)
- MongoDB Atlas account or local MongoDB server
- npm or yarn

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd truck-connect
```

2. Install dependencies:
```
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Replace `your_mongodb_connection_string` with your MongoDB connection URL:
   - For MongoDB Atlas: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/truckConnect?retryWrites=true&w=majority`
   - For local MongoDB: `mongodb://localhost:27017/truckConnect`

### Running the Application

1. Start both the frontend and backend:
```
npm start
```

This will start the React frontend on port 5173 and the backend server on port 5000.

Or you can run them separately:

- Frontend only: `npm run dev`
- Backend only: `npm run server:dev`

## MongoDB Setup

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string from the "Connect" button
5. Add your connection string to the `.env` file

## Admin Setup

To create an admin user, use the API route:

```
POST /api/auth/register
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "yourpassword",
  "phone": "1234567890",
  "role": "admin"
}
```

## API Documentation

### Auth Routes

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user and get token

### Admin Routes

- `GET /api/admin/drivers` - Get all drivers
- `GET /api/admin/drivers/pending` - Get pending driver applications
- `GET /api/admin/drivers/accepted` - Get accepted drivers
- `GET /api/admin/drivers/rejected` - Get rejected drivers
- `PUT /api/admin/drivers/:id/accept` - Accept a driver
- `PUT /api/admin/drivers/:id/reject` - Reject a driver

### Customer Routes

- `GET /api/customer/loads` - Get customer's loads
- `POST /api/customer/loads` - Create a new load

### Driver Routes

- `GET /api/driver/loads/available` - Get available loads
- `GET /api/driver/loads/assigned` - Get assigned loads
- `POST /api/driver/loads/:id/apply` - Apply for a load
- `PUT /api/driver/loads/:id/complete` - Mark a load as completed

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT 