// Load environment variables first
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const initializeSocket = require('./socketHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible from controllers via req.app.get('io')
app.set('io', io);

// Initialize socket handler
initializeSocket(io);

// Middleware - order matters!
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('MongoDB connected successfully');

    // Initialize default admin user if one doesn't exist
    try {
      const User = require('./models/User');
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        console.log('Creating default admin user...');
        const admin = new User({
          email: 'admin@felicity.com',
          password: 'Admin@123',
          role: 'admin',
          firstName: 'System',
          lastName: 'Admin'
        });
        await admin.save();
        console.log('Default admin user created: admin@felicity.com');
      }
    } catch (err) {
      console.error('Error initializing admin user:', err.message);
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('⚠️  Server will continue running, but database operations will fail');
    console.log('💡 Please update MONGODB_URI in .env file with a valid MongoDB connection string');
  });

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Basic welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Felicity Event Management API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      events: '/api/events',
      registrations: '/api/registrations',
      organizers: '/api/organizers',
      admin: '/api/admin',
      users: '/api/users',
      messages: '/api/events/:eventId/messages'
    }
  });
});

// Import and use route handlers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/organizers', require('./routes/organizers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/password-reset', require('./routes/passwordReset'));
app.use('/api', require('./routes/messages'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.stack })
  });
});

// Handle 404 - route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Export app for testing (supertest uses it without starting a listener)
module.exports = app;

// Only start listener when not in test mode
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO ready`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}
