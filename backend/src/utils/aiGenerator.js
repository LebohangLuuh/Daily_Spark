import Groq from 'groq-sdk';
import Content from '../models/Content.js';

// ===== Configuration =====
const ENABLE_AI = process.env.ENABLE_AI_GENERATION !== 'false';

// Updated model configuration for active Groq models
const GROQ_MODELS = {
  primary: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
  fallback: 'llama-3.1-8b-instant',  // Faster, uses fewer tokens
  lightweight: 'gemma2-9b-it'        // Smallest context window but reliable
};

// Optimized settings for free tier
const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 150); // Reduced from 300
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE ?? 0.7); // Slightly reduced for more consistent output

// Enhanced retry/backoff for free tier limitations
const AI_RATE_LIMIT_MAX_ATTEMPTS = Number(process.env.AI_RATE_LIMIT_MAX_ATTEMPTS || 3);
const AI_RATE_LIMIT_BASE_DELAY_MS = Number(process.env.AI_RATE_LIMIT_BASE_DELAY_MS || 1000); // Increased
const AI_RATE_LIMIT_COOLDOWN_MS = Number(process.env.AI_RATE_LIMIT_COOLDOWN_MS || 5 * 60 * 1000); // 5 minutes

// Quota cooldown - more aggressive for free tier
const AI_QUOTA_COOLDOWN_MS = Number(process.env.AI_QUOTA_COOLDOWN_MS || 60 * 60 * 1000); // 1 hour

// Request throttling for free tier
const AI_REQUEST_INTERVAL_MS = Number(process.env.AI_REQUEST_INTERVAL_MS || 2000); // 2 seconds between requests
let lastRequestTime = 0;

// ===== Groq singleton =====
let groqClient = null;
function getGroq() {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  groqClient = new Groq({ apiKey });
  return groqClient;
}

// ===== Enhanced Helpers =====
let aiBackoffUntil = 0;
let currentModel = GROQ_MODELS.primary;

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Enhanced throttling
async function throttleRequest() {
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  if (timeSinceLastRequest < AI_REQUEST_INTERVAL_MS) {
    const waitTime = AI_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    console.log(`Throttling request: waiting ${waitTime}ms`);
    await sleep(waitTime);
  }
  lastRequestTime = Date.now();
}

function parseRetryAfterMs(err) {
  const raw = err?.headers?.['retry-after'] || err?.headers?.['Retry-After'];
  if (!raw) return null;
  const secs = Number(raw);
  if (!Number.isNaN(secs)) return secs * 1000;
  const dateMs = Date.parse(raw);
  return Number.isNaN(dateMs) ? null : Math.max(0, dateMs - Date.now());
}

function isQuotaError(err) {
  const status = err?.status;
  const code = err?.code || err?.error?.code;
  const msg = (err?.message || err?.error?.message || '').toLowerCase();
  return (
    code === 'insufficient_quota' ||
    status === 403 ||
    (status === 429 && (msg.includes('quota') || msg.includes('insufficient')))
  );
}

function isModelError(err) {
  const code = err?.code || err?.error?.code;
  const msg = (err?.message || err?.error?.message || '').toLowerCase();
  return (
    code === 'model_decommissioned' ||
    msg.includes('decommissioned') ||
    msg.includes('not supported') ||
    err?.status === 400
  );
}

