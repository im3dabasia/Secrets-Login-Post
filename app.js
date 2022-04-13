//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

// Adding Signin with google option and facebook
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
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
    googleId : String,
    facebookId: String,
    secret: String
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

// For google authentication

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.callbackURL
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile,"ALPHA1");
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// For facebook authentication
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_APP_callbackURL
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile.id,"GAMMA1");
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
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
// Successful authentication, redirect secrets.
res.redirect('/secrets');
console.log("ALPHA3")

});

app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['public_profile', 'email' ,'user_gender','user_friends','user_location']
  }));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
    console.log("GAMMA3")

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


app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.render("login");
  }
});

app.post('/submit',function(req,res){

  User.findById(req.user.id, function (err, foundUser) {
    if(err){
      console.log(err)
    }
    else {
      if(foundUser){
        foundUser.secret = req.body.secret;
        foundUser.save(function(){
          res.redirect('/secrets')
        })
      }
      else{
        res.redirect('/login')
      }
    }


  });
})

app.get('/logout', function(req, res){
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
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user, function(err) {

        if (err) { 

            console.log(err); 
        }else{

            passport.authenticate('local' )(req, res, function() {
            res.redirect('/secrets');
        });
        }
      });

})



// checking if port is up and active
app.listen(3000,function(){
    console.log("Server started at 3000")
})