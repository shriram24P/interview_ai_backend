const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const BlacklistToken = require("../models/blacklist.models");

async function registerUser(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide username, email, and password" });
  }

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserAlreadyExists) {
    return res
      .status(400)
      .json({ message: "Account already exists with this username or email" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await userModel.create({
    username,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign(
    {
      id: newUser._id,
      username: newUser.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    message: "User registered successfully",
    user: {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    },
  });
}

/**
 * @desc Login user and return JWT token
 * @route POST /api/auth/login
 * @access Public
 */
async function loginUser(req, res) {
  console.log("Login request received with body: ", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "User logged in successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

async function logoutUser(req, res) {
  const token = req.cookies.token;

  if (token) {
    // Add the token to the blacklist
    await BlacklistToken.create({ token });

    // Clear the cookie
    res.clearCookie("token");
    return res.status(200).json({ message: "User logged out successfully" });
  }
}

async function getMe(req, res) {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
};
