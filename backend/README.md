# Felicity Event Management System - Backend

## Setup Instructions

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account (or local MongoDB)
- Gmail account for email functionality

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the backend directory (see `.env.example` for reference):
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
PORT=5000
```

3. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Project Structure

```
backend/
├── models/              # Mongoose schemas
│   ├── User.js         # User model (all roles)
│   ├── Event.js        # Event model
│   ├── Registration.js # Registration model
│   └── PasswordResetRequest.js
├── routes/             # API route handlers
│   ├── auth.js
│   ├── events.js
│   ├── registrations.js
│   ├── organizers.js
│   └── users.js
├── controllers/        # Business logic
├── middleware/         # Auth, authorization, error handling
├── utils/             # Helper functions
└── server.js          # Entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register participant
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Browse events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (Organizer)
- `PUT /api/events/:id` - Update event (Organizer)
- `DELETE /api/events/:id` - Delete event (Organizer)

### Registrations
- `POST /api/registrations` - Register for event
- `GET /api/registrations/participant/:id` - Get participant registrations
- `GET /api/registrations/event/:id` - Get event registrations (Organizer)

### Organizers (Admin only)
- `POST /api/organizers` - Create organizer
- `GET /api/organizers` - List organizers
- `DELETE /api/organizers/:id` - Remove organizer

## Implementation Status

- [x] Project structure created
- [x] Database models defined
- [x] Middleware setup
- [ ] Controllers implementation
- [ ] Routes implementation
- [ ] Email service
- [ ] QR code generation
- [ ] Testing
