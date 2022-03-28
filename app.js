//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
//used for encrypting the password
// //const encrypt = require('mongoose-encryption');
// used for hashing the password
const md5 = require('md5');



// connecting to mongoose 
mongoose.connect('mongodb://localhost:27017/userDB');

// this is how our tuple will look like 
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// We are only encrypting one specific field that is the password attribute using dotenv
// //userSchema.plugin(encrypt, { secret: process.env.SECRET , encryptedFields: ['password'] });

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
    
    const newUser = new User({ email: req.body.username ,password: md5(req.body.password )});
    console.log(newUser.email , newUser.password); // 'Person1'
    // console.log(req.body.username , req.body.password ); // 'Person1'
    

    // saving the data of the user in the DB
    newUser.save(function(err){
        if(err){
            console.log(err)
        }else{
            res.render("secrets.ejs")
        }
    })

});


// handeling post request for login page to check if username exits, password is correct or not
app.post('/login',function(req,res){

    // this are the elements the user will enter in the landing page and we are extracting it 
    email = req.body.username;
    password = md5(req.body.password);
    
    User.findOne({email: email }, function(err,foundUser){
        console.log(password);

        if(err){
            console.log("4");
            res.render("home.ejs")
        }else if(!foundUser){
            console.log("No user");
            res.send("Hey")

        }else{
            if(foundUser.password === password){
                console.log("3");

                console.log("Login Successful");
                res.render("secrets.ejs")
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