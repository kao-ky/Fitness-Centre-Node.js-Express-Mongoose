const express = require('express')
const session = require('express-session')
const { getTransactionSummary, createMembershipFee } = require('./services/transactionService.js')
const { findUserById } = require('./services/userService.js')
const { createOrUpdateCart, getCartInfoByUserId } = require('./services/cartService.js')
const User = require('./schema/User')
const Lesson = require('./schema/Lesson')
const Cart = require('./schema/Cart')
const Transaction = require('./schema/Transaction')

const app = express()

const HTTP_PORT = process.env.PORT || 8080

const exphbs = require('express-handlebars')
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    extname: 'hbs',
    helpers: {
        json: (context) => JSON.stringify(context),
        currency: (context) => (context || 0).toFixed(2),
    }
}))
app.set('view engine', 'hbs')

app.use(express.static('public'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// db config
const mongoose = require('mongoose')
mongoose.set('strictQuery', true)
const MONGO_URL = 'mongodb+srv://root:admin@cluster0.vpv9gq5.mongodb.net/GoFitness'
mongoose.connect(MONGO_URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    () => { console.log('Database has been connected.'), e => console.error(e) }
)

// session config
app.use(session({
    secret: 'Project - Go Fitness',
    resave: false,
    saveUninitialized: true
}))

// Home
app.get('/', (req, res) => {
    res.render('home', { pageDesc: 'Home', isLoggedIn: req.session.isLoggedIn })
})

// Admin
app.get('/admin', async (req, res) => {
    if (req.session.userRole === 'admin') {
        const isDescending = req.query.order === 'desc';
        const summary = await getTransactionSummary(isDescending);

        res.render('admin', {
            pageDesc: 'Admin',
            order: isDescending ? 'asc' : 'desc',
            data: summary,
            isLoggedIn: req.session.isLoggedIn
        })
        return
    }
    res.render('alert', {
        pageDesc: 'Authorisation Error',
        alertHeader: 'Error: Unauthorized Action',
        alertMsg: 'You do not have rights to view this page.',
        url: '/',
        httpMethod: 'GET',
        isLoggedIn: req.session.isLoggedIn
    })
})


// Lesson
app.get('/lessons', async (req, res) => {
    const lessons = await Lesson.find().sort({ "lesson_name": 'asc' });
    res.render('lessons', {
        pageDesc: 'Lessons',
        lessons: lessons.map((lesson) => lesson.toJSON()),
        isLoggedIn: req.session.isLoggedIn,
    });
})


// Cart
app.get('/cart', async (req, res) => {

    const cartInfo = await getCartInfoByUserId( req.session.userId )

    if (!cartInfo) {
        res.render('alert', {
            pageDesc: 'Cart Error',
            alertHeader: 'Error: Empty Cart',
            alertMsg: 'There are no lessons in your cart.',
            url: '/lessons',
            httpMethod: 'GET',
            isLoggedIn: req.session.isLoggedIn
        })
        return
    }

    res.render('cart', {
        pageDesc: 'Cart',
        email: cartInfo?.user?.email,
        isLoggedIn: req.session.isLoggedIn,
        subscription: cartInfo.user?.subscription,
        lessonList: cartInfo?.cartList,
        subtotal: cartInfo?.subtotal,
        tax: cartInfo?.tax,
        total: cartInfo?.total
    })
})

app.post('/cart', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.userId })
        // in case users clear session data then perform deletion
        if (!user) {
            res.render('alert', {
                pageDesc: 'Login Error',
                alertHeader: 'Error: Invalid Cart Operation',
                alertMsg: 'Please login before modifying cart items.',
                url: '/login',
                httpMethod: 'GET'
            })
            return
        }

        const cartList = await Cart.findOne({ email: user.email })
        itemIndex = req.body.btn
        cartList.lessons.splice(itemIndex, 1)
        await cartList.save()
        console.log(`User id [${user._id}] has removed an item from cart.`)
    } catch (e) {
        console.error(e)
    }

    res.redirect('/cart')
})

app.post('/cart/:lessonId', async (req, res) => {
    const user = await findUserById(req.session.userId);
    const lessonId = req.params.lessonId;
    if (!user) {
        res.render('alert', {
            pageDesc: 'Add to Cart Error',
            alertHeader: 'Error: Unauthorized Action',
            alertMsg: 'Please login first.',
            url: '/login',
            httpMethod: 'GET',
            isLoggedIn: req.session.isLoggedIn,
        })
        return
    }
    const result = await createOrUpdateCart(user.email, lessonId);
    if (result !== true) {
        res.render('alert', {
            pageDesc: 'Add to Cart Error',
            alertHeader: 'Error: Invalid Data',
            alertMsg: result,
            url: '/login',
            httpMethod: 'GET',
            isLoggedIn: req.session.isLoggedIn,
        })
        return
    }

    res.render('alert', {
        pageDesc: 'Cart',
        alertHeader: 'Success',
        alertMsg: 'Item added to cart.',
        url: '/lessons',
        httpMethod: 'GET',
        isLoggedIn: req.session.isLoggedIn,
    })
    return
})


