if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')

const userRoutes = require('./routes/users')
const campgroundRoutes = require('./routes/campgrounds')
const reviewRoutes = require('./routes/reviews')
const MongoDBStore = require("connect-mongo");
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelpCamp';

try {
    mongoose.connect(dbUrl);
    console.log('ye bisa mongonya')
} catch (error) {
    console.log('error mongonya bro')
  handleError(error);
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate)

app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize({
    replaceWith: '_'
}))

// app.use(session({
//   store: MongoStore.create({ mongoUrl: 'mongodb://localhost/test-app' })
// const store = new MongoDBStore({
//     url: dbUrl,
//     secret: 'thisshouldbeabettersecret!',
//     touchAfter: 24*60*60
// })
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const port = process.env.PORT

const sessionConfig = {
    store: MongoDBStore.create({mongoUrl: dbUrl}),
    name: 'session',
    secret,
    touchAfter: 24*60*60,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}


app.use(session(sessionConfig));
app.use(flash());
app.use(helmet())


const scriptSrcUrls = [
    "https://cdn.jsdelivr.net/",
    "https://icons.getbootstrap.com/",
    // "https://cdn.jsdelivr.net",
    // "https://stackpath.bootstrapcdn.com/",
    // "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    // "https://kit.fontawesome.com/",
    // "https://cdnjs.cloudflare.com/",
    // "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://cdn.jsdelivr.net/",
    "https://icons.getbootstrap.com/"
    // "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    // "https://api.tiles.mapbox.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    // "https://a.tiles.mapbox.com/",
    // "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dtgs2rvjt/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', userRoutes)
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)

app.get('/', (req, res) => {
    res.render('home');
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = 'Something went wrong!'
    res.status(statusCode).render('error', {err})
})

app.listen(port, () => {
    console.log('app is listening')
})
