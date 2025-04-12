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

function processStockData(csvData) {
  try {
    const stockMap = {};
    const defaultSymbol = 'EQ';
    const defaultName = 'Equity Stock';

    csvData.forEach((row, index) => {
      if (!row.OPEN) return;

      if (!stockMap[defaultSymbol]) {
        stockMap[defaultSymbol] = {
          symbol: defaultSymbol,
          name: defaultName,
          price: parseFloat(row.close) || 0,
          change: parseFloat(row.close) - parseFloat(row['PREV. CLOSE']) || 0,
          changePercent: ((parseFloat(row.close) - parseFloat(row['PREV. CLOSE'])) / parseFloat(row['PREV. CLOSE']) * 100) || 0,
          sector: 'Equity',
          marketCap: 0,
          prices: []
        };
      }

      const cleanVolume = row.VOLUME.replace(/[^\d]/g, '');
      stockMap[defaultSymbol].prices.push({
        date: row.Date || new Date().toISOString().split('T')[0],
        open: parseFloat(row.OPEN) || 0,
        high: parseFloat(row.HIGH) || 0,
        close: parseFloat(row.close) || 0,
        low: parseFloat(row.LOW) || 0,
        volume: parseInt(cleanVolume) || 0
      });
    });

    return Object.values(stockMap);
  } catch (error) {
    console.error('❌ Process Stock Data Error:', error);
    throw error;
  }
}

module.exports = router;
