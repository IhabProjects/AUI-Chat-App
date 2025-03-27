/**
 * Safely maps over an array, handling non-array values gracefully
 * @param {any} arr - The array to map over
 * @param {Function} mapFn - The mapping function
 * @param {Array} fallback - Value to use if input is not an array
 * @returns {Array} - The mapped array or fallback value
 */
export const safeMap = (arr, mapFn, fallback = []) => {
  if (!Array.isArray(arr)) return fallback;
  return arr.map(mapFn);
};

/**
 * Safely filter an array, handling non-array values gracefully
 * @param {any} arr - The array to filter
 * @param {Function} filterFn - The filter function
 * @param {Array} fallback - Value to use if input is not an array
 * @returns {Array} - The filtered array or fallback value
 */
export const safeFilter = (arr, filterFn, fallback = []) => {
  if (!Array.isArray(arr)) return fallback;
  return arr.filter(filterFn);
};

/**
 * Ensures a value is an array
 * @param {any} value - The value to check
 * @param {Array} fallback - Value to use if input is not an array
 * @returns {Array} - The input if it's an array, or the fallback
 */
export const ensureArray = (value, fallback = []) => {
  return Array.isArray(value) ? value : fallback;
};

/**
 * Advanced search function with Fuse.js
 * @param {Array} data - The data to search through
 * @param {string} query - The search query
 * @param {Object} options - Fuse.js options
 * @returns {Array} - The search results
 */
export const fuzzySearch = (data, query, options = {}) => {
  // Dynamic import for Fuse.js to avoid issues with SSR
  // and only load when needed
  return import('fuse.js').then(({ default: Fuse }) => {
    const defaultOptions = {
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
      useExtendedSearch: true,
      shouldSort: true,
      ...options
    };

    const fuse = new Fuse(data, defaultOptions);
    const results = fuse.search(query);

    // Return just the items, sorted by score
    return results.map(result => ({
      ...result.item,
      score: 1 - result.score // Convert to a 0-1 score where 1 is best
    }));
  });
};

/**
 * Debounce a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in ms
 * @returns {Function} - The debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Calculate relative time from date with appropriate formatting
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted relative time
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const dateObj = new Date(date);
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Content moderation utility to filter out inappropriate content
 * @param {string} content - The content to moderate
 * @param {Object} options - Configuration options
 * @returns {Object} - Moderation result with clean content and flags
 */
export const moderateContent = (content, options = {}) => {
  if (!content || typeof content !== 'string') {
    return {
      isClean: true,
      moderatedContent: content || '',
      containsInappropriate: false,
      flags: []
    };
  }

  // List of prohibited words and patterns
  // This is a basic list and should be expanded based on your community guidelines
  const badWords = [
    'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'dick', 'pussy',
    'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut', 'kike', 'spic',
    'chink', 'kill yourself', 'kys'
  ];

  // Customize the list based on options
  const moderationList = options.customBadWords
    ? [...badWords, ...options.customBadWords]
    : badWords;

  // Store which inappropriate content was found
  const flags = [];

  // Use regex to create word boundary patterns for more accurate matching
  const wordBoundaryPatterns = moderationList.map(word => {
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
      flags.push(word);

      // Replace bad words with asterisks if required
      if (options.replaceBadWords !== false) {
        processedContent = processedContent.replace(pattern, match =>
          '*'.repeat(match.length)
        );
      }
    }
  });

  return {
    isClean: !containsInappropriate,
    moderatedContent: processedContent,
    containsInappropriate,
    flags
  };
};

/**
 * Checks if content is appropriate before sending/posting
 * Returns clean content if it passes moderation or throws error if rejected
 * @param {string} content - The content to check
 * @param {Object} options - Configuration options including strictness level
 * @returns {string} - The moderated content if it passes
 * @throws {Error} - If content is rejected based on moderation settings
 */
export const validateContent = (content, options = {}) => {
  const {
    strictLevel = 'medium', // 'low', 'medium', 'high'
    allowWithWarning = false,
    customMessage = null
  } = options;

  const result = moderateContent(content, options);

  // If content is clean, return it
  if (result.isClean) {
    return content;
  }

  // Different handling based on strictness level
  switch (strictLevel) {
    case 'high':
      // High strictness: reject any flagged content
      throw new Error(
        customMessage ||
        `Your message contains inappropriate content and cannot be sent.`
      );

    case 'medium':
      // Medium strictness: replace bad words but warn/reject if too many flags
      if (result.flags.length > 2 && !allowWithWarning) {
        throw new Error(
          customMessage ||
          `Your message contains too many inappropriate words.`
        );
      }
      return result.moderatedContent;

    case 'low':
      // Low strictness: always replace bad words but allow posting
      return result.moderatedContent;

    default:
      return result.moderatedContent;
  }
};

// You can add other utility functions here
