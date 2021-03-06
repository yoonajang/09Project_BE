const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

const {
    writeReview,
    readReview
} = require('../controller/review');


// Review ์์ฑ
router.post('/me/:postId', authMiddleware, writeReview);

// Review ์กฐํ
router.get('/review/:userId', authMiddleware, readReview);


module.exports = router;
