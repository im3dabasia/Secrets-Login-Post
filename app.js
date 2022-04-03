//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

// Adding Signin with google option
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


// intializing our app variable with express constructor
const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));


app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// connecting to mongoose 
mongoose.connect('mongodb://localhost:27017/userDB');

// this is how our tuple will look like 
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);



// Model creation
const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets'
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile,"ALPHA1");
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// initially this page is thrown to the client 
app.get('/',function(req,res){
    res.render('home.ejs')
})

app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile'] }));


app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
// Successful authentication, redirect home.
res.redirect('/secrets');
console.log("ALPHA3")

});

  // get login page from root page once user clicks on login button
app.get('/login',function(req,res){
    res.render('login.ejs')
})

// get register page from root page once user clicks on register button
app.get('/register',function(req,res){
    res.render('register.ejs')
});

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
      if (err){
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });
  });

app.get('/logout', function(req, res){
    console.log("9")
    req.logout();
    res.redirect('/');
  });


app.post('/register',function(req,res){
    User.register({username:req.body.username }, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect('/register');
         }else{
            passport.authenticate('local' )(req, res, function() {
              res.redirect('/secrets');
            });
         };
      
        });
      });


// handeling post request for login page to check if username exits, password is correct or not
app.post('/login',function(req,res){
    console.log("1");
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    console.log("2");



    req.login(user, function(err) {
    console.log("3");

        if (err) { 
            console.log("4");

            console.log(err); 
        }else{
            console.log("5");

            passport.authenticate('local' )(req, res, function() {
            res.redirect('/secrets');
        });
        }
      });
      console.log("6");

})



// checking if port is up and active
app.listen(3000,function(){
    console.log("Server started at 3000")
})