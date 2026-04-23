const mongoose = require('mongoose');

const ParameterSchema = new mongoose.Schema({
  name: String,
  settingValue: String,
  snapshot: [Number], // The 6 box values at the moment of save
}, { _id: false });

const TelemetrySchema = new mongoose.Schema({
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  operatorEmail: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  parameters: [ParameterSchema]
});

module.exports = mongoose.model('Telemetry', TelemetrySchema);
