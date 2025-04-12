const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Stock = require('../../models/Stock');
const User = require('../../models/User');
const auth = require('../../middleware/auth');

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
    if (file.mimetype === 'text/csv' || 
        file.originalname.endsWith('.csv') || 
        file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and TXT files are allowed'), false);
    }
  }
});

// Stock upload route
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const results = [];
  let symbol = null;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({
          separator: ',',
          headers: [
            'date', 'series', 'open', 'high', 'low', 'prev_close', 
            'close', 'vwap', '52w_high', '52w_low', 'volume', 'value', 'trades'
          ],
          skipLines: 1, // Skip header row
          mapValues: ({ header, value }) => {
            // Trim and clean values
            const trimmedValue = typeof value === 'string' ? value.trim() : value;
            
            // Replace ########## with 0 or null
            if (trimmedValue === '##########') {
              return header === 'date' ? null : 0;
            }
            
            // Convert to number for numeric columns
            const numericColumns = [
              'open', 'high', 'low', 'prev_close', 
              'close', 'vwap', '52w_high', '52w_low', 
              'volume', 'value', 'trades'
            ];
            
            if (numericColumns.includes(header)) {
              // Remove commas and convert to number
              const numValue = parseFloat(trimmedValue.replace(/,/g, ''));
              return isNaN(numValue) ? 0 : numValue;
            }
            
            return trimmedValue;
          }
        }))
        .on('data', (data) => {
          // Determine symbol from series column
          if (!symbol && data.series === 'EQ') {
            symbol = '########'; // Placeholder for actual symbol extraction
          }

          // Process only rows with valid data
          if (data.series === 'EQ' && data.close) {
            results.push({
              date: data.date ? new Date(data.date) : new Date(),
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              prevClose: data.prev_close,
              volume: data.volume,
              value: data.value,
              trades: data.trades,
              vwap: data.vwap
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Validate and process results
    if (results.length === 0) {
      throw new Error('No valid stock data found in the CSV');
    }

    // Calculate stock-level metrics
    const latestData = results[results.length - 1];
    const stockData = {
      symbol: symbol, // You may need to extract this differently
      name: `Stock ${symbol}`, // Default name
      price: latestData.close,
      change: latestData.close - latestData.prevClose,
      changePercent: ((latestData.close - latestData.prevClose) / latestData.prevClose) * 100,
      sector: 'Uncategorized',
      marketCap: latestData.value || 0,
      prices: results.map(result => ({
        date: result.date,
        open: result.open,
        high: result.high,
        low: result.low,
        close: result.close,
        volume: result.volume
      }))
    };

    // Perform upsert
    const upsertResult = await Stock.findOneAndUpdate(
      { symbol: stockData.symbol },
      {
        $set: {
          name: stockData.name,
          price: stockData.price,
          change: stockData.change,
          changePercent: stockData.changePercent,
          sector: stockData.sector,
          marketCap: stockData.marketCap
        },
        $push: { 
          prices: { 
            $each: stockData.prices,
            $slice: -100 // Keep only the last 100 price entries
          } 
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.status(200).json({
      msg: 'Stock data uploaded successfully',
      details: {
        symbol: stockData.symbol,
        dataPoints: results.length,
        lastPrice: stockData.price,
        marketCap: stockData.marketCap
      }
    });
  } catch (err) {
    // Ensure file is deleted even if there's an error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.error('Stock Upload Error:', err);
    res.status(500).json({ 
      msg: 'Failed to upload stock data', 
      error: err.message 
    });
  }
});

module.exports = router;