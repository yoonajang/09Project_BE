const express= require('express');
const router = express.Router();
const db = require('../config');
const jwt = require("jsonwebtoken");    
const authMiddleware = require("../middlewares/auth");
// const nodemailer = require('nodemailer');
// const ejs = require('ejs');
// const path = require('path');
let appDir = path.dirname(require.main.filename);

const bcrypt = require('bcrypt')
const saltRounds = 10 

// 회원가입
router.post('/signUp',(req,res,next)=>{
    const userImage = "https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27";
    const param = [ req.body.userEmail, req.body.userName ,req.body.userPassword, userImage]

    bcrypt.hash(param[2],saltRounds,(err,hash)=>{
        param[2]=hash;
        db.query('INSERT INTO `User`(`userEmail`, `userName`, `password`, `userImage`) VALUES (?,?,?,"https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27")',
        param,(err,row) => {
            if(err) {
                console.log(err) 
                res.status(401).send({meg: "fail"})
            } else {
                res.status(201).send({meg: "success"})
            }
        });
        
    });
 
});

//회원가입시 이메일 인증
// router.post('/mail', async (req, res) => {
//     let authNum = Math.random().toString().substr(2, 6);
//     let emailTemplete;

//     ejs.renderFile(
//       appDir + '/template/authMail.ejs',
//       { authCode: authNum },
//       function (err, data) {
//         if (err) {
//           console.log(err);
//         }
//         emailTemplete = data;
//       },
//     );

//     let transporter = nodemailer.createTransport({
//       service: 'gmail',
//       host: 'smtp.gmail.com',
//       port: 587,
//       secure: false,
//       auth: {
//         user: process.env.nodemailerUser,
//         pass: process.env.nodemailerPw,
//       },
//     });

//     //메일 제목 설정
//     let mailOptions = await transporter.sendMail({
//       from: process.env.nodemailerUser,
//       to: req.body.userEmail,
//       subject: '[Nbbang] 회원가입을 위한 인증번호를 입력해주세요.',
//       html: emailTemplete,
//     });

//     res.status(200).send({ authNum : authNum });
// });


// 이메일 중복확인
router.post('/emailCheck', (req, res) => {
    const email = req.body.userEmail;
    const sql = 'select * from User where userEmail=?'
    

    db.query(sql, [email], (err, data) => {
        if (data.length === 0) {
            console.log(err)
            res.status(201).send({msg:'success'});
        } else {
            res.status(201).send({msg:'fail'});
        };
    });
});


// 닉네임 중복확인 
router.post('/nameCheck', (req, res) => {
    const name = req.body.userName;
    const sql = 'select * from User where userName=?'

    db.query(sql, [name], (err, data) => {
        if (data.length === 0) {
            console.log(err)
            res.status(201).send({msg:'success'});
        } else {
            res.status(201).send({msg:'fail'});
        };
    });
});


// 로그인
router.post('/login', (req, res) => {
    const param = [ req.body.userEmail, req.body.userPassword]
    const sql = 'SELECT * FROM User WHERE userEmail=?'

    console.log(param)

    db.query(sql, param[0], (err, data) => {
        if (err) console.log(err)

        if (data.length > 0) {
            bcrypt.compare(param[1], data[0].password, (err, result) => {      
                if(result){
                    const userInfo = {
                        userId: data[0].userId, 
                        userEmail: data[0].userEmail,
                        userName: data[0].userName,
                        userImage: data[0].userImage,
                        tradeCount: data[0].tradeCount,
                    }
                    const token = jwt.sign({ userId : data[0].userId},process.env.JWT_SECRET);
                    res.status(201).send({msg:'success', token, userInfo});

                } else {
                    console.log('비밀번호 틀림')
                    res.status(401).send({msg:'fail'});
                }
            })
        } else {
            console.log('아이디 없음')
            res.status(401).send({msg:'fail'});
        }

    })    
});


//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY1MTExMTcxNH0.tOJwDg7BeBp8CR8BaNSnBca7Iyc_JVELkmlm6Pi4pUk

// 로그인 여부확인
router.get("/isLogin", authMiddleware, async (req, res) => {
    const {user} = res.locals;
    console.log({user})
    res.send({
        userinfo: {
            userId: user.userId,
            userEmail: user.userEmail,
            userName: user.userName,
            userImage: user.userImage,
            tradeCount: user.tradeCount,
        }
    });
});


module.exports=router; 