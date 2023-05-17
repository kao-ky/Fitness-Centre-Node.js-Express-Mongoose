const mongoose = require('mongoose')
const lessonSchema = require('./Lesson')

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: String,
    subscription: Boolean
})

module.exports = mongoose.model('User', userSchema)