const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const connectDB = require('./config/db');
const authRoutes = require('./router/auth.routes');
const userRoutes = require('./router/user.routes');
const ingredientRoutes = require('./router/ingredient.routes');
const inventoryRoutes = require('./router/inventory.routes');
const recipeRoutes = require('./router/recipe.routes');
const profileRoutes = require('./router/profile.routes');
const nutritionRoutes = require('./router/nutrition.routes');
const favouriteRoutes = require('./router/favourite.routes');
const mealScheduleRoutes = require('./router/mealSchedule.routes');
const authMiddleware = require('./middleware/auth.middleware');

app.use(express.json());
app.use(cookieParser());

// JWT auth middleware for all routes except login/register
app.use(authMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/meal-schedule', mealScheduleRoutes);

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