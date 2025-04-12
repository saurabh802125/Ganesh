
const mongoose = require('mongoose');

// Replace this with your actual MongoDB connection string
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/stockvision';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
