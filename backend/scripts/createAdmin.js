// Script to create the first admin user
// Run this after MongoDB is connected: node backend/scripts/createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Simple User schema (same as models/User.js)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  firstName: String,
  lastName: String,
});

const User = mongoose.model('User', userSchema);

// Create admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@felicity.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      return;
    }

    // Hash the password
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = new User({
      email: 'admin@felicity.com',
      password: hashedPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('================================');
    console.log('Email: admin@felicity.com');
    console.log('Password: Admin@123');
    console.log('Role: admin');
    console.log('================================');
    console.log('⚠️  Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📤 Disconnected from MongoDB');
  }
};

// Run the script
const run = async () => {
  console.log('🚀 Creating Admin User...\n');
  await connectDB();
  await createAdmin();
};

run();
