import xss from 'xss';

// Helper function to recursively sanitize data
const sanitizeObject = (obj) => {
	for (const key in obj) {
    	if (obj.hasOwnProperty(key)) {
      		const value = obj[key];
			if (typeof value === 'string' && value.trim() !== ''){
				obj[key] = xss(value);  // Sanitize string values
			}else if (typeof value === 'object' && value !== null){
			// If it's an object or array, recursively sanitize it
				sanitizeObject(value);
			}
    	}
 	}
};

// Middleware to sanitize the request body, query, and params
const sanitizeRequest = (req, res, next) => {
    try {
        if (req.body) sanitizeObject(req.body);
        if (req.query) sanitizeObject(req.query);
        if (req.params) sanitizeObject(req.params);
        next();
    } catch (err) {
        next(err);  // Handle errors
    }
};

export default sanitizeRequest
