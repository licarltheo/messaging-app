const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
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

// Get messages
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { receiverId, groupId } = req.query;
    
    const query = { $or: [] };
    
    if (receiverId) {
      query.$or.push(
        { senderId: req.userId, receiverId },
        { senderId: receiverId, receiverId: req.userId }
      );
    }
    
    if (groupId) {
      query.groupId = groupId;
    }
    
    const messages = await Message.find(query)
      .populate('senderId', 'username avatar')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiverId, groupId, content, type, fileUrl } = req.body;
    
    const message = new Message({
      senderId: req.userId,
      receiverId,
      groupId,
      content,
      type: type || 'text',
      fileUrl
    });
    
    await message.save();
    
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username avatar');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update message
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (message.senderId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    message.content = req.body.content || message.content;
    message.type = req.body.type || message.type;
    message.fileUrl = req.body.fileUrl || message.fileUrl;
    
    await message.save();
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (message.senderId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await message.deleteOne();
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;