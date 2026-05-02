require('dotenv').config();
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');
const SingleComponentCheck = require('./models/SingleComponentCheck');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial_iot';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    /* ── 1. Users ── */
    await User.deleteMany({});
    console.log('Cleared users');

    const users = [
      { email: 'test@plant.io',  password: '123456' },
      { email: 'admin@plant.io', password: '123456' },
    ];

    for (const u of users) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(u.password, salt);
      await User.create({ email: u.email, password: hashed });
      console.log(`  Created user: ${u.email}`);
    }

    /* ── 2. Telemetry data ── */
    const jsonPath = path.join(__dirname, 'weekly_8am_to_4pm_every5sec.json');
    const rows = JSON.parse(fs.readFileSync(jsonPath));

    await SingleComponentCheck.deleteMany({});
    console.log('Cleared SingleComponentCheck');

    await SingleComponentCheck.insertMany(rows);
    console.log(`  Seeded ${rows.length} telemetry rows`);

    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
