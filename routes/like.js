const express = require('express');
const router = express.Router();
const db = require('../config');

const authMiddleware = require('../middlewares/auth');

// domain/main/like

// 좋아요 생성
router.get('/:postId', authMiddleware, (req, res) => {
    const userId = res.locals.user.userId;
    const postId = req.params.postId;

    const sql =
        'SELECT `Post_postId`,`User_userId` FROM `Like` WHERE `Post_postId`=? and `User_userId`=?';

    db.query(sql, [postId, userId], (err, rows) => {
        if (rows.length === 0) {
            const sql =
                'INSERT INTO `Like` (`Post_postId`,`User_userId`) VALUES (?,?)';

            db.query(sql, [Number(postId), userId], (err, like) => {
                if (err) console.log(err);
                res.send({ msg: 'success' });
            });
        } else {
            res.send({ msg: 'fail' });
        }
    });
});

// 좋아요 삭제
router.delete('/:postId', authMiddleware, (req, res) => {
    const userId = res.locals.user.userId;
    const postId = req.params.postId;

    const sql =
        'SELECT `Post_postId`,`User_userId` FROM `Like` WHERE `Post_postId`=? and `User_userId`=?';

    db.query(sql, [postId, userId], (err, rows) => {
        if (rows.length !== 0) {
            const sql =
                'DELETE FROM `Like` WHERE `Post_postId`=? and `User_userId`=?';

            db.query(sql, [Number(postId), userId], (err, data) => {
                if (err) console.log(err);
                res.send({ msg: 'success' });
            });
        } else {
            res.send({ msg: 'fail' });
        }
    });
});


module.exports = router;
