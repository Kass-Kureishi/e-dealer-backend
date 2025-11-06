// src/routes/properties.js
const express = require("express");
const router = express.Router();
const Property = require("../models/Property");

// GET all properties
router.get("/", async (req, res) => {
  try {
    const properties = await Property.find();
    res.status(200).json({ properties });
  } catch (err) {
    res.status(500).json({ message: "Error fetching properties", error: err.message });
  }
});

// POST create a property
router.post("/", async (req, res) => {
  try {
    const property = new Property(req.body);
    await property.save();
    res.status(201).json(property);
  } catch (err) {
    res.status(400).json({ message: "Error adding property", error: err.message });
  }
});

// GET property by ID
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.status(200).json(property);
  } catch (err) {
    res.status(500).json({ message: "Error fetching property", error: err.message });
  }
});

module.exports = router;
