const express = require('express');

const testRouter = express.Router();

testRouter.get('/', (req, res) => {
    res.json({ message: 'API is working' });
});

module.exports = testRouter;