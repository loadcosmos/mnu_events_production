import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify to remove potentially dangerous content
 *
 * @param {string} dirty - Unsanitized HTML string
 * @param {object} config - DOMPurify configuration options
 * @returns {string} - Sanitized HTML string safe for rendering
 *
 * @example
 * const unsafeHtml = '<img src=x onerror=alert(1)>';
 * const safeHtml = sanitizeHtml(unsafeHtml);
 * // Returns: '<img src="x">'
 */
export const sanitizeHtml = (dirty, config = {}) => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // Default configuration - allows basic formatting but removes scripts and dangerous attributes
  const defaultConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre',
      'div', 'span', 'img',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'id',
    ],
    ALLOW_DATA_ATTR: false, // Disallow data-* attributes
    ALLOW_UNKNOWN_PROTOCOLS: false, // Only allow http://, https://, mailto:, etc.
  };

  const mergedConfig = { ...defaultConfig, ...config };

  return DOMPurify.sanitize(dirty, mergedConfig);
};

/**
 * Sanitize text content - removes ALL HTML tags
 * Use this when you only want plain text
 *
 * @param {string} dirty - Unsanitized string
 * @returns {string} - Plain text string with all HTML removed
 *
 * @example
 * const unsafeText = '<script>alert(1)</script>Hello';
 * const safeText = sanitizeText(unsafeText);
 * // Returns: 'Hello'
 */
export const sanitizeText = (dirty) => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Remove all tags
    KEEP_CONTENT: true, // Keep the text content
  });
};

/**
 * Sanitize URL to prevent javascript: and data: protocol attacks
 *
 * @param {string} url - Unsanitized URL
 * @returns {string} - Sanitized URL or empty string if dangerous
 *
 * @example
 * const unsafeUrl = 'javascript:alert(1)';
 * const safeUrl = sanitizeUrl(unsafeUrl);
 * // Returns: ''
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove whitespace
  const trimmedUrl = url.trim();

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmedUrl.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  return trimmedUrl;
};

/**
 * Create a safe React-compatible object for dangerouslySetInnerHTML
 * This is the recommended way to render sanitized HTML in React
 *
 * @param {string} html - HTML string to sanitize
 * @param {object} config - DOMPurify configuration
 * @returns {object} - Object with __html property containing sanitized HTML
 *
 * @example
 * const userContent = '<p>Hello <script>alert(1)</script></p>';
 * <div dangerouslySetInnerHTML={createSafeMarkup(userContent)} />
 */
export const createSafeMarkup = (html, config = {}) => {
  return {
    __html: sanitizeHtml(html, config),
  };
};

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  createSafeMarkup,
};
