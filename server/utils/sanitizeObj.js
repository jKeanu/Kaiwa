import xss from 'xss';

// Helper function to recursively sanitize data
const sanitizeObject = (obj) => {
    const currObj = { ...obj };
    for (const key in currObj) {
        if (Object.prototype.hasOwnProperty.call(currObj, key)) {
            const value = currObj[key];
            if (typeof value === 'string' && value.trim() !== '') {
                currObj[key] = xss(value); // Sanitize string values
            } else if (typeof value === 'object' && value !== null) {
                // If it's an object or array, recursively sanitize it
                currObj[key] = sanitizeObject(value); // Store recursive result
            }
        }
    }
    return currObj;
};

export default sanitizeObject;
