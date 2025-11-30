import { checkContentSafety } from './aiModeration.js';

// Content moderation middleware - combined AI + keyword filtering
const bannedKeywords = [
  // Offensive/hate speech
  'fuck', 'shit', 'bitch', 'asshole', 'bastard',
  'damn', 'hell', 'crap', 'piss', 'dick',
  // Add more as needed - this is a basic example
  'nigger', 'faggot', 'retard', 'cunt',
  // Spam indicators
  'buy now', 'click here', 'limited time', 'free money',
];

const checkContent = async (content) => {
  if (!content) return { clean: true };

  const lowerContent = content.toLowerCase();
  
  // OpenAI AI moderation - DISABLED for now (uncomment when ready for production)
  // if (process.env.OPENAI_API_KEY) {
  //   try {
  //     const aiResult = await checkContentSafety(content);
  //     if (!aiResult.safe) {
  //       return {
  //         clean: false,
  //         reason: aiResult.reason,
  //         flaggedBy: 'ai',
  //       };
  //     }
  //   } catch (error) {
  //     console.error('AI moderation failed, falling back to keyword filter:', error);
  //   }
  // }
  
  // Keyword filtering (primary moderation)
  for (const keyword of bannedKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        clean: false,
        reason: 'inappropriate_content',
        keyword,
        flaggedBy: 'keyword',
      };
    }
  }

  // Check for excessive caps (potential spam)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (content.length > 10 && capsRatio > 0.7) {
    return {
      clean: false,
      reason: 'spam',
      keyword: 'EXCESSIVE_CAPS',
      flaggedBy: 'spam_detection',
    };
  }

  // Check for repeated characters (spam pattern)
  if (/(.)\1{4,}/.test(content)) {
    return {
      clean: false,
      reason: 'spam',
      keyword: 'REPEATED_CHARS',
      flaggedBy: 'spam_detection',
    };
  }

  return { clean: true };
};

// Middleware for content filtering
const contentFilter = async (req, res, next) => {
  const { content } = req.body;

  if (!content) {
    return next();
  }

  const check = await checkContent(content);

  if (!check.clean) {
    console.log(`🚫 Content blocked: ${check.reason} (${check.flaggedBy})`);
    return res.status(400).json({
      success: false,
      message: 'Your message contains inappropriate content or spam',
      reason: check.reason,
      flaggedBy: check.flaggedBy,
      detail: check.keyword ? `Detected: ${check.keyword}` : undefined,
    });
  }

  next();
};

export { contentFilter, checkContent };