// Enhanced chat function with model fallback
async function callChatWithRetry(client, payload) {
  const models = [GROQ_MODELS.primary, GROQ_MODELS.fallback, GROQ_MODELS.lightweight];
  let modelIndex = 0;
  let attempt = 0;

  while (modelIndex < models.length) {
    const modelToUse = models[modelIndex];
    // Remove response_format to avoid JSON validation issues
    const { response_format, ...cleanPayload } = payload;
    const payloadWithModel = { ...cleanPayload, model: modelToUse };
    
    console.log(`Attempting with model: ${modelToUse} (attempt ${attempt + 1})`);

    try {
      await throttleRequest(); // Throttle every request
      return await client.chat.completions.create(payloadWithModel);
    } catch (err) {
      const status = err?.status;
      const requestId = err?.request_id || err?.headers?.['x-request-id'];
      const errorMessage = err?.message || JSON.stringify(err?.error) || String(err);

      // Handle JSON validation errors specifically
      if (errorMessage.includes('json_validate_failed') || errorMessage.includes('Failed to generate JSON')) {
        console.warn(`JSON validation failed with model ${modelToUse}. Trying next model...`);
        modelIndex++;
        attempt = 0; // Reset attempts for new model
        continue;
      }

      // Handle model errors - try next model
      if (isModelError(err)) {
        console.warn(`Model ${modelToUse} failed: ${errorMessage}. Trying next model...`);
        modelIndex++;
        attempt = 0; // Reset attempts for new model
        continue;
      }

      // Handle quota errors
      if (isQuotaError(err)) {
        console.warn(`Groq quota/credits exhausted (request_id=${requestId || 'n/a'}). Cooling down for ${AI_QUOTA_COOLDOWN_MS}ms`);
        aiBackoffUntil = Date.now() + AI_QUOTA_COOLDOWN_MS;
        throw err;
      }

      // Handle rate limiting with exponential backoff
      if (status === 429 && attempt < AI_RATE_LIMIT_MAX_ATTEMPTS) {
        const retryAfterMs = parseRetryAfterMs(err);
        const backoff =
          retryAfterMs != null
            ? retryAfterMs
            : Math.min(10000, AI_RATE_LIMIT_BASE_DELAY_MS * Math.pow(2, attempt)) + Math.floor(Math.random() * 1000);
        
        attempt += 1;
        console.warn(`Groq rate-limited (attempt ${attempt}/${AI_RATE_LIMIT_MAX_ATTEMPTS}) with model ${modelToUse}. Backing off ${backoff}ms (request_id=${requestId || 'n/a'})`);
        await sleep(backoff);
        continue;
      }

      // If rate limited and no more attempts, try next model
      if (status === 429) {
        console.warn(`Rate limit exceeded for model ${modelToUse}. Trying next model...`);
        modelIndex++;
        attempt = 0;
        continue;
      }

      // For other errors, try next model
      console.warn(`Error with model ${modelToUse}: ${errorMessage}. Trying next model...`);
      modelIndex++;
      attempt = 0;
    }
  }

  // If all models failed, set backoff
  aiBackoffUntil = Date.now() + AI_RATE_LIMIT_COOLDOWN_MS;
  throw new Error('All Groq models failed or are unavailable');
}

function extractItemsFromContent(raw, desiredCount) {
  const out = [];
  if (typeof raw !== 'string' || raw.trim().length === 0) return out;

  // Try JSON parsing first
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    const jsonSlice = raw.slice(start, end + 1);
    try {
      const parsed = JSON.parse(jsonSlice);
      if (Array.isArray(parsed)) {
        for (const v of parsed) {
          if (typeof v === 'string' && v.trim()) {
            out.push(v.trim());
          }
          if (out.length >= desiredCount) break;
        }
      }
    } catch (parseError) {
      console.warn('JSON parsing failed, trying line-by-line extraction');
    }
  }

  // Fallback to line-by-line extraction
  if (out.length < desiredCount) {
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/^\s*[-*\d.)\]]+\s*/, '').trim()) // Enhanced regex
      .filter(Boolean)
      .filter(line => line.length > 10); // Filter out very short lines

    for (const l of lines) {
      if (!out.includes(l)) { // Simple deduplication
        out.push(l);
        if (out.length >= desiredCount) break;
      }
    }
  }

  // Final deduplication
  const seen = new Set();
  const deduped = [];
  for (const t of out) {
    const key = t.toLowerCase().substring(0, 50); // Compare first 50 chars
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(t);
    }
    if (deduped.length >= desiredCount) break;
  }
  return deduped;
}

