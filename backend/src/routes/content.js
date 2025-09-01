
import express from 'express';
import mongoose from 'mongoose';
import Content from '../models/Content.js';
import { generateAIContent } from '../utils/aiGenerator.js';
import { validateContent } from '../middleware/validation.js';
import crypto from 'crypto';

const router = express.Router();

// Content generation interval (2 minutes)
const CONTENT_GENERATION_INTERVAL = 2 * 60 * 1000;
let contentGenerationInterval = null;

// Set to track recently generated content (prevents duplicates in memory)
const recentlyGeneratedHashes = new Set();
const MAX_HASHES_TO_TRACK = 1000; // Prevent memory leaks

function ensureDb(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database not connected' });
    return false;
  }
  return true;
}

// Generate a hash for content to check for duplicates
function generateContentHash(text, type) {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('md5').update(`${type}:${normalizedText}`).digest('hex');
}

// Check if content is a duplicate
async function isDuplicateContent(text, type) {
  try {
    // Check in-memory cache first (fast)
    const hash = generateContentHash(text, type);
    if (recentlyGeneratedHashes.has(hash)) {
      return true;
    }
    
    // Check database for existing content with similar text
    const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();
    const existingContent = await Content.findOne({
      type,
      $text: { $search: normalizedText }
    });
    
    return !!existingContent;
  } catch (error) {
    console.error('Error checking for duplicate content:', error);
    // If there's an error, assume it's not a duplicate to avoid blocking generation
    return false;
  }
}

// Function to generate random content with duplicate prevention
async function generateRandomContent() {
  try {
    const contentTypes = ['joke', 'fact', 'quote', 'idea'];
    const randomType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    
    console.log(`Auto-generating ${randomType} content...`);
    
    const aiContent = await generateAIContent(randomType, 1);
    
    if (aiContent && aiContent.length > 0) {
      const content = aiContent[0];
      
      // Check if this is a duplicate
      const isDuplicate = await isDuplicateContent(content.text, randomType);
      
      if (isDuplicate) {
        console.log(`Duplicate ${randomType} detected, skipping...`);
        return false;
      }
      
      // Save the content hash to prevent future duplicates
      const hash = generateContentHash(content.text, randomType);
      recentlyGeneratedHashes.add(hash);
      
      // Limit the size of our hash set to prevent memory issues
      if (recentlyGeneratedHashes.size > MAX_HASHES_TO_TRACK) {
        const firstHash = recentlyGeneratedHashes.values().next().value;
        recentlyGeneratedHashes.delete(firstHash);
      }
      
      console.log(`Auto-generated ${randomType}: ${content.text.substring(0, 50)}...`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in auto-content generation:', error.message);
    return false;
  }
}

// Enhanced AI content generation with duplicate prevention
async function generateAIContentWithDeduplication(type, count) {
  const maxAttempts = count * 3; // Try up to 3 times per requested item
  const generatedContent = [];
  const attempts = {};
  
  for (let i = 0; i < maxAttempts && generatedContent.length < count; i++) {
    try {
      const aiContent = await generateAIContent(type, 1);
      
      if (aiContent && aiContent.length > 0) {
        const content = aiContent[0];
        const hash = generateContentHash(content.text, type);
        
        // Check if we've already generated this content in this session
        if (recentlyGeneratedHashes.has(hash)) {
          console.log(`Duplicate ${type} detected in session, skipping...`);
          continue;
        }
        
        // Check if this content exists in the database
        const isDuplicate = await isDuplicateContent(content.text, type);
        
        if (!isDuplicate) {
          // Add to our recently generated set
          recentlyGeneratedHashes.add(hash);
          
          // Limit the size of our hash set
          if (recentlyGeneratedHashes.size > MAX_HASHES_TO_TRACK) {
            const firstHash = recentlyGeneratedHashes.values().next().value;
            recentlyGeneratedHashes.delete(firstHash);
          }
          
          generatedContent.push(content);
          console.log(`Generated unique ${type}: ${content.text.substring(0, 50)}...`);
        } else {
          console.log(`Duplicate ${type} detected in database, skipping...`);
        }
      }
    } catch (error) {
      console.error(`Error generating ${type} content:`, error);
    }
  }
  
  return generatedContent;
}

// Start content generation interval
function startContentGeneration() {
  if (contentGenerationInterval) {
    clearInterval(contentGenerationInterval);
  }
  
  contentGenerationInterval = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      await generateRandomContent();
    }
  }, CONTENT_GENERATION_INTERVAL);
  
  console.log('Auto-content generation started. New content every 2 minutes.');
}

