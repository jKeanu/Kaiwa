import jwt from 'jsonwebtoken';

const verifyToken = (token, secretKey) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
        });
    });
};

export default verifyToken;
