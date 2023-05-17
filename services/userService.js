const User = require("../schema/User")

const findUserById = async (_id) => {
    return await User.findOne({_id});
}

const findUsers = async(filter = {}) => {
    return await User.find(filter);
}

module.exports = {
    findUserById,
    findUsers,
}