const Lesson = require("../schema/Lesson");

const findLessonById = async (_id) => {
    const result = await Lesson.findOne({_id});
    return result;
}

const findLessons = async (filter = {}) => {
    const results = await Lesson.find(filter).lean();
    return results;
}

module.exports = {
    findLessonById,
    findLessons,
}