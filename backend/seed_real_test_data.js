/**
 * seed_real_test_data.js
 * Seeds the Real_Test_Data MongoDB database from a CSV file (or JSON fallback).
 * 
 * CSV expected columns: Day, Time, Time24, Ch1, Ch2, Ch3, Ch4, Ch5, Ch6
 * 
 * Usage: node seed_real_test_data.js [path_to_csv]
 * Default CSV path: ./real_test_data.csv
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const fs        = require('fs');
const path      = require('path');
const csv       = require('csv-parser');

// Use a SEPARATE database: Real_Test_Data
const REAL_DB_URI = process.env.REAL_DB_URI || 'mongodb://127.0.0.1:27017/Real_Test_Data';
const CSV_PATH    = process.argv[2] || path.join(__dirname, 'Report.csv');

const RealTestDataSchema = new mongoose.Schema({
  Day: String, Time: String, Time24: String,
  Ch1: Number, Ch2: Number, Ch3: Number, Ch4: Number, Ch5: Number, Ch6: Number,
});
const RealTestData = mongoose.model('RealTestData', RealTestDataSchema, 'real_test_data');

const parseNum = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

mongoose.connect(REAL_DB_URI)
  .then(async () => {
    console.log('✅ Connected to Real_Test_Data');

    if (!fs.existsSync(CSV_PATH)) {
      console.error(`❌ CSV file not found: ${CSV_PATH}`);
      console.log('   Please place your CSV as: backend/Report.csv');
      process.exit(1);
    }

    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          // Convert Date '4/9/2026' to YYYY-MM-DD format
          let dateStr = '';
          if (row.Date) {
            const d = new Date(row.Date);
            if (!isNaN(d.getTime())) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              dateStr = `${yyyy}-${mm}-${dd}`;
            }
          }

          let timeStr = row.Time || '';
          if (timeStr) {
            const parts = timeStr.trim().split(':');
            if (parts.length > 0 && parts[0].length === 1) {
              parts[0] = '0' + parts[0];
              timeStr = parts.join(':');
            }
          }

          rows.push({
            Day:    dateStr || row.Day || '',
            Time:   row.Time || '',
            Time24: timeStr,
            Ch1: parseNum(row.CH01 || row.Ch1),
            Ch2: parseNum(row.CH02 || row.Ch2),
            Ch3: parseNum(row.CH03 || row.Ch3),
            Ch4: parseNum(row.CH04 || row.Ch4),
            Ch5: parseNum(row.CH05 || row.Ch5),
            Ch6: parseNum(row.CH06 || row.Ch6),
          });
        })
        .on('end',   resolve)
        .on('error', reject);
    });

    console.log(`   Parsed ${rows.length} rows from CSV`);

    await RealTestData.deleteMany({});
    console.log('   Cleared existing Real_Test_Data');

    await RealTestData.insertMany(rows, { ordered: false });
    console.log(`✅ Inserted ${rows.length} rows into Real_Test_Data → real_test_data`);

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
