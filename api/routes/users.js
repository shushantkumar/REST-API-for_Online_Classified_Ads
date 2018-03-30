const express = require('express'); //getting express
const router = express.Router();    //Router service
const mongoose = require('mongoose');
const bcrypt = require ('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const authcheck = require('../middleware/authcheck');
const cors = require('cors');

const method = {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "optionsSuccessStatus": 200
  };
router.get('/',cors(method),(req,res,next)=>{

    User.find()
    .select("name mobileNo emailID _id address")   //this to allow only these three things to be responded
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
            address: doc.address,
            _id: doc._id,

            //this below to provide access to detailed product links and stuffs
            request: {
              type: "GET",
              url: "https://agile-dawn-35104.herokuapp.com/products/" + doc._id
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

router.post('/signup',cors(method),(req,res,next)=>{
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
            address:req.body.address,
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


    router.get('/:userId',cors(method), (req, res, next) => {
      const id = req.params.userId;
      User.findById(id)
      .select('name emailID mobileNo _id user address')
      .exec()
      .then(doc => {
        console.log("From database", doc);
  
        //now this for handling error 
        if (doc) {
          
          Product.find({ user : id},(err,prod)=>{


            Order.find({ user : id},(err,ord)=>{
             
              res.status(200).json({
                user: doc,
                message:' Posted Products',
                product_List: prod,
              
                order_List: ord,
                request: {
                    type: 'GET',
                    url: 'https://agile-dawn-35104.herokuapp.com/products'
                }
                });
            
             
            }) 
          .select('name price _id description category')
          .catch(err => {
            console.log(err);
            res.status(500).json({ error: err });
          });

            }) 
          .select('name price _id description productImage category')
          .catch(err => {
            console.log(err);
            res.status(500).json({ error: err });
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

  router.post("/login",cors(method), (req, res, next) => {
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
                    userID:user[0]._id,
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

  
    
  router.delete("/:userId",cors(method), (req, res, next) => {
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
  
    router.patch('/:userId',cors(method),authcheck, (req, res, next) => {
           const id = req.params.userId;
      const updateOps = {};
      //this loop to check whic one to patch
      for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
      }
      User.update({ _id: id }, { $set: updateOps })
        .exec()
        .then(result => {
          console.log(result);
          res.status(200).json({
            message: 'user updated',
            request: {
                type: 'GET',
                url: 'https://agile-dawn-35104.herokuapp.com/users/' + id
            }
            });
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            error: err
          });
        });
  });





  
router.post('/glogin',cors(method),(req,res,next)=>{
  User.find({emailID: req.body.emailID})
  .exec()
  .then(user=> {
    if(user.length >=1){

      const token = jwt.sign(
                  {
                    emailID: user[0].emailID,
                    userId: user[0]._id
                  },
                  'secret',
                  { expiresIn: '2h' }            
                );
                
                    res.status(200).json({
                      message: 'Login Successful',
                      userID:user[0]._id,
                     token: token
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
          const guser = new User({
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            emailID: req.body.emailID,
            password: hash
    
          });
          guser
            .save()
            .then(user => {
              console.log(user);
              // res.status(201).json({
              //   message: "User saved",
              //   createdProduct: user
              // });
                                            
                  const token = jwt.sign(
                  {
                    emailID: user.emailID,
                    userId: user._id
                  },
                  'secret',
                  { expiresIn: '2h' }            
                );
                
                    res.status(200).json({
                      message: 'Login Successful',
                      userID:user._id,
                     token: token
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
module.exports = router;