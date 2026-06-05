const jwt = require("jsonwebtoken");
const BlacklistToken = require("../models/blacklist.models");

async function authUser(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  // Check if the token is blacklisted
  const isTokenBlacklisted = await BlacklistToken.findOne({ token });
  if (isTokenBlacklisted) {
    return res.status(401).json({ message: "Unauthorized: Token is invalid" });
  }

  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

module.exports = {
  authUser,
};