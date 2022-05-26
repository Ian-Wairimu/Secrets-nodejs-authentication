const express = require('express');
const dotenv = require('dotenv');
const bodyparser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')

dotenv.config()
const app = express()

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

// const encKey = process.env.ENC_32BYTE_BASE64_STRING;
// const signKey = process.env.SIG_64BYTE_BASE64_STRING;
const secret = 'This is my secret'

// userSchema.plugin(encrypt, {encryptionKey: encKey, signingKey: signKey})
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']})
const User = new mongoose.model('User', userSchema);

app.set('view engine', 'ejs')

app.use(bodyparser.urlencoded({
    extended: true
}))
app.use(morgan('dev'))
app.use(express.static('public'))

app.get('/', (_req, res) => {
    res.render('home')
});
app.route('/register')
    .get((_req, res) => {
        res.render('register')
    })
    .post((req, res) => {
        const user = new User(
            {
                email: req.body.username,
                password: req.body.pass
            }
        )
        user.save((err) =>{
            if (!err){
                console.log('successfully saved')
                res.render('secrets')
            }
            else {
                console.log(err)
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
        User.findOne({email: userEmail}, (err, suc) => {
            if (err) {
                console.log(err)
            }else {
                if (suc.password === userPassword) {
                    res.render('secrets')
                }
            }
        })
    });

app.listen(process.env.PORT, () => {
    console.log(`server running: http://localhost:${process.env.PORT}`)
})

