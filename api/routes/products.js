const express = require('express'); //getting express
const router = express.Router();    //Router service
const mongoose = require('mongoose');
const multer = require('multer');

const authcheck = require('../middleware/authcheck');
const cors = require('cors');

const method = {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "optionsSuccessStatus": 200
  };

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    var d= new Date();
    cb(null,d.toISOString().replace(/:/g, '-') +'-' + file.originalname);
  }
});

//here this filter will store those 3 types of file and if any other it wont give error just not store
const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 30
  },
  fileFilter: fileFilter
});
//const upload = multer({storage:storage})
//this is product module to be used to access the schema
const Product = require('../models/product');
const User = require('../models/user');

// just / because /products added in app.js
//req is request, res is response object
router.get('/',cors(method),(req,res,next)=>{
   /* res.status(200).json({
        message: 'Handling GET requests to prod'
    });*/
    Product.find()
    .select("name price user _id productImage description category")   //this to allow only these three things to be responded
    .populate('user',"name emailID mobileNo address")
    .exec()
    .then(docs => {
      console.log(docs);
      const response = {
        count: docs.length,
        products: docs.map(doc => {
          return {
            name: doc.name,
            price: doc.price,
            _id: doc._id,
            description: doc.description,
            productImage:doc.productImage,
            category: doc.category,
            user: doc.user,

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

//post requests
//201 for service was successfully created
router.post('/',cors(method),upload.single('productImage'),(req,res,next)=>{
    //to parse it below variable, .body is to access the body of request
    console.log(req.file);
    User.findById(req.body.userID)
    .then(user => {
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }
      const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        user: req.body.userID,     
        category : req.body.category,   
        productImage:req.file.path, 
    });
      return product.save();
    })
    
    .then(result => {
      console.log(result);
      res.status(201).json({
        message: "Product stored",
        createdProduct: {
          name: result.name,
            price: result.price,
            _id: result._id,
            description: result.description,
            productImage: result.productImage,
            category : result.category,
            user:result.user,
            request: {
                type: 'GET',
                url: "https://agile-dawn-35104.herokuapp.com/products/" + result._id
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

//specific product
//:productId is dynammic variable
router.get('/:productId',cors(method),authcheck, (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id)
    .select('name price _id user description category')
    .populate('user',"name emailID mobileNo address")
    .exec()
    .then(doc => {
      console.log("From database", doc);

      //now this for handling error 
      if (doc) {
        res.status(200).json({
            product: doc, 
            request: {
                type: 'GET',
                url: 'https://agile-dawn-35104.herokuapp.com/products'
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

//patch is different from put as in case of minor changes or just change in one field
router.patch('/:productId',cors(method),authcheck, (req, res, next) => {
    /*res.status(200).json({
        message: 'Updated product!'
    });*/

    const id = req.params.productId;
    const updateOps = {};
    //this loop to check whic one to patch
    for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
    }
    Product.update({ _id: id }, { $set: updateOps })
      .exec()
      .then(result => {
        console.log(result);
        res.status(200).json({
          message: 'Product updated',
          request: {
              type: 'GET',
              url: 'https://agile-dawn-35104.herokuapp.com/products/' + id
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

//return res.status(200).json. We need to add return only if we have to do something after returning the first response


//deleting a product
router.delete('/:productId',cors(method),authcheck, (req, res, next) => {
    /*res.status(200).json({
        message: 'Deleted product!'
    });*/

    //this .remove is the method to remove a field
    const id = req.params.productId;
    Product.remove({ _id: id })
      .exec()
      .then(result => {
        res.status(200).json({
          message: 'Product deleted',
          request: {
              type: 'POST',
              url: 'https://agile-dawn-35104.herokuapp.com/products',
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