const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../../models/User');
const Stock = require('../../models/Stock');
const auth = require('../../middleware/auth');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRATION = '5d'; // 5 days

// Utility function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

// @route   POST api/users/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      preferences: {
        notifications: {
          email: true,
          sms: false,
          pushNotifications: false
        },
        theme: 'system',
        language: 'en'
      }
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = Date.now() + 24 * 3600000; // 24 hours

    // Save user
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // TODO: Send verification email (implementation depends on your email service)
    console.log(`Verification Token: ${verificationToken}`);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: false
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

// @route   POST api/users/login
// @desc    Authenticate user
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ msg: 'Account is suspended' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'watchlist',
        select: 'symbol name price change changePercent'
      })
      .populate({
        path: 'portfolios.stocks.stock',
        select: 'symbol name price'
      });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ msg: 'Server error fetching profile' });
  }
});

// @route   PUT api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update preferences
    if (req.body.notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...req.body.notifications
      };
    }

    if (req.body.theme) {
      user.preferences.theme = req.body.theme;
    }

    if (req.body.language) {
      user.preferences.language = req.body.language;
    }

    await user.save();

    res.json({
      preferences: user.preferences
    });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ msg: 'Server error updating preferences' });
  }
});

// @route   POST api/users/verify-email
// @desc    Verify email
// @access  Public
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    await user.save();

    res.json({ msg: 'Email verified successfully' });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ msg: 'Server error verifying email' });
  }
});

// @route   POST api/users/reset-password
// @desc    Request password reset
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ msg: 'No account found with that email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = Date.now() + 3600000; // 1 hour

    await user.save();

    // TODO: Send password reset email
    console.log(`Password Reset Token: ${resetToken}`);

    res.json({ msg: 'Password reset link sent' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ msg: 'Server error processing reset request' });
  }
});

// @route   POST api/users/reset-password/confirm
// @desc    Confirm password reset
// @access  Public
router.post('/reset-password/confirm', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;

    await user.save();

    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset confirmation error:', err);
    res.status(500).json({ msg: 'Server error resetting password' });
  }
});

module.exports = router;