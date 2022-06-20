const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const upload = require('../S3/s3');

const {
    readPost,
    writePost,
    deletePost,
    completePost

} = require('../controller/post');


// 상세 게시글 조회
router.get('/:postId', readPost);

// 게시글 작성
router.post('/postadd', authMiddleware, upload.single('image'), writePost);

// 게시글 삭제
router.delete('/:postId', authMiddleware, deletePost)

// 게시글 거래완료
router.put('/:postId', authMiddleware, completePost)


module.exports = router;
