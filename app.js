const express = require('express');
const dotenv = require('dotenv');
const bodyparser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy
// const bcrypt = require('bcrypt')
// //the good amount of salt rounds to use is 10
// //use 4 in order for my computer to not take time
// const saltRounds = 4

dotenv.config()
const app = express()

app.use(session(
    {
        secret: "This is my name or wtf",
        resave: false,
        saveUninitialized: false,
    }
));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log(`successfully connected: ${process.env.MONGO_URL}`)
});
mongoose.connection.on('error', err => {
    console.log(`error connecting: ${err}`)
})

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.set('view engine', 'ejs')

app.use(bodyparser.urlencoded({
    extended: true
}))
app.use(morgan('dev'))
app.use(express.static('public'))


app.get('/', (_req, res) => {
    res.render('home')
});
app.get('/secrets', (res, req) => {
    if (req.isAuthenticated()){
        res.render('secrets')
    }else {
        res.redirect('/login');
    }
})
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})
app.route('/register')
    .get((_req, res) => {
        res.render('register')
    })
    .post((req, res) => {
        // bcrypt.hash(req.body.pass, saltRounds, (_err, hashP) => {
        // const user = new User(
        //     {
        //         email: req.body.username,
        //         password: hashP
        //     }
        // )
        // user.save((err) =>{
        //     if (!err){
        //         console.log('successfully saved')
        //         res.render('secrets')
        //     }
        //     else {
        //         console.log(err)
        //     }
        // })
        // })
        User.register({email: req.body.username}, req.body.pass, (err,  _user) => {
            if(err) {
                console.log(err)
                res.redirect('/register')
            }else {
                passport.authenticate('local') (req, res, () => {
                    res.redirect('/secrets')
                })
            }
        })
    });
app.route('/login')
    .get((_req, res) => {
        res.render('login')
    })
    .post((req, res) => {
        const userEmail = req.body.username;
        const userPassword = req.body.pass;
        // console.log(userEmail, userPassword)
        // User.findOne({email: userEmail}, (err, suc) => {
        //     if (err) {
        //         console.log(err)
        //     }else {
        //         bcrypt.compare(userPassword, suc.password, (_err, result) => {
        //             if (result === true) {
        //                 res.render('secrets')
        //             }
        //         })
        //     }
        // })
        const user = new User({
            email: userEmail,
            password: userPassword
        })
        req.login(user, (err) => {
            if(err) {
                console.log(err)
            }else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/secrets')
                })
            }
        })
    });

app.listen(process.env.PORT, () => {
    console.log(`server running: http://localhost:${process.env.PORT}`)
})

