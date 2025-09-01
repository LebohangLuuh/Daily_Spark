import Groq from 'groq-sdk';

// Simple word-based filter as fallback
const INAPPROPRIATE_KEYWORDS = [
  // Add your inappropriate keywords here
  'spam', 'scam', 'hate', 'violent', 'inappropriate'
];

let groqClient = null;
function getGroq() {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  groqClient = new Groq({ apiKey });
  return groqClient;
}

// Simple keyword-based moderation as fallback
const simpleModeration = (text) => {
  const lowerText = text.toLowerCase();
  const flagged = INAPPROPRIATE_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  return {
    flagged,
    categories: flagged ? { 'keyword_match': true } : {}
  };
};

// AI-powered moderation using Groq
const aiModeration = async (text) => {
  const client = getGroq();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: 'gemma2-9b-it', // Use lightweight model for moderation
      messages: [
        {
          role: 'system',
          content: `You are a content moderator. Analyze text for:
          - Hate speech or discrimination
          - Violence or threats
          - Sexual content
          - Spam or scams
          - Harmful or dangerous content
          
          Respond with ONLY one word: "SAFE" or "FLAGGED"`
        },
        {
          role: 'user',
          content: `Moderate this content: "${text}"`
        }
      ],
      max_tokens: 5,
      temperature: 0.1
    });

    const result = response?.choices?.[0]?.message?.content?.trim().toLowerCase();
    const flagged = result === 'flagged';
    
    return {
      flagged,
      categories: flagged ? { 'ai_moderation': true } : {},
      confidence: flagged ? 0.8 : 0.9
    };
  } catch (error) {
    console.warn('AI moderation failed:', error.message);
    return null;
  }
};

// Enhanced content length and quality checks
const contentQualityCheck = (text) => {
  const issues = [];
  
  // Length checks
  if (text.length < 10) {
    issues.push('too_short');
  }
  if (text.length > 2000) {
    issues.push('too_long');
  }
  
  // Quality checks
  const uppercaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (uppercaseRatio > 0.5) {
    issues.push('excessive_caps');
  }
  
  // Repetitive content
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 5 && uniqueWords.size / words.length < 0.3) {
    issues.push('repetitive');
  }
  
  // Special characters spam
  const specialCharRatio = (text.match(/[!@#$%^&*()_+=\[\]{}|;':",./<>?`~]/g) || []).length / text.length;
  if (specialCharRatio > 0.3) {
    issues.push('excessive_special_chars');
  }
  
  return {
    flagged: issues.length > 0,
    categories: issues.reduce((acc, issue) => ({ ...acc, [issue]: true }), {}),
    issues
  };
};

// Main moderation function
export const moderateContent = async (text) => {
  // Skip moderation if disabled
  if (process.env.ENABLE_CONTENT_MODERATION !== 'true') {
    return { flagged: false, categories: {} };
  }

  // Input validation
  if (!text || typeof text !== 'string') {
    return { flagged: true, categories: { 'invalid_input': true } };
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    return { flagged: true, categories: { 'empty_content': true } };
  }

  try {
    // 1. Quality checks (fast)
    const qualityCheck = contentQualityCheck(trimmedText);
    if (qualityCheck.flagged) {
      console.log(`Content failed quality check: ${qualityCheck.issues.join(', ')}`);
      return qualityCheck;
    }

    // 2. Simple keyword check (fast)
    const keywordCheck = simpleModeration(trimmedText);
    if (keywordCheck.flagged) {
      console.log('Content flagged by keyword filter');
      return keywordCheck;
    }

    // 3. AI moderation (slower, but more accurate)
    const aiCheck = await aiModeration(trimmedText);
    if (aiCheck) {
      if (aiCheck.flagged) {
        console.log('Content flagged by AI moderation');
      }
      return aiCheck;
    }

    // 4. If AI moderation fails, use keyword check result
    console.log('AI moderation unavailable, using keyword filter result');
    return keywordCheck;

  } catch (error) {
    console.error('Moderation error:', error);
    // If all moderation fails, err on the side of caution for sensitive content
    const containsSensitiveKeywords = INAPPROPRIATE_KEYWORDS.some(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return {
      flagged: containsSensitiveKeywords,
      categories: { 'moderation_error': true },
      error: error.message
    };
  }
};

// Utility function to add custom inappropriate keywords
export const addInappropriateKeywords = (keywords) => {
  INAPPROPRIATE_KEYWORDS.push(...keywords);
};

// Utility function to check moderation status
export const getModerationStatus = () => {
  return {
    enabled: process.env.ENABLE_CONTENT_MODERATION === 'true',
    groqAvailable: !!getGroq(),
    keywordCount: INAPPROPRIATE_KEYWORDS.length
  };
};