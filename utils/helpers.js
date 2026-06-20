const crypto = require('crypto');

/**
 * Validate presence of required environment variables.
 */
function validateEnv() {
  const missing = [];
  if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
  
  if (missing.length > 0) {
    console.error(`🚨 CRITICAL CONFIGURATION ERROR: Missing Env variables: ${missing.join(', ')}`);
    return { success: false, missing };
  }
  return { success: true };
}

/**
 * Basic HTML tag stripper for XSS protection.
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Recursively sanitize objects and array payloads.
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'string') {
        sanitized[key] = sanitizeString(val);
      } else if (typeof val === 'object') {
        sanitized[key] = sanitizeObject(val);
      } else {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
}

// In-memory rate limiting map
const rateLimitMap = new Map();

/**
 * Serverless simple rate limiter.
 * @param {string} ip - Request IP address.
 * @param {number} limit - Maximum requests allowed per window.
 * @param {number} windowMs - Time window in milliseconds.
 */
function rateLimiter(ip, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const key = ip || 'anonymous';

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  const rateData = rateLimitMap.get(key);
  if (now > rateData.resetTime) {
    rateData.count = 1;
    rateData.resetTime = now + windowMs;
    return { success: true, remaining: limit - 1 };
  }

  rateData.count++;
  if (rateData.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - rateData.count };
}

/**
 * Standard API error responder.
 */
function handleError(res, error, statusCode = 500) {
  console.error('API Server Error:', error);
  return res.status(statusCode).json({
    error: error.message || error || 'An unexpected error occurred',
    success: false
  });
}

/**
 * Safe currency format for INR.
 */
function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Safe date parsing and formatting.
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return 'N/A';
  }
}

module.exports = {
  validateEnv,
  sanitizeString,
  sanitizeObject,
  rateLimiter,
  handleError,
  formatCurrency,
  formatDate
};
