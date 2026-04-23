const mongoose = require('mongoose');

const SingleComponentCheckSchema = new mongoose.Schema({
  Day: { type: String, required: true },
  Time: { type: String, required: true },
  Time24: { type: String, required: true },
  Ch1: { type: Number, required: true },
  Ch2: { type: Number, required: true },
  Ch3: { type: Number, required: true },
  Ch4: { type: Number, required: true },
  Ch5: { type: Number, required: true },
  Ch6: { type: Number, required: true }
});

module.exports = mongoose.model('SingleComponentCheck', SingleComponentCheckSchema);
