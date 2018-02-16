const express = require('express'); //getting express
const router = express.Router();    //Router service
const mongoose = require('mongoose');
const authcheck = require('../middleware/authcheck');

const Order = require('../models/order');
const User = require('../models/user');
//buyer order get
router.get('/',authcheck, (req, res, next) => {
    Order.find()
    .select("name price user _id")   //this to allow only these three things to be responded
    .populate('user',"name emailID mobileNo")
    .exec()
    .then(docs => {
      console.log(docs);
      const response = {
        count: docs.length,
        orders: docs.map(doc => {
          return {
            name: doc.name,
            price: doc.price,
            _id: doc._id,
            user: doc.user,

            //this below to provide access to detailed product links and stuffs
            request: {
              type: "GET",
              url: "http://localhost:3000/orders/" + doc._id
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

//buyer order post
router.post('/',authcheck, (req, res, next) => {
    User.findById(req.body.userID)
    .then(user => {
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }
      const order = new Order({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        user: req.body.userID
    });
      return order.save();
    })
    
    .then(result => {
      console.log(result);
      res.status(201).json({
        message: "Order stored",
        createdOrder: {
          name: result.name,
            price: result.price,
            _id: result._id,
            user:result.user,
            request: {
                type: 'GET',
                url: "http://localhost:3000/orders/" + result._id
            }
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

//buyer order get specific products
router.get('/:orderId',authcheck, (req, res, next) => {
    const id = req.params.orderId;
    Order.findById(id)
    .select('name price _id user')
    .populate('user',"name emailID mobileNo")
    .exec()
    .then(doc => {
      console.log("From database", doc);

      //now this for handling error 
      if (doc) {
        res.status(200).json({
            order: doc, 
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

//patch 
router.patch('/:orderId',authcheck, (req, res, next) => {
    /*res.status(200).json({
        message: 'Updated product!'
    });*/

    const id = req.params.orderId;
    const updateOps = {};
    //this loop to check whic one to patch
    for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
    }
    Order.update({ _id: id }, { $set: updateOps })
      .exec()
      .then(result => {
        console.log(result);
        res.status(200).json({
          message: 'Order updated',
          request: {
              type: 'GET',
              url: 'http://localhost:3000/orders/' + id
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

//buyer deleted the product
router.delete('/:orderId', authcheck,(req, res, next) => {
    const id = req.params.orderId;
    Order.remove({ _id: id })
      .exec()
      .then(result => {
        res.status(200).json({
          message: 'Order deleted',
          request: {
              type: 'POST',
              url: 'http://localhost:3000/orders',
              body: { name: 'String', price: 'Number' }
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


module.exports = router;