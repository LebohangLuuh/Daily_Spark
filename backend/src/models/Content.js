import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000
  },
  type: {
    type: String,
    required: true,
    enum: ['joke', 'fact', 'idea', 'quote']
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  aiGenerated: {
    type: Boolean,
    default: false
  }
});

// Index for better query performance
contentSchema.index({ type: 1, createdAt: -1 });
contentSchema.index({ type: 1, aiGenerated: 1, createdAt: -1 });

export default mongoose.model('Content', contentSchema);
