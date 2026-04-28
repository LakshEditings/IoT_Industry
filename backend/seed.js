require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const SingleComponentCheck = require('./models/SingleComponentCheck');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial_iot';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Compass (industrial_iot)');

    const jsonPath = path.join(__dirname, 'weekly_8am_to_4pm_every5sec.json');
    const rawData = fs.readFileSync(jsonPath);
    const rows = JSON.parse(rawData);

    // Clear existing data (optional, but good for fresh seeds)
    await SingleComponentCheck.deleteMany({});
    console.log('Cleared existing SingleComponentCheck data');

    // Insert new data
    await SingleComponentCheck.insertMany(rows);
    console.log(`Successfully seeded ${rows.length} rows into SingleComponentCheck`);

    process.exit(0);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
