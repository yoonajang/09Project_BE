const express = require('express');
const router = express.Router();
const db = require('../config');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
let appDir = path.dirname(require.main.filename);
const upload = require('../S3/s3');
const { PollyCustomizations } = require('aws-sdk/lib/services/polly');
const passport = require('passport');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// 회원가입
router.post('/signup', (req, res, next) => {
    //     const userImages = [file:///C:/Users/moon/OneDrive/Desktop/image1.jpg,
    // ]
    
        const userImage = 'https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27';
    
    
        const { userEmail, userName, userPassword } = req.body;
        const param = [userEmail, userName, userPassword, userImage, 50];
    
        db.query(
            'SELECT * FROM AuthNum WHERE userEmail=?',
            userEmail,
            (err, data) => {
                if (data.length) {
                    bcrypt.hash(param[2], saltRounds, (err, hash) => {
                        param[2] = hash;
                        db.query(
                            'INSERT INTO `User`(`userEmail`, `userName`, `password`, `userImage`, `point`) VALUES (?,?,?,?,?)',
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

//회원가입시 이메일 인증코드 보내기
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
    // db.query(
    //     'SELECT * FROM AuthNum WHERE userEmail=?',
    //     userEmail,
    //     (err, data) => {
    //         // if(err) console.log(err)
    //         console.log(data.length === 0);
    //         if (data.length === 0) {
    //             db.query('INSERT AuthNum(`authNum`, `userEmail`) VALUES (?,?)',
    //                 [authNum, userEmail],
    //                 (err, data) => {
    //                     res.send({ msg: 'success' });

    //                 'INSERT INTO `User`(`userEmail`, `userName`, `password`, `userImage`, `point`) VALUES (?,?,?,?,?)', param,
    //                 (err, row) => {
    //                     if (err) {
    //                         console.log(err);
    //                         res.send({ meg: 'fail' });
    //                     } else {
    //                         res.send({ meg: 'success' });
    //                     }
    //                 }
    //             });
    //         } else {
    //             db.query(
    //                 'UPDATE AuthNum SET authNum=? WHERE userEmail=?',
    //                 [authNum, userEmail],
    //                 (err, data) => {
    //                     res.send({ msg: 'success' });
    //                 },

                // } else {
                    //authNum 저장
                    db.query(
                        'SELECT *, TIMESTAMPDIFF(minute, updatedAt, now()) timeDiff FROM AuthNum WHERE userEmail=?',
                        email,
                        (err, user) => { 
                            const authNum = user[0].authNum
        
                            if (data.length === 0 ) {
                                db.query(
                                    'INSERT AuthNum(`authNum`, `userEmail`,`count`) VALUES (?,?,?)',
                                    [authNum, email, 1],
                                    (err, data) => {
                                        res.send({ msg: 'success' });
                                    },
                                );
                            } else if ( data[0].timeDiff > 5) {
                                db.query(
                                    'UPDATE AuthNum SET authNum=?, `updatedAt`=now(), `count`=1 WHERE userEmail=?',
                                    [authNum, email],
                                    (err, data) => {
                                        res.send({ msg: 'success' });
                                    },
                                );
        
                            } else if (data[0].count < 3 && data[0].timeDiff <= 5) {
                                db.query(
                                    'UPDATE AuthNum SET authNum=?, `count`=count+1 WHERE userEmail=?',
                                    [authNum, email],
                                    (err, data) => {
                                        res.send({ msg: 'success' });
                                    },
                                );
                            } else if (data[0].count === 3 && data[0].timeDiff <= 5) {
                                res.send({ msg: 'fail' });
                            }
                            
                        })

    //             );
    //         }
    //     },
    // );
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



// 이메일 중복확인
router.post('/emailcheck', (req, res) => {
    const email = req.body.userEmail;
    const sql = 'select * from User where userEmail=?';

    console.log(email)

    db.query(sql, [email], (err, data) => {
        console.log(data, data.length===0, '중복확인')
        if (data.length === 0) {
            console.log(err);
            res.send({ msg: 'success' });
        } else {
            res.send({ msg: 'fail' });
        }
    });
});
   

// 닉네임 중복확인
router.post('/namecheck', (req, res) => {
    const name = req.body.userName;
    const sql = 'select * from User where userName=?';

    db.query(sql, [name], (err, data) => {
        if (data.length === 0) {
            console.log(err);
            res.send({ msg: 'success' });
        } else {
            res.send({ msg: 'fail' });
        }
    });
});

// 로그인
router.post('/login', (req, res) => {
    const param = [req.body.userEmail, req.body.userPassword];
    const sql = 'SELECT * FROM User WHERE userEmail=?';

    console.log(param);

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
                    res.send({ msg: 'success', token, userInfo });
                } else {
                    console.log('비밀번호 틀림');
                    res.send({ msg: 'fail' });
                }
            });
        } else {
            console.log('아이디 없음');
            res.send({ msg: 'fail' });
        }
    });
});


// 로그인 여부확인
router.get('/islogin', authMiddleware, async (req, res) => {
    const { user } = res.locals;
    console.log(user.userId);

    const sql = 'SELECT status FROM Alarm WHERE User_userId = ? and isChecked = 0';
    
    db.query(sql, user.userId, (err, rows) => {
        if (err) console.log(err);
        console.log(rows)

        const status = rows[0]
        res.send({
            userInfo: {
                userId: user.userId,
                userEmail: user.userEmail,
                userName: user.userName,
                userImage: user.userImage,
                tradeCount: user.tradeCount,
            },
            alarm: { status }            
        });
    });
});

    //알람확인
router.put('/ischecked', authMiddleware, (req, res) => {
    const userId = res.locals.user.userId;
    const sql =
        'SELECT * FROM Alarm WHERE User_userId = ? and isChecked = 0';

    db.query(sql, userId, (err, rows) => {
        if (rows.length !== 0) {
            const sql =
                'UPDATE Alarm SET isChecked = 1 WHERE User_userId=?';

            db.query(sql, userId, (err, data) => {
                if (err) console.log(err);
                res.send({ msg: 'ischecked 1로 변경' });
            });
        } else {
            res.send({ msg: '알람이 없습니다' });
        }
    });
});
//카카오로그인

router.get('/kakao', passport.authenticate('kakao'));

router.get(
    '/kakao/callback',
    passport.authenticate('kakao', {
        failureRedirect: '/',
    }),
    (req, res) => {
        res.redirect('/');
    },
);


module.exports = router;
