const { verifyToken } = require("../authUtil");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: "Authorization token missing" });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: "Invalid authorization token" });
    }

    req.customerId = decoded.customerId;
    next();
};

module.exports = authMiddleware;
