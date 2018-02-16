const express = require('express'); //getting express
const router = express.Router();    //Router service
const mongoose = require('mongoose');
const bcrypt = require ('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.get('/',(req,res,next)=>{

    User.find()
    .select("name mobileNo emailID _id")   //this to allow only these three things to be responded
    .exec()
    .then(docs => {
      console.log(docs);
      const response = {
        count: docs.length,
        users: docs.map(doc => {
          return {
            name: doc.name,
            mobileNo: doc.mobileNo,
            emailID: doc.emailID,
            _id: doc._id,

            //this below to provide access to detailed product links and stuffs
            request: {
              type: "GET",
              url: "http://localhost:3000/products/" + doc._id
            }
          };
        })
      };
      //   if (docs.length >= 0) {
      res.status(200).json(response);
      //   } else {
      //       res.status(404).json({
      //           message: 'No entries found'
      //       });
      //   }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });

});

router.post('/signup',(req,res,next)=>{
  User.find({emailID: req.body.emailID})
  .exec()
  .then(user=> {
    if(user.length >=1){
      return res.status(409).json({
        message: "Account already exists"
      });
    }
    else {
      bcrypt.hash(req.body.password, 10, (err,hash)=>{
        if(err){
          console.log(err);
          res.status(500).json({
            error: err
          });
        }
        else {
          const user = new User({
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            emailID: req.body.emailID,
            mobileNo:req.body.mobileNo,
            password: hash
    
          });
          user
            .save()
            .then(result => {
              console.log(result);
              res.status(201).json({
                message: "User saved",
                createdProduct: result
              });
            })
            .catch(err => {
              console.log(err);
              res.status(500).json({
                error: err
              });
            });
        }
      });
    }
  });
    
    });


    router.get('/:userId', (req, res, next) => {
      const id = req.params.userId;
      User.findById(id)
      .select('name emailID mobileNo _id user')
      .exec()
      .then(doc => {
        console.log("From database", doc);
  
        //now this for handling error 
        if (doc) {
          res.status(200).json({
              user: doc, 
              request: {
                  type: 'GET',
                  url: 'http://localhost:3000/products'
              }
          });
        } else {
          res
            .status(404)
            .json({ message: "No valid entry found for provided ID" });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({ error: err });
      }); 
  });

  router.post("/login", (req, res, next) => {
      User.find({ emailID: req.body.emailID })
        .exec()
        .then(user=>{
            if(user.length<1)
            {
                return res.status(401).json({
                    message: 'Login failed'
                });
            }
            bcrypt.compare(req.body.password,user[0].password,(err,result)=>{
                if(err){
                    return res.status(401).json({
                    message: 'Login failed'
                });
              }
              if(result)
              {   
                  const token = jwt.sign(
                {
                  emailID: user[0].emailID,
                  userId: user[0]._id
                },
                'secret',
                { expiresIn: '2h' }            
              );
                  return res.status(200).json({
                    message: 'Login Successful',
                    token: token
                });
              }
               res.status(401).json({
                    message: 'Login failed'
                });
    
            });
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            //message:8,
            error: err
          });
        });
    
    
    });

  
    
  router.delete("/:userId", (req, res, next) => {
      User.remove({ _id: req.params.userId })
        .exec()
        .then(result => {
          res.status(200).json({
            message: "User deleted"
          });
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            //message:9,
            error: err
          });
        });
    });
  


module.exports = router;