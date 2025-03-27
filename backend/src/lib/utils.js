import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, // To Prevent from XSS attacks cross-site scripting attacks
    sameSite: "strict", // CRSF attacks forgery attacks
    secure: process.env.NODE_ENV != "development",
  });

  return token;
};

// Content moderation utility
export const moderateContent = (content) => {
  if (!content || typeof content !== 'string') {
    return {
      isClean: true,
      moderatedContent: content || '',
      containsInappropriate: false
    };
  }

  // List of prohibited words and patterns
  const badWords = [
    'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'dick', 'pussy',
    'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut', 'kike', 'spic',
    'chink', 'kill yourself', 'kys'
  ];

  // Use regex to create word boundary patterns for more accurate matching
  const wordBoundaryPatterns = badWords.map(word => {
    return {
      word,
      pattern: new RegExp(`\\b${word}\\b`, 'gi')
    };
  });

  // Check for inappropriate content
  let processedContent = content;
  let containsInappropriate = false;

  wordBoundaryPatterns.forEach(({ word, pattern }) => {
    if (pattern.test(processedContent)) {
      containsInappropriate = true;

      // Replace bad words with asterisks
      processedContent = processedContent.replace(pattern, match =>
        '*'.repeat(match.length)
      );
    }
  });

  return {
    isClean: !containsInappropriate,
    moderatedContent: processedContent,
    containsInappropriate
  };
};
