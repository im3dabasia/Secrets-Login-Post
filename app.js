//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const saltRounds = 10;


// connecting to mongoose 
mongoose.connect('mongodb://localhost:27017/userDB');

// this is how our tuple will look like 
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


// Model creation
const User = mongoose.model('User', userSchema);


// intializing our app variable with express constructor
const app = express();

// to ensure all other subfiles like css of the page reach along with the get request to the client
app.use(express.static("public"));

// this is to use ejs module we are setting our app to use ejs
app.set('view engine','ejs');

// to not get a depreciation error
app.use(bodyParser.urlencoded(
    {
        extended:true
    }));

// initially this page is thrown to the client 
app.get('/',function(req,res){
    res.render('home.ejs')
})

// get login page from root page once user clicks on login button
app.get('/login',function(req,res){
    res.render('login.ejs')
})

// get register page from root page once user clicks on register button
app.get('/register',function(req,res){
    res.render('register.ejs')
})


app.post('/register',function(req,res){
    
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({ 
            email: req.body.username ,
            password:  hash});
        // Store hash in your password DB.
        newUser.save(function(err){
            if(err){
                console.log(err)
            }else{
                res.render("secrets.ejs")
            }
        })
    });    

    // saving the data of the user in the DB

});


// handeling post request for login page to check if username exits, password is correct or not
app.post('/login',function(req,res){

    email = req.body.username;
    password = req.body.password;
    console.log(password);
    
    
    User.findOne({email: email }, function(err,foundUser){

        if(err){
            console.log("4");
            res.render("home.ejs")
        }else if(!foundUser){
            console.log("No user");
            res.send("No User FOund")

        }else{
            if(foundUser ){
                console.log("3");
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(result == true){
                        console.log("Hoo")
                        res.render("secrets.ejs")

                    }
                });
            }else{
                console.log("2");
                
                res.render("home.ejs")
            } 
        }

    });
})



// checking if port is up and active
app.listen(3000,function(){
    console.log("Server started at 3000")
})