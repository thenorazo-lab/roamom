const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  desc: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 업데이트 시 updatedAt 자동 갱신
pointSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Point', pointSchema);
