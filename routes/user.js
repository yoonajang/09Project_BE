// const express = require("express");
// const CryptoJS = require("crypto-js"); //비번 암호화
// const jwt = require("jsonwebtoken");    
// const router = express.Router();
// const User = require("../schemas/user");
// const authMiddleware = require("../middlewares/auth-middleware");

const express= require('express')
const router = express.Router()


const db= require('../config')

const bcrypt = require('bcrypt')
const saltRounds =10 


//회원가입
router.post('/signUp',(req,res,next)=>{
    const param= [ req.body.userEmail, req.body.userName ,req.body.password ]
    const userImage = "https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27";
    bcrypt.hash(param[1],saltRounds,(error,hash)=>{
        param[2]=hash;
        db.query('INSERT INTO `User`(`userEmail`, `userName`, `password`, `userImage`) VALUES (?,?,?,"https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27")',
        param,(err,row) => {
            if(err) {
                console.log(err)}
                res.status(201).send({row})
        });
    });
});

//이메일 중복확인
router.post('/emailCheck', (req, res) => {
    const email = req.body.userEmail;
    const sql = 'select * from User where userEmail=?'

    db.query(sql, [email], (err, data) => {
        if (data.length === 0) {
            console.log(err)
            res.send('사용할 수 있는 이메일입니다');
        } else {
            res.send('중복된 이메일입니다');
        };
    });
});

//닉네임 중복확인
router.post('/nameCheck', (req, res) => {
    const name = req.body.userName;
    const sql = 'select * from User where userName=?'

    db.query(sql, [name], (err, data) => {
        if (data.length === 0) {
            console.log(err)
            res.send('사용할 수 있는 닉네임입니다');
        } else {
            res.send('중복된 닉네임입니다');
        };
    });
});




module.exports=router; 