const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const SECRET_KEY = process.env.SECRET_KEY;

const signToken = (payload) => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });
};

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
    } catch (err) {
        return null;
    }
};

const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
};

const comparePassword = (plainPassword, hashedPassword) => {
    return bcrypt.compareSync(plainPassword, hashedPassword);
};

module.exports = {
    signToken,
    verifyToken,
    hashPassword,
    comparePassword,
};
