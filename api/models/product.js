const mongoose = require('mongoose');

//this is a design of the table actually called schema 
const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    user : { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
    name: {type:String,required:true},
    price: {type:Number, required:true},
    productImage:{ type:String, 
        //required:true             //see this later
    }
});

module.exports = mongoose.model('Product', productSchema);