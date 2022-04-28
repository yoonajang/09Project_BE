const express= require('express');
const router = express.Router();
const db = require('../config');
   
// const authMiddleware = require("../middlewares/auth");


//테스트용
router.post('/postList', (req, res) => {
    const address = req.body.address;
    const sql = 'INSERT INTO Post(`address`) VALUES (?)'

    db.query(sql, address, (err,data) => {
        if(err) console.log(err) 
        res.status(201).send({meg: "success"})
    })

});



router.get('/postList', (req, res) => {
    const address = req.body.address;
    const sql = 'select * from Post where address=?'


    db.query(sql, address, (err, data) => {
        if (err) console.log(err);
        console.log(data)
        res.status(201).send({msg:'sucess',data});
        
    });
});




module.exports=router; 