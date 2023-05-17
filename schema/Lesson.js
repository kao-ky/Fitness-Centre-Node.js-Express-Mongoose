const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema({
    lesson_name: String,
    instructor: String,
    duration_min: Number,
    price: Number,
    image: String,
})

module.exports = mongoose.model('Lessons', lessonSchema)