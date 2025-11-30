import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Check content safety using OpenAI Moderation API
 * @param {String} content - Text content to check
 * @returns {Object} - { safe: boolean, flagged: boolean, categories: object, reason: string }
 */
export const checkContentSafety = async (content) => {
  try {
    // If no API key, skip AI moderation (fall back to basic filter)
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not set - skipping AI moderation');
      return { safe: true, flagged: false, categories: {}, reason: null };
    }

    const response = await openai.moderations.create({
      input: content,
    });

    const result = response.results[0];
    
    if (result.flagged) {
      // Find which category was flagged
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category, _]) => category);

      const reason = flaggedCategories.join(', ');

      console.log(`🚫 Content flagged by AI: ${reason}`);
      
      return {
        safe: false,
        flagged: true,
        categories: result.categories,
        categoryScores: result.category_scores,
        reason,
      };
    }

    console.log('✅ Content passed AI moderation');
    
    return {
      safe: true,
      flagged: false,
      categories: result.categories,
      categoryScores: result.category_scores,
      reason: null,
    };
  } catch (error) {
    // Handle rate limits silently - keyword filter already caught inappropriate content
    if (error.status === 429) {
      console.warn('⚠️  OpenAI rate limit - falling back to keyword filter');
    } else {
      console.error('❌ OpenAI moderation error:', error.message);
    }
    
    // If API fails, allow content but log the error
    // Keyword filter already blocked inappropriate content before this runs
    return { safe: true, flagged: false, categories: {}, reason: 'API error', error: error.message };
  }
};

/**
 * Middleware to check content before saving
 */
export const aiModerationMiddleware = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return next();
    }

    const moderation = await checkContentSafety(content);

    if (!moderation.safe) {
      return res.status(400).json({
        success: false,
        message: `Content flagged for: ${moderation.reason}. Please review our community guidelines.`,
        flagged: true,
        reason: moderation.reason,
      });
    }

    // Attach moderation result to request for logging
    req.moderation = moderation;
    next();
  } catch (error) {
    console.error('AI moderation middleware error:', error);
    // Continue even if moderation fails
    next();
  }
};
