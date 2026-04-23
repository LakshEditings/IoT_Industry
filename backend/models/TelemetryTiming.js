const mongoose = require('mongoose');

const ParameterTimingSchema = new mongoose.Schema({
  id: Number,
  name: String,
  timings: [Number], // Total seconds each of the 6 boxes has been active
}, { _id: false });

const TelemetryTimingSchema = new mongoose.Schema({
  operatorId: {
    type: String,
    required: true,
    unique: true
  },
  operatorEmail: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  parameters: [ParameterTimingSchema]
});

module.exports = mongoose.model('TelemetryTiming', TelemetryTimingSchema);
