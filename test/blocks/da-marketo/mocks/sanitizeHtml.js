/* eslint-disable import/prefer-default-export */

// Parsing-only stub; sanitization itself is covered in Milo, not these integration tests.
export function sanitizeHtmlBody(value) {
  return new DOMParser().parseFromString(value, 'text/html').body;
}
