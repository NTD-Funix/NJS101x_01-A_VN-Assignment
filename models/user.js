const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    isManager: { type: Boolean, required: true },
    lastUrl: { type: String, required: true },
});

module.exports = mongoose.model('User', userSchema);