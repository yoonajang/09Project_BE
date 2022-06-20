const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');


const {
    like,
    unLike
} = require('../controller/like');


// 좋아요 생성
router.get('/:postId', authMiddleware, like)

// 좋아요 삭제
router.delete('/:postId', authMiddleware, unLike)

module.exports = router;
