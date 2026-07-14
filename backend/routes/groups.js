const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
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

// Get all groups
router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    const group = new Group({
      name,
      description,
      createdBy: req.userId,
      members: [req.userId, ...members]
    });
    
    await group.save();
    
    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar');
    
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    if (!group.members.includes(req.userId)) {
      return res.status(403).json({ message: 'Not a member' });
    }
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update group
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    if (group.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    group.name = req.body.name || group.name;
    group.description = req.body.description || group.description;
    
    await group.save();
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete group
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    if (group.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await group.deleteOne();
    
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;