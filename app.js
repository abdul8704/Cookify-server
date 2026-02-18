const express = require('express');
const app = express();
const connectDB = require('./config/db');
const authRoutes = require('./router/auth.routes');
const userRoutes = require('./router/user.routes');
const authMiddleware = require('./middleware/auth.middleware');

app.use(express.json());

// JWT auth middleware for all routes except login/register
app.use(authMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    app.listen(PORT);
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1); // Exit process with failure
  }
};

start();