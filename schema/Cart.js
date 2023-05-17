const mongoose = require('mongoose')
const Lesson = require('./Lesson')

const cartSchema = mongoose.Schema({
    email: String,
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lessonSchema'
    }]
})

module.exports = mongoose.model('Carts', cartSchema)
