const express = require('express'); //getting express
const router = express.Router();    //Router service
const mongoose = require('mongoose');
const authcheck = require('../middleware/authcheck');

const Order = require('../models/order');
const User = require('../models/user');

const cors = require('cors');

const method = {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "optionsSuccessStatus": 200
  };
//buyer order get
router.get('/',cors(method), (req, res, next) => {
    Order.find()
    .select('name price _id user description category')   //this to allow only these three things to be responded
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
            description:doc.description,
            category: doc.category,
            user: doc.user,

            //this below to provide access to detailed product links and stuffs
            request: {
              type: "GET",
              url: "https://agile-dawn-35104.herokuapp.com/orders/" + doc._id
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
router.post('/',cors(method),authcheck, (req, res, next) => {
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
        description:req.body.description,
        category:req.body.category,
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
            description: result.description,
            category:result.category,
            user:result.user,
            request: {
                type: 'GET',
                url: "https://agile-dawn-35104.herokuapp.com/orders/" + result._id
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
router.get('/:orderId',cors(method),authcheck, (req, res, next) => {
    const id = req.params.orderId;
    Order.findById(id)
    .select('name price _id user description category')
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
                url: 'https://agile-dawn-35104.herokuapp.com/orders'
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
router.patch('/:orderId',cors(method),authcheck, (req, res, next) => {
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
              url: 'https://agile-dawn-35104.herokuapp.com/orders/' + id
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
router.delete('/:orderId',cors(method), authcheck,(req, res, next) => {
    const id = req.params.orderId;
    Order.remove({ _id: id })
      .exec()
      .then(result => {
        res.status(200).json({
          message: 'Order deleted',
          request: {
              type: 'POST',
              url: 'https://agile-dawn-35104.herokuapp.com/orders',
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