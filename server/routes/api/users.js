
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const auth = require('../../middleware/auth');

// JWT Secret - should be kept in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'stockvision-secret';

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password
    });

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id
      }
    };

    // Sign the token
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id
      }
    };

    // Sign the token
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/watchlist
// @desc    Add stock to watchlist
// @access  Private
router.put('/watchlist', auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ msg: 'Symbol is required' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if stock is already in watchlist
    if (user.watchlist.includes(symbol)) {
      return res.status(400).json({ msg: 'Stock already in watchlist' });
    }
    
    user.watchlist.push(symbol);
    await user.save();
    
    res.json(user.watchlist);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/watchlist/:symbol
// @desc    Remove stock from watchlist
// @access  Private
router.delete('/watchlist/:symbol', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Remove the stock
    user.watchlist = user.watchlist.filter(stock => stock !== req.params.symbol);
    await user.save();
    
    res.json(user.watchlist);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/watchlist
// @desc    Get user's watchlist
// @access  Private
router.get('/watchlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.watchlist);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
