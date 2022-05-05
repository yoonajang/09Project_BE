const express = require('express');
const router = express.Router();
const db = require('../config');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth');
<<<<<<< HEAD
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
let appDir = path.dirname(require.main.filename);
=======
const path = require('path');
>>>>>>> user_09

const bcrypt = require('bcrypt');
const saltRounds = 10;

// 회원가입
<<<<<<< HEAD
router.post('/signup', (req, res, next) => {
    const userImage = 'https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27';
    const { userEmail, userName, userPassword } = req.body;
    const param = [userEmail, userName, userPassword, userImage];

    db.query(
        'SELECT * FROM AuthNum WHERE userEmail=?',
        userEmail,
        (err, data) => {
            if (data.length) {
                bcrypt.hash(param[2], saltRounds, (err, hash) => {
                    param[2] = hash;
                    db.query(
                        'INSERT INTO `User`(`userEmail`, `userName`, `password`, `userImage`) VALUES (?,?,?,"https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27")',
                        param,
                        (err, row) => {
                            if (err) {
                                console.log(err);
                                res.send({ meg: 'fail' });
                            } else {
                                res.send({ meg: 'success' });
                            }
                        },
                    );
                });
            } else {
                res.send({ meg: 'fail' });
            }
        },
    );
});

//회원가입시 이메일 인증
router.post('/mail', async (req, res) => {
    const userEmail = req.body.userEmail;
    let authNum = Math.random().toString().substr(2, 6);
    let emailTemplete;

    ejs.renderFile(
        appDir + '/template/authMail.ejs',
        { authCode: authNum },
        function (err, data) {
            if (err) {
                console.log(err);
            }
            emailTemplete = data;
        },
    );

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.nodemailerUser,
            pass: process.env.nodemailerPw,
        },
    });

    //메일 제목 설정
    let mailOptions = await transporter.sendMail({
        from: process.env.nodemailerUser,
        to: userEmail,
        subject: '[Nbbang] 회원가입을 위한 인증번호를 입력해주세요.',
        html: emailTemplete,
    });

    //authNum 저장
    db.query(
        'SELECT * FROM AuthNum WHERE userEmail=?',
        userEmail,
        (err, data) => {
            // if(err) console.log(err)
            console.log(data.length === 0);
            if (data.length === 0) {
                db.query(
                    'INSERT AuthNum(`authNum`, `userEmail`) VALUES (?,?)',
                    [authNum, userEmail],
                    (err, data) => {
                        res.send({ msg: 'success' });
                    },
                );
            } else {
                db.query(
                    'UPDATE AuthNum SET authNum=? WHERE userEmail=?',
                    [authNum, userEmail],
                    (err, data) => {
                        res.send({ msg: 'success' });
                    },
                );
            }
        },
    );
});

//이메일 인증 확인
router.post('/mailauth', async (req, res) => {
    const { userEmail, authNum } = req.body;

    db.query(
        'SELECT * FROM AuthNum WHERE userEmail=?',
        userEmail,
        (err, data) => {
            if (data[0].authNum === authNum) {
                res.send({ msg: 'success' });
            } else {
                res.send({ msg: 'fail' });
            }
        },
    );
});

=======
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

>>>>>>> user_09
// 이메일 중복확인
router.post('/emailcheck', (req, res) => {
    const email = req.body.userEmail;
    const sql = 'select * from User where userEmail=?';

    db.query(sql, [email], (err, data) => {
        if (data.length === 0) {
            console.log(err);
<<<<<<< HEAD
            res.send({ msg: 'success' });
        } else {
            res.send({ msg: 'fail' });
=======
            res.status(201).send({ msg: '사용할 수 있는 이메일입니다' });
        } else {
            res.status(401).send({ msg: '중복된 이메일입니다' });
>>>>>>> user_09
        }
    });
});

// 닉네임 중복확인
<<<<<<< HEAD
router.post('/namecheck', (req, res) => {
=======
router.post('/nameCheck', (req, res) => {
>>>>>>> user_09
    const name = req.body.userName;
    const sql = 'select * from User where userName=?';

    db.query(sql, [name], (err, data) => {
        if (data.length === 0) {
            console.log(err);
<<<<<<< HEAD
            res.send({ msg: 'success' });
        } else {
            res.send({ msg: 'fail' });
=======
            res.status(201).send({ msg: '사용할 수 있는 닉네임입니다' });
        } else {
            res.status(401).send({ msg: '중복된 닉네임입니다' });
>>>>>>> user_09
        }
    });
});

<<<<<<< HEAD
// 로그인
router.post('/login', (req, res) => {
    const param = [req.body.userEmail, req.body.password];
    const sql = 'SELECT * FROM User WHERE userEmail=?';

    console.log(param);
=======
//

// 로그인
router.post('/login', (req, res) => {
    const param = [req.body.userEmail, req.body.userPassword];
    const sql = 'SELECT * FROM User WHERE userEmail=?';
>>>>>>> user_09

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
<<<<<<< HEAD
                    res.send({ msg: 'success', token, userInfo });
                } else {
                    console.log('비밀번호 틀림');
                    res.send({ msg: 'fail' });
=======
                    res.status(201).send({ msg: 'success', token, userInfo });
                } else {
                    console.log('비밀번호 틀림');
                    res.status(401).send({ msg: 'fail' });
>>>>>>> user_09
                }
            });
        } else {
            console.log('아이디 없음');
<<<<<<< HEAD
            res.send({ msg: 'fail' });
=======
            res.status(401).send({ msg: 'fail' });
>>>>>>> user_09
        }
    });
});

// 로그인 여부확인
<<<<<<< HEAD
router.get('/islogin', authMiddleware, async (req, res) => {
=======
router.get('/isLogin', authMiddleware, async (req, res) => {
>>>>>>> user_09
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

<<<<<<< HEAD
=======
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

>>>>>>> user_09
module.exports = router;
