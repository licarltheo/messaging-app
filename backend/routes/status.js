const express = require('express');
const router = express.Router();
const Status = require('../models/Status');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all status updates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const statuses = await Status.find({ userId: req.userId })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create status update
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, type, fileUrl } = req.body;
    
    const status = new Status({
      userId: req.userId,
      content,
      type: type || 'text',
      fileUrl
    });
    
    await status.save();
    
    const populatedStatus = await Status.findById(status._id)
      .populate('userId', 'username avatar');
    
    res.status(201).json(populatedStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete status update
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }
    
    if (status.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await status.deleteOne();
    
    res.json({ message: 'Status deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;