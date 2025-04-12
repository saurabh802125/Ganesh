const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  watchlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  }],
  portfolios: [{
    name: {
      type: String,
      required: [true, 'Portfolio name is required'],
      trim: true,
      maxlength: [50, 'Portfolio name cannot exceed 50 characters']
    },
    stocks: [{
      stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
      },
      quantity: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Quantity cannot be negative']
      },
      purchasePrice: {
        type: Number,
        required: [true, 'Purchase price is required'],
        min: [0, 'Purchase price cannot be negative']
      },
      purchaseDate: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  // Authentication and security fields
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpiry: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpiry: {
    type: Date
  },
  
  // Security tracking
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Unique index for email with case-insensitive match
UserSchema.index({ email: 1 }, { 
  unique: true, 
  collation: { locale: 'en', strength: 2 } 
});

// Virtual for account locked status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for total portfolio value
UserSchema.virtual('totalPortfolioValue').get(function() {
  return this.portfolios.reduce((total, portfolio) => {
    return total + portfolio.stocks.reduce((portfolioTotal, holding) => {
      return portfolioTotal + (holding.quantity * holding.purchasePrice);
    }, 0);
  }, 0);
});

// Middleware to hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
UserSchema.methods.incrementLoginAttempts = function(callback) {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    }, callback);
  }
  
  // Otherwise we're incrementing
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if we've reached max attempts
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { 
      lockUntil: Date.now() + (24 * 60 * 60 * 1000) // Lock for 24 hours
    };
  }
  
  return this.updateOne(updates, callback);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function(callback) {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  }, callback);
};

// Method to add stock to watchlist
UserSchema.methods.addToWatchlist = async function(stockId) {
  // Check if stock is already in watchlist
  if (!this.watchlist.some(id => id.equals(stockId))) {
    this.watchlist.push(stockId);
    await this.save();
  }
  return this;
};

// Method to remove stock from watchlist
UserSchema.methods.removeFromWatchlist = async function(stockId) {
  this.watchlist = this.watchlist.filter(id => !id.equals(stockId));
  await this.save();
  return this;
};

module.exports = mongoose.model('User', UserSchema);