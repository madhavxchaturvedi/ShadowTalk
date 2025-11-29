// Helper functions

export const generateAnonymousId = () => {
  const prefix = 'Shadow';
  const randomString = Math.random().toString(36).substring(2, 11);
  const timestamp = Date.now().toString(36).substring(-4);
  return `${prefix}${randomString}${timestamp}`;
};

export const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const calculateUserLevel = (points) => {
  // Every 50 points = 1 level
  return Math.floor(points / 50) + 1;
};

export const getBadgesForLevel = (level) => {
  const badges = [];
  
  if (level >= 2) badges.push('Newcomer');
  if (level >= 5) badges.push('Active Member');
  if (level >= 10) badges.push('Veteran');
  if (level >= 20) badges.push('Legend');
  if (level >= 50) badges.push('Shadow Master');
  
  return badges;
};
