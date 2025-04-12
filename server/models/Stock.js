const mongoose = require('mongoose');

const StockPriceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  close: { type: Number, required: true },
  low: { type: Number, required: true },
  volume: { type: Number, required: true }
});

const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  change: { type: Number, required: true },
  changePercent: { type: Number, required: true },
  sector: { type: String, required: true },
  marketCap: { type: Number, required: true },
  prices: [StockPriceSchema],
  usersWatching: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  companyInfo: {
    description: { type: String },
    website: { type: String },
    foundedYear: { type: Number },
    employees: { type: Number },
    headquarters: { 
      city: { type: String },
      country: { type: String }
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
StockSchema.index({ symbol: 1 }, { unique: true });
StockSchema.index({ sector: 1 });
StockSchema.index({ marketCap: -1 });

// Static method to add a user to usersWatching
StockSchema.statics.addUserToWatching = async function(stockId, userId) {
  const stock = await this.findById(stockId);
  if (!stock) {
    throw new Error('Stock not found');
  }

  // Check if user is already watching
  if (!stock.usersWatching.some(id => id.equals(userId))) {
    stock.usersWatching.push(userId);
    await stock.save();
  }
  return stock;
};

// Static method to remove a user from usersWatching
StockSchema.statics.removeUserFromWatching = async function(stockId, userId) {
  const stock = await this.findById(stockId);
  if (!stock) {
    throw new Error('Stock not found');
  }

  stock.usersWatching = stock.usersWatching.filter(id => !id.equals(userId));
  await stock.save();
  return stock;
};

// Virtual to get watching users count
StockSchema.virtual('watchingUsersCount').get(function() {
  return this.usersWatching.length;
});

// Pre-save hook to ensure symbol is uppercase
StockSchema.pre('save', function(next) {
  if (this.symbol) {
    this.symbol = this.symbol.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Stock', StockSchema);