// Simple content moderation using Groq instead of OpenAI
export const moderateContentWithGroq = async (text) => {
  if (process.env.ENABLE_CONTENT_MODERATION !== 'true') {
    return { flagged: false, categories: {} };
  }

  const client = getGroq();
  if (!client) {
    console.warn('GROQ_API_KEY missing; skipping moderation');
    return { flagged: false, categories: {} };
  }

  try {
    await throttleRequest();
    
    const response = await client.chat.completions.create({
      model: GROQ_MODELS.lightweight, // Use smallest model for moderation
      messages: [
        {
          role: 'system',
          content: 'You are a content moderator. Analyze the given text for inappropriate content including hate speech, violence, sexual content, or harmful material. Respond with only "SAFE" or "FLAGGED".'
        },
        {
          role: 'user',
          content: `Please moderate this content: "${text}"`
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    });

    const result = response?.choices?.[0]?.message?.content?.trim().toLowerCase();
    const flagged = result === 'flagged';
    
    return {
      flagged,
      categories: flagged ? { 'potentially_inappropriate': true } : {}
    };
  } catch (error) {
    console.warn('Groq moderation failed, defaulting to safe:', error.message);
    return { flagged: false, categories: {} }; // Default to safe if moderation fails
  }
};

// ===== Main AI Content Generation =====
export const generateAIContent = async (type, count = 3) => {
  const prompts = {
    joke: 'Tell me a clean, family-friendly joke.',
    fact: 'Share an interesting, lesser-known fact.',
    idea: 'Give me a practical productivity or life improvement tip.',
    quote: 'Create an inspiring, original motivational quote.'
  };

  const contents = [];
  
  // Early returns
  if (!ENABLE_AI) {
    console.log('AI generation disabled');
    return contents;
  }
  
  if (!prompts[type]) {
    console.warn(`Unsupported AI content type: ${type}`);
    return contents;
  }
  
  if (Date.now() < aiBackoffUntil) {
    console.warn(`AI generation is in cooldown until ${new Date(aiBackoffUntil).toISOString()}`);
    return contents;
  }

  const client = getGroq();
  if (!client) {
    console.warn('GROQ_API_KEY missing; skipping AI generation');
    return contents;
  }

  // Generate items one by one to avoid JSON issues
  console.log(`Generating ${count} ${type}(s) using Groq (one at a time)...`);
  
  for (let i = 0; i < count; i++) {
    try {
      // Simple, direct prompt without JSON formatting
      const payload = {
        model: currentModel,
        messages: [
          {
            role: 'system',
            content: `You are a helpful content creator. Generate clean, family-friendly content. Keep responses concise and engaging. Respond with only the ${type} content, nothing else.`
          },
          {
            role: 'user',
            content: prompts[type]
          }
        ],
        max_tokens: 100, // Reduced to ensure completion
        temperature: AI_TEMPERATURE
      };

      const response = await callChatWithRetry(client, payload);
      const text = response?.choices?.[0]?.message?.content?.trim();
      
      if (!text || text.length < 10) {
        console.warn(`Generated ${type} too short, skipping: "${text}"`);
        continue;
      }

      // Clean up the text
      let cleanText = text
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/^\d+\.\s*/, '') // Remove numbering
        .replace(/^[-*]\s*/, '') // Remove bullet points
        .trim();

      console.log(`Generated ${type}: ${cleanText.substring(0, 100)}...`);

      // Use Groq for moderation
      const moderation = await moderateContentWithGroq(cleanText);
      if (moderation?.flagged) {
        console.log(`Content flagged by moderation: ${cleanText.substring(0, 50)}...`);
        continue;
      }

      // Check for duplicates in current batch and existing content
      if (contents.some((c) => c.text?.toLowerCase() === cleanText.toLowerCase())) {
        console.log(`Duplicate content in current batch, skipping`);
        continue;
      }

      // Check against existing database content (simple check)
      try {
        const existingContent = await Content.findOne({ 
          text: { $regex: new RegExp(cleanText.substring(0, 50), 'i') },
          type 
        });
        
        if (existingContent) {
          console.log(`Similar content exists in database, skipping`);
          continue;
        }
      } catch (dbError) {
        console.warn('Database check failed, proceeding anyway:', dbError.message);
      }

      try {
        const content = new Content({
          text: cleanText,
          type,
          author: 'AI',
          aiGenerated: true,
          isApproved: true
        });
        
        await content.save();
        contents.push(content);
        console.log(`✅ Saved ${type} #${contents.length}: ${cleanText.substring(0, 50)}...`);
        
        // Small delay between saves to avoid overwhelming the system
        if (i < count - 1) {
          await sleep(500);
        }
        
      } catch (saveError) {
        console.warn('Failed saving generated content:', saveError?.message || saveError);
      }

    } catch (error) {
      console.warn(`Failed to generate ${type} #${i + 1}:`, error.message);
      
      // If this was a critical error, break the loop
      if (isQuotaError(error) || error.status === 429) {
        console.warn('Critical error encountered, stopping generation');
        break;
      }
      
      // For other errors, continue with next item
      continue;
    }
  }

  console.log(`✅ Successfully generated ${contents.length}/${count} ${type}(s)`);
  return contents;
};