const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  watchlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);