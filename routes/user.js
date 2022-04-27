const express= require('express')
const router = express.Router()


const db= require('../config')

const bcrypt = require('bcrypt')
const saltRounds =10 



router.post('/signup',(req,res,next)=>{
    const param= [ req.body.userEmail, req.body.userName ,req.body.password, req.body.userImage ]
    
    bcrypt.hash(param[1],saltRounds,(error,hash)=>{
    param[2]=hash;
    db.query('INSERT INTO `User`(`userEmail`, `userName`, `password`, `userImage`) VALUES (?,?,?,?)',
    param,(err,row) => {
   if(err) {
       console.log(err)}
       res.status(201).send({row})
});


})
})

module.exports=router; 