app.post('/checkout', async (req, res) => {
    if (!req.session.isLoggedIn) {
        res.render('alert', {
            pageDesc: 'Purchase Error',
            alertHeader: 'Error: Login Required',
            alertMsg: 'Please login before placing an order.',
            url: '/login',
            httpMethod: 'GET'
        })
        return
    }

    const name = req.body.name
    if (!name) {
        res.render('alert', {
            pageDesc: 'Purchase Error',
            alertHeader: 'Error: Missing Field',
            alertMsg: 'Please fill in your name in customer details.',
            url: '/cart',
            httpMethod: 'GET',
            isLoggedIn: req.session.isLoggedIn
        })
        return
    }

    const trxInfo = await getCartInfoByUserId( req.session.userId )

    let trxNum
    let isTrxNumDuplicated = true
    while (isTrxNumDuplicated) {
        trxNum = Math.floor(Math.random() * 1000000000)
        const trx = await Transaction.findOne( {trx_num: trxNum })
        if (!trx) {
            isTrxNumDuplicated = false
        }
    }

    if (trxInfo) {
        const trx = new Transaction({
            email: trxInfo?.user.email,
            name: req.body.name,
            trx_num: trxNum,
            lessons: trxInfo?.cartList,
            tax: trxInfo?.tax,
            subtotal: trxInfo?.subtotal,
            total: trxInfo?.total
        })
        await trx.save()
        console.log(`User id [req.session.userId] made a purchase.`)

        // clear cart
        const cart = await Cart.findOne( {email: trxInfo?.user.email})
        cart.lessons = []
        await cart.save()
        console.log(`User id [req.session.userId] has their cart cleared.`)
    }

    res.render('alert', {
        pageDesc: 'Purchase Success',
        alertHeader: 'Purchase Success',
        alertMsg: `Your confirmation number is ${trxNum}.`,
        url: '/',
        httpMethod: 'GET',
        isLoggedIn: req.session.isLoggedIn
    })
})

// Login
app.get('/login', (req, res) => {
    res.render('login', { pageDesc: 'Login' })
})

app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email, password: req.body.password })

    if (!user) {
        res.render('alert', {
            pageDesc: 'Login Error',
            alertHeader: 'Error: Incorrect Credentials',
            alertMsg: 'Please enter your credentials again.',
            url: '/login',
            httpMethod: 'GET'
        })
        return
    }

    req.session.isLoggedIn = true
    req.session.userId = user._id
    req.session.userRole = user.role;
    res.redirect('/')
})

app.get('/logout', (req, res) => {
    const userId = req.session.userId
    req.session.destroy()
    console.log(`User id [${userId}] has logged out.`)
    res.redirect('/')
})

app.post('/register', async (req, res) => {
    // additional checking for case that misses the the part between '.'
    // case '1@a' passes the 'required' keyword validation
    if (!req.body.email || !req.body.email.includes('.')) {
        res.render('alert', {
            pageDesc: 'Login Error',
            alertHeader: 'Error: Invalid Email',
            alertMsg: 'Please enter your email again.',
            url: '/login',
            httpMethod: 'GET'
        })
        return
    }

    // Register user if not existing & save state using session
    try {
        const userDoc = await User.findOne({ email: req.body.email })
        if (userDoc) {
            res.render('alert', {
                pageDesc: 'Registration Error',
                alertHeader: 'Error: Account exists',
                alertMsg: 'This email is registered.',
                url: '/login',
                httpMethod: 'GET'
            })
            return
        }
        const user = new User({
            email: req.body.email,
            password: req.body.password,
            role: 'customers'
        })
        await user.save()
        console.log(`User id [${user._id}] has been created.`)
        req.session.isLoggedIn = true
        req.session.userId = user._id
        req.session.userRole = user.role
    } catch (e) {
        console.error(e)
    }

    res.render('membership', { pageDesc: 'Register', isLoggedIn: req.session.isLoggedIn })
})

app.post('/register-membership', async (req, res) => {
    if (req.body.subscribe === "true") {
        const user = await User.findOne({ _id: req.session.userId })
        if (user) {
            user.subscription = true
            await user.save()
            .then(await createMembershipFee(user))
            console.log(`User id [${user._id}] has subscribed membership.`)
        }
    }
    res.redirect('/')
})


// Invalid Url
app.use((req, res) => {
    res.render('alert', {
        pageDesc: 'Page Error',
        alertHeader: 'Error: Page Not Found',
        alertMsg: 'Please check the URL again.',
        url: '/',
        httpMethod: 'GET',
        isLoggedIn: req.session.isLoggedIn
    })
})

const onHttpStart = () => {
    console.log(`> Server has started on Port ${HTTP_PORT}. Press Ctrl+C to terminate.`)
}

app.listen(HTTP_PORT, onHttpStart)