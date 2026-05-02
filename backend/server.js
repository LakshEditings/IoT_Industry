require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Telemetry = require('./models/Telemetry');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial_iot';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB Compass (industrial_iot)'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Connect to Real_Test_Data
const REAL_DB_URI = process.env.REAL_DB_URI || 'mongodb://127.0.0.1:27017/Real_Test_Data';
const realDbConnection = mongoose.createConnection(REAL_DB_URI);
const RealTestDataSchema = require('./models/RealTestDataSchema');
const RealTestData = realDbConnection.model('RealTestData', RealTestDataSchema, 'real_test_data');
realDbConnection.on('connected', () => console.log('Successfully connected to MongoDB Compass (Real_Test_Data)'));
realDbConnection.on('error', (err) => console.error('Real_Test_Data connection error:', err));

// Routes
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ email, password });
    await user.save();
    
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // In a production app you'd generate a JWT here
    res.status(200).json({ message: 'Signed in successfully!', user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/telemetry', async (req, res) => {
  try {
    const { operatorId, operatorEmail, parameters } = req.body;
    if (!operatorId || !parameters) {
      return res.status(400).json({ error: 'Missing telemetry payload data' });
    }

    const telemetry = new Telemetry({
      operatorId,
      operatorEmail,
      parameters
    });

    await telemetry.save();
    res.status(201).json({ message: 'Telemetry saved' });
  } catch (error) {
    console.error('Telemetry save error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/telemetry-timing', async (req, res) => {
  try {
    const { operatorId, operatorEmail, parameters } = req.body;
    if (!operatorId || !parameters) {
      return res.status(400).json({ error: 'Missing telemetry timing data' });
    }

    const TelemetryTiming = require('./models/TelemetryTiming');
    await TelemetryTiming.findOneAndUpdate(
      { operatorId }, // match by operatorId
      {
        operatorId,
        operatorEmail,
        parameters,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true } // Create if doesn't exist, update if it does
    );

    res.status(200).json({ message: 'Telemetry Timing updated' });
  } catch (error) {
    console.error('Telemetry Timing save error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/telemetry/export', async (req, res) => {
  try {
    const { min, max, operatorId } = req.query;
    
    if (!min || !max || !operatorId) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    const minDate = new Date(min);
    const maxDate = new Date(max);

    const history = await Telemetry.find({
      operatorId,
      timestamp: {
        $gte: minDate,
        $lte: maxDate
      }
    }).sort({ timestamp: 1 });

    res.status(200).json({ recordCount: history.length, data: history });
  } catch (error) {
    console.error('Historical export error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/single-component-check', async (req, res) => {
  try {
    const SingleComponentCheck = require('./models/SingleComponentCheck');
    
    // Default to Monday and full 8 hours if no params provided
    const day = req.query.day || 'Monday';
    const fromTime = req.query.from || '08:00:00';
    const toTime = req.query.to || '16:00:00';

    const query = {
      Day: day,
      Time24: {
        $gte: fromTime,
        $lte: toTime
      }
    };

    const rows = await SingleComponentCheck.find(query).sort({ Time24: 1 });
    
    // Initialize counters for 6 channels (in seconds)
    const totals = { Ch1: 0, Ch2: 0, Ch3: 0, Ch4: 0, Ch5: 0, Ch6: 0 };
    
    rows.forEach(row => {
      if (row.Ch1 === 1) totals.Ch1 += 5;
      if (row.Ch2 === 1) totals.Ch2 += 5;
      if (row.Ch3 === 1) totals.Ch3 += 5;
      if (row.Ch4 === 1) totals.Ch4 += 5;
      if (row.Ch5 === 1) totals.Ch5 += 5;
      if (row.Ch6 === 1) totals.Ch6 += 5;
    });

    // Convert to SECONDS and MINUTES
    const results = Object.keys(totals).map(ch => ({
      channel: ch,
      totalSeconds: totals[ch],
      totalMinutes: (totals[ch] / 60).toFixed(2)
    }));

    res.status(200).json({ totals: results, timeline: rows });
  } catch (error) {
    console.error('Single component check error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/real-test-data', async (req, res) => {
  try {
    const day = req.query.day || 'Monday';
    const fromTime = req.query.from || '08:00:00';
    const toTime = req.query.to || '16:00:00';

    const query = {
      Day: day,
      Time24: {
        $gte: fromTime,
        $lte: toTime
      }
    };

    const rows = await RealTestData.find(query).sort({ Time24: 1 });
    
    // Initialize counters for 6 channels (in seconds and onCount)
    const totals = { Ch1: 0, Ch2: 0, Ch3: 0, Ch4: 0, Ch5: 0, Ch6: 0 };
    const counts = { Ch1: 0, Ch2: 0, Ch3: 0, Ch4: 0, Ch5: 0, Ch6: 0 };
    
    let prev = { Ch1: 0, Ch2: 0, Ch3: 0, Ch4: 0, Ch5: 0, Ch6: 0 };

    rows.forEach((row, index) => {
      ['Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5', 'Ch6'].forEach(ch => {
        if (row[ch] === 1) {
          totals[ch] += 5; // accumulate 5 seconds
          // if it went from 0 to 1 (or is 1 on the very first row), increment count
          if (prev[ch] === 0 || index === 0) {
            counts[ch] += 1;
          }
        }
        prev[ch] = row[ch] || 0;
      });
    });

    const results = Object.keys(totals).map(ch => ({
      channel: ch,
      totalSeconds: totals[ch],
      totalMinutes: (totals[ch] / 60).toFixed(2),
      onCount: counts[ch]
    }));

    res.status(200).json({ totals: results, timeline: rows });
  } catch (error) {
    console.error('Real test data error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/* ── Parameter Settings: GET all ── */
app.get('/api/parameter-settings', async (req, res) => {
  try {
    const ParameterSettings = require('./models/ParameterSettings');
    const settings = await ParameterSettings.find({}).sort({ parameterId: 1 });
    res.status(200).json(settings);
  } catch (error) {
    console.error('Parameter settings GET error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/* ── Parameter Settings: SAVE / UPDATE one ── */
app.post('/api/parameter-settings', async (req, res) => {
  try {
    const ParameterSettings = require('./models/ParameterSettings');
    const { parameterId, name, value } = req.body;

    if (parameterId === undefined || !name) {
      return res.status(400).json({ error: 'parameterId and name are required' });
    }

    const saved = await ParameterSettings.findOneAndUpdate(
      { parameterId },
      { parameterId, name, value, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json(saved);
  } catch (error) {
    console.error('Parameter settings POST error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

