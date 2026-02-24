# Felicity Event Management System

This is a comprehensive platform built to help colleges manage their festival events. Here is a breakdown of how the system is built, the technical choices made, and how to start the project on your own computer.

## Libraries and Frameworks Used

### Frontend (User Interface)

I used these tools to build the interactive website pages:

* **React**: Chosen because it allows for building reusable UI components (like buttons and forms), which saves development time and keeps the code organized.
* **React Router DOM**: Used to enable smooth navigation. When a user clicks a link, the webpage swaps out the content instantly rather than reloading the entire browser window, making the website feel very fast.
* **Material UI**: Chosen to provide pre-built, professional-looking components (buttons, boxes, typography). This ensures a clean design out-of-the-box without having to write extensive custom CSS.
* **Axios**: Selected over the standard browser `fetch` API because it is much simpler for sending data to the backend. It automatically converts data to and from JSON format and handles errors cleanly.
* **html5-qrcode**: Integrated so that organizers can open their device's camera directly inside the web browser to scan tickets, avoiding the need for a separate mobile app.
* **react-qr-code**: Used to generate and draw the actual QR code picture on the participant's digital ticket so it can be scanned at the venue.
* **socket.io-client**: Chosen to establish a real-time, two-way connection. This allows the backend to instantly push live messages and notifications to the user's screen without them having to refresh the page.

### Backend (Server and Database)

I used these tools to build the server that processes logic and saves all the data:

* **Node.js and Express**: Express was chosen because it is the most straightforward framework to create API endpoints (web addresses) that the frontend can communicate with.
* **MongoDB and Mongoose**: MongoDB was selected for the database because it stores data as standard JavaScript objects (JSON), making it very flexible and beginner-friendly compared to rigid SQL tables.
* **bcrypt**: Included to securely hash user passwords. If the database is ever compromised, attackers will only see scrambled characters instead of real passwords.
* **jsonwebtoken (JWT)**: Chosen for secure authentication. When a user logs in, the server issues a secret token so it remembers their identity across different pages without needing constant log-ins.
* **nodemailer**: Used to send real automated emails. Nodemailer allows the server to connect to an SMTP server (like Gmail) to send out registration tickets and password reset approvals.
* **qrcode**: Similar to the frontend, this enables the server to generate a QR code image data URL, which is then embedded into the email tickets sent to participants.
* **socket.io**: Pairs with the frontend socket library to power the real-time discussion forums and instant announcements.

## Advanced Features Implemented

### Tier A Features (8 Marks Each)

#### 1. Hackathon Team Registration
* **Justification**: Many college events require group participation. Providing a built-in way to form teams streamlines the registration process rather than organizers tracking teams manually.
* **Implementation Approach**: 
  * A team leader can create a team and specify the exact target size.
  * The system generates a unique invite code that the leader can share.
  * The event registration is only marked as "completed" once all invited members have accepted and the team is full.
* **Technical Decisions**: I built a dedicated team management dashboard for participants. The backend tracks the array of members and their invitation statuses. Automatic tickets are only generated and distributed once the backend validates that the `members.length` matches the `targetSize`.

#### 2. QR Scanner & Attendance Tracking
* **Justification**: Manual check-ins at large events are too slow. Scanning a digital ticket is the most efficient way to manage a heavy flow of participants.
* **Implementation Approach**: 
  * Participants receive a unique QR code upon registration.
  * Organizers access a built-in scanner page that uses their device camera to read the code.
  * The system marks attendance with a precise timestamp and rejects duplicate scans.
  * Organizers can view a live dashboard comparing scanned vs. not-yet-scanned participants, and can export the final attendance report as a CSV.
* **Technical Decisions**: I used `html5-qrcode` to ensure the scanner works directly in the browser across all devices (phones, laptops). A manual override option was also included for edge cases (e.g., if a participant's phone dies), which creates an audit log in the database to prevent abuse.

### Tier B Features (6 Marks Each)

#### 1. Real-Time Discussion Forum
* **Justification**: Participants often have real-time questions about an event (e.g., "Is there a delay?"). A built-in forum prevents organizers from being flooded with individual emails.
* **Implementation Approach**: 
  * A live chat forum is embedded directly on the Event Details page for registered users.
  * Participants can post messages and ask questions, while organizers can moderate (delete/pin messages) and post official announcements.
  * Includes message threading, a notification system for new messages, and the ability to react to messages.
* **Technical Decisions**: I utilized `socket.io` to ensure messages appear on all users' screens instantly without refreshing. The database schema links messages to specific events and supports a `parentId` concept for threading replies to a main message.

#### 2. Organizer Password Reset Workflow
* **Justification**: If an organizer forgets their password, they need a way to regain access without compromising the security of the event data.
* **Implementation Approach**: 
  * Organizers submit a password reset request detailing their club name and reason.
  * This request goes to an Admin dashboard (status: Pending).
  * The Admin reviews the context and can Approve or Reject the request with comments.
  * If Approved, the backend auto-generates a secure new password, which the Admin securely receives and shares with the organizer.
* **Technical Decisions**: By requiring manual Admin approval rather than automatic email resets, the system prevents automated account takeover attempts. The backend logs the entire history of these requests (Pending, Approved, Rejected) for auditing purposes.

### Tier C Features (2 Marks)

#### 1. Add to Calendar Integration
* **Justification**: Participants register for multiple events and need a convenient way to remember when they occur to avoid missing them.
* **Implementation Approach**: 
  * The dashboard provides options to export registered events directly to external calendar applications.
  * Users can download a universal `.ics` file or use direct integration links to instantly add the event to Google Calendar or Microsoft Outlook.
* **Technical Decisions**: Instead of relying on a heavy third-party API, I simply formatted the event data (Name, Date, Description) into standardized URL parameters for Google/Outlook, and generated a standard structured `.ics` text file blob that the browser can trigger as a download.

## Setup and Installation Instructions

Follow these steps to run the complete project on your local machine.

### Prerequisites
* **Node.js**: Ensure you have Node.js (v16 or higher) installed.
* **MongoDB**: A free MongoDB Atlas account to host your database.
* **Gmail Account**: Required for the SMTP server to send registration emails.

### Step 1: Set up the Backend Server
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the backend folder and configure your secret keys:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/felicity
   JWT_SECRET=your_random_secret_string
   PORT=5000
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *(The backend server will run on `http://localhost:5000`)*

### Step 2: Set up the Frontend Website
1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the frontend folder to configure the API connection:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```
4. Start the frontend web server:
   ```bash
   npm start
   ```
   *(The website will automatically open in your browser on `http://localhost:3000`)*

**Final Note**: Once both servers are running, access your MongoDB database directly to manually insert your first Admin user document. You can then log into the website as that Admin to begin creating Organizers and Events!
