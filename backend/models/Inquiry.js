// models/Inquiry.js
const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  }
});

module.exports = mongoose.model('Inquiry', inquirySchema);