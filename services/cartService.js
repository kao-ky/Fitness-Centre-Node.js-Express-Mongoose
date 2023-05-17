const { findLessonById } = require("./lessonService");
const Cart = require("../schema/Cart");
const User = require("../schema/User");
const Lesson = require("../schema/Lesson");

// Cart
const getCartInfoByUserId = async (userId) => {
    let lessonList = []
    let usr
    let subtotalAmt = 0
    let taxAmt = 0
    let totalAmt = 0

    try {
        usr = await User.findOne({ _id: userId })

        if (usr) {
            const cartList = await Cart.findOne({ email: usr.email })

            if (!cartList?.lessons.length) {
                return
            }

            for (const lesson of cartList.lessons) {
                const lessonObject = await Lesson.findOne({ _id: lesson }).lean()
                lessonList.push(lessonObject)
                subtotalAmt += lessonObject.price
            }

            // Get Fees
            if (usr.subscription) {
                subtotalAmt = 0
            } else {
                taxAmt = subtotalAmt * 0.13
                totalAmt = subtotalAmt + taxAmt
            }
        }
    } catch (e) {
        console.error(e)
    }

    return {
        user: usr,
        cartList: lessonList,
        subtotal: subtotalAmt.toFixed(2),
        tax: taxAmt.toFixed(2),
        total: totalAmt.toFixed(2)
    }
}

const findCartByEmail = async (email) => {
    const cart = await Cart.findOne({email});
    return cart;
}

//assume email is valid
const createOrUpdateCart = async (email, lessonId) => {
    console.log(email);
    const lesson = await findLessonById(lessonId);
    if (!lesson) return "Invalid user or lesson";
    const cart = await findCartByEmail(email);
    
    if (cart != null) {
        console.log('Update cart');
        cart.lessons.push(lesson);
        await cart.save();
    } else {
        console.log('Create cart');
        const newCart = new Cart({
            email, lessons: [lesson._id]
        });
        await newCart.save();
    }
    return true;
}

module.exports = {
    getCartInfoByUserId,
    createOrUpdateCart,
}