// Stop content generation interval
function stopContentGeneration() {
  if (contentGenerationInterval) {
    clearInterval(contentGenerationInterval);
    contentGenerationInterval = null;
    console.log('Auto-content generation stopped.');
  }
}

// Preload recent content hashes to prevent duplicates
async function preloadContentHashes() {
  try {
    const recentContent = await Content.find()
      .sort({ createdAt: -1 })
      .limit(100);
    
    for (const content of recentContent) {
      const hash = generateContentHash(content.text, content.type);
      recentlyGeneratedHashes.add(hash);
    }
    
    console.log(`Preloaded ${recentContent.length} content hashes for duplicate prevention`);
  } catch (error) {
    console.error('Error preloading content hashes:', error);
  }
}

// Start content generation when database is connected
if (mongoose.connection.readyState === 1) {
  preloadContentHashes().then(() => {
    startContentGeneration();
  });
} else {
  mongoose.connection.once('connected', () => {
    preloadContentHashes().then(() => {
      startContentGeneration();
    });
  });
}

// Get content by type with AI fallback
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!ensureDb(res)) return;

    if (!['joke', 'fact', 'idea', 'quote'].includes(type)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    // Get existing content
    const content = await Content.find({ type, isApproved: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Content.countDocuments({ type, isApproved: true });
    const hasMore = skip + content.length < totalCount;

    // Only generate AI content if we have very few items (less than 5)
    if (content.length < 5 && page === 1) {
      console.log(`Low content count (${content.length}), generating AI content...`);
      
      // Generate a small batch (2-3 items) to supplement existing content
      const aiItemsToGenerate = Math.max(1, 5 - content.length);
      const aiContent = await generateAIContentWithDeduplication(type, Math.min(aiItemsToGenerate, 3));
      
      if (aiContent && aiContent.length > 0) {
        console.log(`Generated ${aiContent.length} AI ${type}(s)`);
        // Add new AI content to the beginning of the array
        content.unshift(...aiContent);
      }
    }

    res.json({
      content,
      hasMore: hasMore || (page === 1 && content.length >= limit),
      totalCount
    });

  } catch (error) {
    console.error(`Error fetching ${type} content:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Manual AI content generation endpoint
router.post('/:type/generate', async (req, res) => {
  try {
    const { type } = req.params;
    const count = Math.min(parseInt(req.body.count) || 2, 5); // Increased max to 5
    
    if (!ensureDb(res)) return;
    
    console.log(`Manual AI generation requested: ${count} ${type}(s)`);
    
    const aiContent = await generateAIContentWithDeduplication(type, count);
    
    res.json({
      success: true,
      generated: aiContent.length,
      content: aiContent
    });
    
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      message: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Control auto-content generation
router.post('/autogenerate/:action', (req, res) => {
  const { action } = req.params;
  
  if (action === 'start') {
    startContentGeneration();
    res.json({ message: 'Auto-content generation started' });
  } else if (action === 'stop') {
    stopContentGeneration();
    res.json({ message: 'Auto-content generation stopped' });
  } else if (action === 'status') {
    res.json({ 
      running: contentGenerationInterval !== null,
      interval: CONTENT_GENERATION_INTERVAL,
      trackedHashes: recentlyGeneratedHashes.size
    });
  } else {
    res.status(400).json({ error: 'Invalid action. Use start, stop, or status' });
  }
});

// Add user content with duplicate check
router.post('/', validateContent, async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { text, type, author } = req.body;

    // Check for duplicates before saving
    const isDuplicate = await isDuplicateContent(text, type);
    if (isDuplicate) {
      return res.status(409).json({ 
        error: 'Duplicate content',
        message: 'Similar content already exists'
      });
    }

    const content = new Content({
      text,
      type,
      author,
      aiGenerated: false,
      isApproved: true
    });

    await content.save();
    
    // Add to our recently generated set
    const hash = generateContentHash(text, type);
    recentlyGeneratedHashes.add(hash);
    
    res.status(201).json(content);
  } catch (error) {
    console.error('Add content error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Get content by ID
router.get('/id/:id', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(content);
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Update content (for admin/moderation)
router.put('/:id', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { isApproved } = req.body;
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Delete content
router.delete('/:id', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Remove from our recently generated set if it exists
    const hash = generateContentHash(content.text, content.type);
    if (recentlyGeneratedHashes.has(hash)) {
      recentlyGeneratedHashes.delete(hash);
    }
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Clean up on process exit
process.on('SIGINT', () => {
  stopContentGeneration();
  process.exit(0);
});

export default router;