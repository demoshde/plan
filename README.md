# OT Mining Logistics Management System

A full-stack application for managing mining logistics operations, built with React, Node.js, and MongoDB.

## Features

- **Weekly Dispatch Board**: Track daily convoy dispatches with drag-and-drop reordering
- **Fleet Management**: Manage SGC, KBTL, and TE fleets with status tracking
- **Shift Assignment**: Assign convoys to day/night shifts
- **Monthly Planning**: Set targets and track actual performance with KPI dashboard
- **Holiday Management**: Track holidays and border closures for Mongolia and China
- **Incident Tracking**: Log and monitor operational incidents
- **Real-time KPIs**: View dispatched, returned, and average hours metrics

## Tech Stack

### Frontend
- React 18 with Vite
- TailwindCSS for styling
- Zustand for state management
- React Router for navigation
- date-fns for date manipulation
- Axios for API calls

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- RESTful API architecture

## Project Structure

```
convoy/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── store/          # Zustand state management
│   │   └── App.jsx         # Main app component
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   └── index.js        # Server entry point
│   ├── .env                # Environment variables
│   └── package.json
│
└── package.json            # Root package.json
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd convoy
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

   Or install separately:
   ```bash
   # Root dependencies
   npm install

   # Server dependencies
   cd server && npm install

   # Client dependencies
   cd ../client && npm install
   ```

3. **Configure environment variables**

   Edit `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ot-mining-logistics
   NODE_ENV=development
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running locally, or update `MONGODB_URI` to point to your MongoDB Atlas cluster.

## Running the Application

### Development Mode

Run both client and server concurrently:
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Server
npm run server

# Terminal 2 - Client
npm run client
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## API Endpoints

### Convoys
- `GET /api/convoys` - Get all convoys
- `POST /api/convoys` - Create convoy
- `PUT /api/convoys/:id` - Update convoy
- `DELETE /api/convoys/:id` - Delete convoy
- `POST /api/convoys/seed` - Seed initial convoy data

### Dispatches
- `GET /api/dispatches/:date` - Get dispatch for a date
- `GET /api/dispatches/range?startDate=&endDate=` - Get dispatches for date range
- `PUT /api/dispatches/:date` - Update dispatch
- `GET /api/dispatches/kpi/range?startDate=&endDate=` - Get KPIs for date range

### Plans
- `GET /api/plans/month/:year/:month` - Get monthly plans
- `PUT /api/plans/:date` - Set daily plan
- `GET /api/plans/monthly/:year/:month` - Get monthly target
- `PUT /api/plans/monthly/:year/:month` - Set monthly target

### Holidays
- `GET /api/holidays/year/:year` - Get holidays for year
- `POST /api/holidays` - Create holiday (supports date range)
- `DELETE /api/holidays/:id` - Delete holiday

### Incidents
- `GET /api/incidents/month/:year/:month` - Get monthly incidents
- `POST /api/incidents` - Create incident
- `PUT /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident

### Shifts
- `GET /api/shifts` - Get all shift assignments
- `PUT /api/shifts/:shiftType` - Update shift convoys
- `POST /api/shifts/:shiftType/convoy` - Add convoy to shift
- `DELETE /api/shifts/:shiftType/convoy/:convoyName` - Remove convoy from shift

## Building for Production

```bash
npm run build
```

This builds the React app into `client/dist/`.

## License

MIT
