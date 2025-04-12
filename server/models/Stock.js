
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
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  change: { type: Number, required: true },
  changePercent: { type: Number, required: true },
  sector: { type: String, required: true },
  marketCap: { type: Number, required: true },
  prices: [StockPriceSchema]
});

module.exports = mongoose.model('Stock', StockSchema);
