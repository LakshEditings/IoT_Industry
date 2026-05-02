const mongoose = require('mongoose');

const ParameterSettingsSchema = new mongoose.Schema({
  parameterId:  { type: Number, required: true, unique: true },
  name:         { type: String, required: true },
  value:        { type: String, default: '' },
  updatedAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('ParameterSettings', ParameterSettingsSchema);
