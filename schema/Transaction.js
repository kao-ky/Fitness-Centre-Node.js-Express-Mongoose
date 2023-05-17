const mongoose = require('mongoose')
const lessonSchema = require('./Lesson')

const transactionSchema = new mongoose.Schema({
    email: String,
    name: String,
    trx_num: Number,
    date: {
        type: Date,
        default: Date.now
    },
    lessons: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lessonSchema'
    }],
    tax: Number,
    subtotal: Number,
    total: Number
})

module.exports = mongoose.model('Transactions', transactionSchema)