const mongoose = require('mongoose');

//this is a design of the table actually called schema 
const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {type:String,required:true},
    mobileNo: {type:Number, required:false},
    emailID: {type:String, required:true},
    password: { type: String, required:true},
    address: {type:String, required:false }
});

module.exports = mongoose.model('User', userSchema);