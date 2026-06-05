const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type:String,
        unique:[true, 'Username already exists'],
        required:true
    },
    email: {
        type:String,
        unique:[true, 'Account with this email already exists'],
        required:true
    },
    password :{
        type:String,
        required:true,
        minLength:[6, 'Password must be at least 6 characters long']
    },

})

const userModel = mongoose.model('users', userSchema);

module.exports = userModel;