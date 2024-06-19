const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// JWT secret key (should be an environment variable in production)
const SECRET_KEY = process.env.SECRET_KEY;

// Helper function to sign JWT token
const signToken = (payload) => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });
};

// Helper function to verify JWT token
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
    } catch (err) {
        return null;
    }
};

// Helper function to hash password
const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
};

// Helper function to compare plain password with hashed password
const comparePassword = (plainPassword, hashedPassword) => {
    return bcrypt.compareSync(plainPassword, hashedPassword);
};

module.exports = {
    signToken,
    verifyToken,
    hashPassword,
    comparePassword,
};
