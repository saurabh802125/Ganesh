
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Stock = require('../../models/Stock');
const auth = require('../../middleware/auth');

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// @route   GET api/stocks
// @desc    Get all stocks
// @access  Public
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/stocks/:symbol
// @desc    Get stock by symbol
// @access  Public
router.get('/:symbol', async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol });
    
    if (!stock) {
      return res.status(404).json({ msg: 'Stock not found' });
    }
    
    res.json(stock);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/stocks/upload
// @desc    Upload and process CSV file
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }
  
  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        // Process the CSV data
        const processedData = processStockData(results);
        
        // Save to database - using upsert to update existing or create new
        for (const stock of processedData) {
          await Stock.findOneAndUpdate(
            { symbol: stock.symbol },
            stock,
            { upsert: true, new: true }
          );
        }
        
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({ msg: 'Stock data uploaded successfully', count: processedData.length });
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    });
});

// Helper function to process CSV data
function processStockData(csvData) {
  const stockMap = {};
  
  csvData.forEach(row => {
    const symbol = row.symbol || '';
    if (!symbol) return;
    
    // Initialize stock if it doesn't exist
    if (!stockMap[symbol]) {
      stockMap[symbol] = {
        symbol,
        name: row.name || '',
        price: parseFloat(row.price) || 0,
        change: parseFloat(row.change) || 0,
        changePercent: parseFloat(row.changePercent) || 0,
        sector: row.sector || 'Unknown',
        marketCap: parseFloat(row.marketCap) || 0,
        prices: []
      };
    }
    
    // Add price data if available
    if (row.date) {
      stockMap[symbol].prices.push({
        date: row.date,
        open: parseFloat(row.open) || 0,
        high: parseFloat(row.high) || 0,
        close: parseFloat(row.close) || 0,
        low: parseFloat(row.low) || 0,
        volume: parseInt(row.volume) || 0
      });
    }
  });
  
  return Object.values(stockMap);
}

module.exports = router;
