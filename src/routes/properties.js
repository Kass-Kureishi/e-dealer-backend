const express = require('express');
const Property = require('../models/Property');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all properties with filters
router.get('/', async (req, res) => {
  try {
    const { 
      type, city, minPrice, maxPrice, bedrooms, 
      page = 1, limit = 10, search 
    } = req.query;
    
    const filter = { status: 'available' };
    
    if (type) filter.type = type;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }
    if (bedrooms) filter['features.bedrooms'] = parseInt(bedrooms);
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'location.address': new RegExp(search, 'i') }
      ];
    }
    
    const properties = await Property.find(filter)
      .populate('owner', 'profile firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Property.countDocuments(filter);
    
    res.json({
      properties,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
});

// Get single property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'profile firstName lastName');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching property', error: error.message });
  }
});

// Create new property (protected route)
router.post('/', async (req, res) => {
  try {
    // For now, we'll use a mock user ID - we'll add proper auth later
    const propertyData = {
      ...req.body,
      owner: "68ea8f21ef9c8255b45cb4eb" // Use the user ID from your registered user
    };
    
    const property = new Property(propertyData);
    await property.save();
    
    await property.populate('owner', 'profile firstName lastName');
    
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error creating property', error: error.message });
  }
});

module.exports = router;