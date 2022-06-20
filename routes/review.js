const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

const {
    writeReview,
    readReview
} = require('../controller/review');


// Review 작성
router.post('/me/:postId', authMiddleware, writeReview);

// Review 조회
router.get('/review/:userId', authMiddleware, readReview);


module.exports = router;
