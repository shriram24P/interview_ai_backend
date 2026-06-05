const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const authRouter = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', authController.registerUser);

/**
 * @route POST /api/auth/login
 * @desc Login user with email and password
 * @access Public
 */
authRouter.post('/login', authController.loginUser);


/** * @route POST /api/auth/logout
 * @desc Logout user by blacklisting the token and clearing the cookie
 * @access Public
 */
authRouter.get('/logout', authController.logoutUser);  


/**
 * @route GET /api/auth/get-me
 * @desc Get the currently logged-in user's information
 * @access Private
 */
authRouter.get('/get-me', authMiddleware.authUser, authController.getMe);

module.exports = authRouter;