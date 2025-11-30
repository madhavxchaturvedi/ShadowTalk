// Content moderation middleware - keyword-based filtering
const bannedKeywords = [
  // Offensive/hate speech
  'fuck', 'shit', 'bitch', 'asshole', 'bastard',
  'damn', 'hell', 'crap', 'piss', 'dick',
  // Add more as needed - this is a basic example
  'nigger', 'faggot', 'retard', 'cunt',
  // Spam indicators
  'buy now', 'click here', 'limited time', 'free money',
];

const checkContent = (content) => {
  if (!content) return { clean: true };

  const lowerContent = content.toLowerCase();
  
  // Check for banned keywords
  for (const keyword of bannedKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        clean: false,
        reason: 'inappropriate_content',
        keyword,
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
    };
  }

  // Check for repeated characters (spam pattern)
  if (/(.)\1{4,}/.test(content)) {
    return {
      clean: false,
      reason: 'spam',
      keyword: 'REPEATED_CHARS',
    };
  }

  return { clean: true };
};

const contentFilter = (req, res, next) => {
  const { content } = req.body;

  if (!content) {
    return next();
  }

  const check = checkContent(content);

  if (!check.clean) {
    return res.status(400).json({
      error: 'Your message contains inappropriate content or spam',
      reason: check.reason,
      detail: `Detected: ${check.keyword}`,
    });
  }

  next();
};

export { contentFilter, checkContent };
