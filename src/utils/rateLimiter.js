class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests; // Maximum number of requests allowed
    this.timeWindow = timeWindow; // Time window in milliseconds
    this.requests = new Map(); // Stores timestamps of requests for each clientId
  }

  /**
   * Checks if a request from the given clientId should be allowed.
   * @param {string} clientId - The unique identifier for the client (e.g., IP address, user ID).
   * @returns {boolean} - True if the request is allowed, false if rate limited.
   */
  isAllowed(clientId) {
    const now = Date.now();
    
    // Initialize request array for the client if it doesn't exist
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }

    const clientRequests = this.requests.get(clientId);

    // Remove old requests that are outside the current time window
    while (clientRequests.length > 0 && clientRequests[0] <= now - this.timeWindow) {
      clientRequests.shift();
    }

    // Check if the number of requests is within the limit
    if (clientRequests.length < this.maxRequests) {
      // Allow request and record timestamp
      clientRequests.push(now);
      return true;
    }

    // Rate limit exceeded
    return false;
  }
}

// Dummy generic express middleware example
const createRateLimitMiddleware = (maxRequests, timeWindowInSeconds) => {
  const limiter = new RateLimiter(maxRequests, timeWindowInSeconds * 1000);

  return (req, res, next) => {
    // Assuming client IP address is used as the unique identifier
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';

    if (limiter.isAllowed(clientId)) {
      next(); // Proceed to the next middleware or route handler
    } else {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded your request limit. Please try again later.'
      });
    }
  };
};

module.exports = {
  RateLimiter,
  createRateLimitMiddleware
};
