import xss from 'xss';

/**
 * Sanitizes an object or string to prevent XSS attacks.
 * Recursively cleans all string values in an object.
 */
export const sanitize = (input: any): any => {
  if (typeof input === 'string') {
    return xss(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitize(item));
  }

  if (input !== null && typeof input === 'object') {
    const sanitizedObj: any = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitizedObj[key] = sanitize(input[key]);
      }
    }
    return sanitizedObj;
  }

  return input;
};
