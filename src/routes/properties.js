// ==========================================
//  E-DEALER PROPERTY ROUTES (Fixed + Clean)
// ==========================================

const express = require('express');
const Property = require('../models/Property');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ============================
// 🔹 GET ALL PROPERTIES (with filters)
// ============================
router.get('/', async (req, res) => {
  try {
    const {
      type,
      city,
      minPrice,
      maxPrice,
      bedrooms,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = { status: { $in: ['available', 'Available'] } };

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
        { 'location.address': new RegExp(search, 'i') },
        { 'location.city': new RegExp(search, 'i') }
      ];
    }

    const properties = await Property.find(filter)
      .populate('owner', 'profile firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Property.countDocuments(filter);

    res.json({
      properties,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('❌ Error fetching properties:', error);
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
});

// ============================
// 🔹 GET SINGLE PROPERTY BY ID
// ============================
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'profile firstName lastName email');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('❌ Error fetching property:', error);
    res.status(500).json({ message: 'Error fetching property', error: error.message });
  }
});

// ============================
// 🔹 CREATE NEW PROPERTY (Protected Later)
// ============================
// For now this works without JWT, but you can later enable: router.post('/', authMiddleware, async...)
router.post('/', async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      owner: req.body.owner || "68ea8f21ef9c8255b45cb4eb" // Mock user ID for now
    };

    const property = new Property(propertyData);
    await property.save();
    await property.populate('owner', 'profile firstName lastName email');

    res.status(201).json({
      message: '✅ Property added successfully',
      property
    });
  } catch (error) {
    console.error('❌ Error creating property:', error);
    res.status(500).json({ message: 'Error creating property', error: error.message });
  }
});

// ============================
// 🔹 ALIAS: /add → same as POST /
// ============================
router.post('/add', async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      owner: req.body.owner || "68ea8f21ef9c8255b45cb4eb"
    };

    const property = new Property(propertyData);
    await property.save();
    await property.populate('owner', 'profile firstName lastName email');

    res.status(201).json({
      message: '✅ Property added successfully (via /add)',
      property
    });
  } catch (error) {
    console.error('❌ Error creating property via /add:', error);
    res.status(500).json({ message: 'Error creating property', error: error.message });
  }
});

module.exports = router;
