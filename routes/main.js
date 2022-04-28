const express= require('express');
const router = express.Router();
const db = require('../config');
   
// const authMiddleware = require("../middlewares/auth");


router.get('/postList', (req, res) => {
    const address = req.body.address;
    const sql = 'select * from Post where address=?'


    db.query(sql, address, (err, data) => {
        if (err) console.log(err);
        console.log(data)
        res.status(201).send({msg:'sucess', });
        
    });
});




module.exports=router; 