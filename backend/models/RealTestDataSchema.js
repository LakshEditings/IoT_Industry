const mongoose = require('mongoose');

const RealTestDataSchema = new mongoose.Schema({
  Day:    { type: String, required: true },
  Time:   { type: String },
  Time24: { type: String, required: true },
  Ch1:    { type: Number, default: 0 },
  Ch2:    { type: Number, default: 0 },
  Ch3:    { type: Number, default: 0 },
  Ch4:    { type: Number, default: 0 },
  Ch5:    { type: Number, default: 0 },
  Ch6:    { type: Number, default: 0 },
});

RealTestDataSchema.index({ Day: 1, Time24: 1 });

module.exports = RealTestDataSchema;
