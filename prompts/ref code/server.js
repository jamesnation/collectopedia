require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const Toy = require('./models/toy');
const { getEbayPrices, getEbayPublicKey } = require('./ebayService');

// Check for required environment variables
const requiredEnvVars = ['MONGODB_URI', 'PORT', 'EBAY_APP_ID', 'EBAY_VERIFICATION_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

console.log('All required environment variables are set.');
console.log('EBAY_APP_ID:', process.env.EBAY_APP_ID);

const app = express();
const port = process.env.PORT || 5001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://collectopedia.vercel.app', 'https://collectopedia-backend.vercel.app']
  : ['http://localhost:3000', 'http://localhost:5001'];

app.use(cors({
  origin: function(origin, callback) {
    if(!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.raw({ type: 'application/json' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB Atlas:', err));

// eBay notification endpoint
app.all('/api/ebay-notifications', async (req, res) => {
  // ... (keep the existing eBay notification handling code)
});

// eBay price fetch
app.get('/api/ebay-prices/:toyName', async (req, res) => {
  console.log(`Fetching eBay prices for: ${req.params.toyName}`);
  try {
    const { toyName } = req.params;
    const listingType = req.query.listingType || 'active';
    console.log('Calling getEbayPrices with:', toyName, listingType);
    const prices = await getEbayPrices(toyName, listingType);
    console.log('eBay prices fetched successfully:', prices);
    res.json(prices);
  } catch (error) {
    console.error('Error fetching eBay prices:', error);
    res.status(500).json({ message: 'Error fetching eBay prices', error: error.message });
  }
});

// Get all toys
app.get('/api/collection', async (req, res) => {
  try {
    const toys = await Toy.find();
    res.json(toys);
  } catch (err) {
    console.error('Error fetching toys:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a new toy
app.post('/api/collection', upload.single('image'), async (req, res) => {
  console.log('Received data:', req.body);
  console.log('Received file:', req.file);

  try {
    const toy = new Toy({
      name: req.body.name,
      dateAcquired: new Date(req.body.dateAcquired),
      cost: parseFloat(req.body.cost),
      currentValue: parseFloat(req.body.currentValue),
      type: req.body.type,
      notes: req.body.notes,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      listedValue: parseFloat(req.body.listedValue) || null,
      soldValue: parseFloat(req.body.soldValue) || null
    });

    const newToy = await toy.save();
    res.status(201).json(newToy);
  } catch (err) {
    console.error('Error saving toy:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update a toy
app.put('/api/collection/:id', upload.single('image'), async (req, res) => {
  try {
    console.log('Received update request:', req.params, req.body, req.file);
    
    let updateData;
    if (req.file) {
      // If there's a file, it's FormData
      updateData = {
        ...req.body,
        image: `/uploads/${req.file.filename}`,
      };
    } else {
      // If there's no file, it might be JSON data
      updateData = req.body;
    }

    // Parse numeric fields
    const numericFields = ['cost', 'currentValue', 'listedValue', 'soldValue'];
    numericFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = parseFloat(updateData[field]);
      }
    });

    // Handle dateAcquired
    if (updateData.dateAcquired) {
      updateData.dateAcquired = new Date(updateData.dateAcquired);
    }

    const updatedToy = await Toy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedToy) {
      return res.status(404).json({ message: 'Toy not found' });
    }
    res.json(updatedToy);
  } catch (err) {
    console.error('Error updating toy:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a toy
app.delete('/api/collection/:id', async (req, res) => {
  try {
    const toy = await Toy.findByIdAndDelete(req.params.id);
    if (!toy) {
      return res.status(404).json({ message: 'Toy not found' });
    }
    res.json({ message: 'Toy deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Load toy
app.get('/api/collection/:id', async (req, res) => {
  try {
    const toy = await Toy.findById(req.params.id);
    if (!toy) {
      return res.status(404).json({ message: 'Toy not found' });
    }
    res.json(toy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
  console.log(`API should be accessible at: http://localhost:${port}/api`);
  console.log(`Try accessing: http://localhost:${port}/api/collection`);
});

// New API endpoint to return JSON data
app.get('/api/toys', (req, res) => {
  try {
    // Your data fetching logic here
    const toys = [/* your toy data */];
    res.json(toys);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enable pre-flight requests for all routes
app.options('*', cors());