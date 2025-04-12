const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Stock = require('../../models/Stock');
const auth = require('../../middleware/auth');

// Middleware debug log
router.use((req, res, next) => {
  console.log('📦 Stock API route triggered');
  next();
});

// Apply auth middleware to all routes in this file
router.use(auth);

// Configure multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv') || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and TXT files are allowed'), false);
    }
  }
});

// @route   POST /api/stock/upload
// @desc    Upload stock data (CSV)
// @access  Private (Authenticated)
router.post('/upload', upload.single('file'), async (req, res) => {
  console.log('📁 File Upload Received:', req.file);

  if (!req.file) {
    return res.status(400).json({ 
      msg: 'No file uploaded',
      error: 'File upload failed' 
    });
  }

  const results = [];
  const filePath = req.file.path;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({
          separator: ',',
          headers: ['Date', 'series', 'OPEN', 'HIGH', 'LOW', 'PREV. CLOSE', 'ltp', 'close', 'vwap', '52W H', '52W L', 'VOLUME', 'VALUE', 'No of trades'],
          strict: true,
          skipLines: 1
        }))
        .on('data', (data) => {
          if (data.OPEN && data.close) {
            results.push(data);
          }
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    const processedData = processStockData(results);
    const savedStocks = [];

    for (const stock of processedData) {
      const savedStock = await Stock.findOneAndUpdate(
        { symbol: stock.symbol },
        stock,
        { upsert: true, new: true }
      );
      savedStocks.push(savedStock);
    }

    fs.unlinkSync(filePath);

    res.status(200).json({ 
      msg: 'Stock data uploaded successfully', 
      count: processedData.length,
      details: savedStocks
    });

  } catch (err) {
    console.error('❌ Upload Error:', err);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ 
      msg: 'Upload failed', 
      error: err.message || 'Unexpected server error'
    });
  }
});

// @route   GET /api/stock
// @desc    Get all stocks with user watch status
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const stocks = await Stock.find();
    const user = await User.findById(req.user.id).populate('watchlist');
    
    const stocksWithWatchStatus = stocks.map(stock => ({
      ...stock.toObject(),
      isWatched: user.watchlist.some(watchedStock => watchedStock._id.equals(stock._id))
    }));
    
    res.json(stocksWithWatchStatus);
  } catch (err) {
    console.error('❌ Get Stocks Error:', err);
    res.status(500).json({ 
      msg: 'Failed to get stocks', 
      error: err.message || 'Unexpected server error'
    });
  }
});

// @route   GET /api/stock/:symbol
// @desc    Get single stock with user watch status
// @access  Private
router.get('/:symbol', auth, async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol });
    if (!stock) {
      return res.status(404).json({ msg: 'Stock not found' });
    }
    
    const user = await User.findById(req.user.id).populate('watchlist');
    const stockWithWatchStatus = {
      ...stock.toObject(),
      isWatched: user.watchlist.some(watchedStock => watchedStock._id.equals(stock._id))
    };
    
    res.json(stockWithWatchStatus);
  } catch (err) {
    console.error('❌ Get Stock Error:', err);
    res.status(500).json({ 
      msg: 'Failed to get stock', 
      error: err.message || 'Unexpected server error'
    });
  }
});

function processStockData(csvData) {
  try {
    const stockMap = {};
    
    csvData.forEach((row) => {
      if (!row.OPEN) return;

      // Helper function to clean and parse values
      const cleanValue = (value) => {
        if (typeof value === 'string') {
          // Remove commas and convert to number
          return parseFloat(value.replace(/,/g, '')) || 0;
        }
        return value || 0;
      };

      const symbol = row.series || 'EQ'; // Default to 'EQ' if series not specified
      const stockName = `Stock ${symbol}`; // Default name - consider mapping to actual names

      if (!stockMap[symbol]) {
        stockMap[symbol] = {
          symbol: symbol,
          name: stockName,
          price: cleanValue(row.close),
          change: cleanValue(row.close) - cleanValue(row['PREV. CLOSE']),
          changePercent: ((cleanValue(row.close) - cleanValue(row['PREV. CLOSE'])) / 
                       cleanValue(row['PREV. CLOSE']) * 100),
          sector: 'Equity', // Default sector
          marketCap: cleanValue(row.VALUE), // Using VALUE as market cap proxy
          prices: [],
          usersWatching: []
        };
      }

      // Add price data point
      stockMap[symbol].prices.push({
        date: row.Date,
        open: cleanValue(row.OPEN),
        high: cleanValue(row.HIGH),
        low: cleanValue(row.LOW),
        close: cleanValue(row.close),
        prevClose: cleanValue(row['PREV. CLOSE']),
        ltp: cleanValue(row.ltp),
        vwap: cleanValue(row.vwap),
        week52High: cleanValue(row['52W H']),
        week52Low: cleanValue(row['52W L']),
        volume: cleanValue(row.VOLUME),
        value: cleanValue(row.VALUE),
        trades: cleanValue(row['No of trades'])
      });

      // Keep prices sorted by date (newest first)
      stockMap[symbol].prices.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Update current price data from the most recent entry
      const latestPrice = stockMap[symbol].prices[0];
      if (latestPrice) {
        stockMap[symbol].price = latestPrice.close;
        stockMap[symbol].change = latestPrice.close - latestPrice.prevClose;
        stockMap[symbol].changePercent = 
          ((latestPrice.close - latestPrice.prevClose) / latestPrice.prevClose) * 100;
      }
    });

    return Object.values(stockMap);
  } catch (error) {
    console.error('❌ Process Stock Data Error:', error);
    throw error;
  }
}

module.exports = router;