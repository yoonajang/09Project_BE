const express = require('express');
const router = express.Router();
const db = require('../config');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth');
const path = require('path');

const bcrypt = require('bcrypt');
const saltRounds = 10;

// 회원가입
router.post('/signUp', (req, res, next) => {
    const userImage = 'https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27';
    const param = [
        req.body.userEmail,
        req.body.userName,
        req.body.userPassword,
        userImage,
    ];

    bcrypt.hash(param[2], saltRounds, (err, hash) => {
        param[2] = hash;
        db.query(
            'INSERT INTO User(`userEmail`, `userName`, `password`, `userImage`) VALUES (?,?,?,?)',
            param,
            (err, data) => {
                if (err) {
                    console.log(err);
                    res.status(401).send({ meg: 'fail' });
                } else {
                    res.status(201).send({ meg: 'success' });
                }
            },
        );
    });
});

// 이메일 중복확인
router.post('/emailCheck', (req, res) => {
    const email = req.body.userEmail;
    const sql = 'select * from User where userEmail=?';

    db.query(sql, [email], (err, data) => {
        if (data.length === 0) {
            console.log(err);
            res.status(201).send({ msg: '사용할 수 있는 이메일입니다' });
        } else {
            res.status(401).send({ msg: '중복된 이메일입니다' });
        }
    });
});

// 닉네임 중복확인
router.post('/nameCheck', (req, res) => {
    const name = req.body.userName;
    const sql = 'select * from User where userName=?';

    db.query(sql, [name], (err, data) => {
        if (data.length === 0) {
            console.log(err);
            res.status(201).send({ msg: '사용할 수 있는 닉네임입니다' });
        } else {
            res.status(401).send({ msg: '중복된 닉네임입니다' });
        }
    });
});

//

// 로그인
router.post('/login', (req, res) => {
    const param = [req.body.userEmail, req.body.userPassword];
    const sql = 'SELECT * FROM User WHERE userEmail=?';

    db.query(sql, param[0], (err, data) => {
        if (err) console.log(err);

        if (data.length > 0) {
            bcrypt.compare(param[1], data[0].password, (err, result) => {
                if (result) {
                    const userInfo = {
                        userId: data[0].userId,
                        userEmail: data[0].userEmail,
                        userName: data[0].userName,
                        userImage: data[0].userImage,
                        tradeCount: data[0].tradeCount,
                    };
                    const token = jwt.sign(
                        { userId: data[0].userId },
                        process.env.JWT_SECRET,
                    );
                    res.status(201).send({ msg: 'success', token, userInfo });
                } else {
                    console.log('비밀번호 틀림');
                    res.status(401).send({ msg: 'fail' });
                }
            });
        } else {
            console.log('아이디 없음');
            res.status(401).send({ msg: 'fail' });
        }
    });
});

// 로그인 여부확인
router.get('/isLogin', authMiddleware, async (req, res) => {
    const { user } = res.locals;
    console.log({ user });
    res.send({
        userinfo: {
            userId: user.userId,
            userEmail: user.userEmail,
            userName: user.userName,
            userImage: user.userImage,
            tradeCount: user.tradeCount,
        },
    });
});

// 유저 프로필 업로드

const upload = require('../S3/s3');
const { PollyCustomizations } = require('aws-sdk/lib/services/polly');
router.post(
    '/me',
    upload.single('userImage'),
    authMiddleware,
    async (req, res) => {
        const userId = res.locals.user.userId;
        const userImage = req.file?.location;
        console.log(userId, userImage);
        try {
            const sql = ' UPDATE User SET userImage=? WHERE userId=?';
            db.query(sql, [userImage, userId], (err, rows) => {
                res.status(201).send({ msg: '글 등록 성공' });
            });
        } catch (error) {
            res.status(400).send({ msg: '프로필이 수정되지 않았습니다.' });
        }
    },
);

//유저 마이페이지

//buylist
router.get('/buy/:userId', authMiddleware, (req, res) => {
    const userId = req.params.userId;

    const sql =
        'SELECT * FROM Post WHERE `User_userId`= ? and `category`="buy"';

    db.query(sql, [userId], (err, data) => {
        if (err) console.log(err);
        console.log(data);
        res.status(201).send({ msg: 'success', data });
    });
});

router.get('/eat/:userId', authMiddleware, (req, res) => {
    const userId = req.params.userId;

    const sql =
        'SELECT * FROM Post WHERE `User_userId`= ? and `category`="eat"';

    db.query(sql, [userId], (err, data) => {
        if (err) console.log(err);
        console.log(data);
        res.status(201).send({ msg: 'success', data });
    });
});

//유저 좋아요

router.get('/like/:userId', authMiddleware, (req, res) => {
    const userId = req.params.userId;

    const sql = 'SELECT * FROM `Like` WHERE `User_userId`= ?';
    db.query(sql, [userId], (err, data) => {
        if (err) console.log(err);
        res.status(201).send({ msg: 'success', data });
    });
});

module.exports = router;
