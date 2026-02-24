# Felicity Event Management System - Frontend

## Setup Instructions

### Prerequisites
- Node.js 16+ installed

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the frontend directory (see `.env.example` for reference):
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

3. Start the development server:
```bash
npm start
```

The app will run on `http://localhost:3000`

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/       # Shared components
│   │   ├── participant/  # Participant-specific
│   │   ├── organizer/    # Organizer-specific
│   │   └── admin/        # Admin-specific
│   ├── pages/            # Page components
│   │   ├── auth/         # Login, Register
│   │   ├── participant/  # Participant pages
│   │   ├── organizer/    # Organizer pages
│   │   └── admin/        # Admin pages
│   ├── services/         # API calls
│   ├── context/          # React Context (Auth)
│   ├── utils/            # Helper functions
│   ├── App.js
│   └── index.js
└── package.json
```

## Features by Role

### Participant
- Browse and search events
- Register for events
- View tickets with QR codes
- Manage profile
- Follow organizers

### Organizer
- Create and manage events
- Form builder for custom registration
- View registrations
- Export participant data
- Attendance tracking (Tier A)

### Admin
- Create organizer accounts
- Manage organizers
- View system statistics
- Handle password reset requests (Tier B)

## Implementation Status

- [x] Project structure created
- [x] Component placeholders
- [x] Auth context setup
- [x] API service setup
- [ ] Component implementation
- [ ] Routing setup
- [ ] UI/UX with Material-UI
- [ ] Testing
