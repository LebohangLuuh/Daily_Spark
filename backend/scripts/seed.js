const mongoose = require('mongoose');
const Content = require('../src/models/Content');
require('dotenv').config();

const sampleContent = [
  {
    text: "Why don't scientists trust atoms? Because they make up everything!",
    type: "joke",
    author: "Science Fan",
    aiGenerated: false
  },
  {
    text: "The only way to do great work is to love what you do.",
    type: "quote",
    author: "Steve Jobs",
    aiGenerated: false
  },
  {
    text: "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat.",
    type: "fact",
    author: "History Buff",
    aiGenerated: false
  },
  {
    text: "Create a 'digital detox' box where family members can deposit their phones during meals and quality time together.",
    type: "idea",
    author: "Wellness Advocate",
    aiGenerated: false
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing content
    await Content.deleteMany({});
    console.log('Cleared existing content');

    // Insert sample content
    await Content.insertMany(sampleContent);
    console.log('Sample content inserted');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
