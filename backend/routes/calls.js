const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
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

// Get call history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const calls = await Call.find({ $or: [{ callerId: req.userId }, { receiverId: req.userId }] })
      .populate('callerId', 'username avatar')
      .populate('receiverId', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create call
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiverId, groupId, type } = req.body;
    
    const call = new Call({
      callerId: req.userId,
      receiverId,
      groupId,
      type: type || 'voice'
    });
    
    await call.save();
    
    const populatedCall = await Call.findById(call._id)
      .populate('callerId', 'username avatar')
      .populate('receiverId', 'username avatar');
    
    res.status(201).json(populatedCall);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update call status
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    if (call.callerId.toString() !== req.userId.toString() && call.receiverId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    call.status = req.body.status || call.status;
    call.duration = req.body.duration || call.duration;
    
    await call.save();
    
    res.json(call);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;