const express = require('express');
const html = require('html');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
var cookieParser = require('cookie-parser')

const mongoose = require('mongoose');

const app = express();
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('ejs').renderFile);


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
  

app.use(passport.initialize());
app.use(passport.session());

const db1URL = 'mongodb://127.0.0.1:27017/riderDB'; 
const db2URL = 'mongodb://127.0.0.1:27017/driverDB'; 
const db3URL = 'mongodb://127.0.0.1:27017/riderRequestsDB'; 


const db1Connection = mongoose.createConnection(db1URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db2Connection = mongoose.createConnection(db2URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db3Connection = mongoose.createConnection(db3URL, { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.set('useCreateIndex', true );

const riderRequests = new mongoose.Schema({
    pickup: String,
    drop: String,
    type: String,
    people: String,
    dateof: String,
    timeof: String,
    freq: String,
  });

  const rideRequests = db3Connection.model('rideRequests', riderRequests);


const riderSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    phoneNumber: Number,
    myRides: [riderRequests],
  });
  riderSchema.plugin(passportLocalMongoose);
  const riderModel = db1Connection.model('riderModel', riderSchema);
  //passport.use(riderModel.createStrategy());
  //passport.serializeUser(riderModel.serializeUser());
  //passport.deserializeUser(riderModel.deserializeUser());

  
const driverSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    phoneNumber: Number,
    myRides: [riderRequests],
  });
  driverSchema.plugin(passportLocalMongoose);
  const driverModel = db2Connection.model('driverModel', driverSchema);
  //passport.use(driverModel.createStrategy());
  //passport.serializeUser(driverModel.serializeUser());
  //passport.deserializeUser(driverModel.deserializeUser());
/*
  passport.serializeUser(function(riderModel, done) {
    done(null, riderModel.id);
});

passport.deserializeUser(function(id, done) {
    riderModel.findOne({ _id: id }, '-password -salt')
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

passport.serializeUser(function(driverModel, done) {
    done(null, driverModel.id);
});

passport.deserializeUser(function(id, done) {
    driverModel.findOne({ _id: id }, '-password -salt')
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});*/

passport.serializeUser(function(user, done) {
    console.log('in serialize');
    const userModel = user.constructor.modelName === 'riderModel' ? riderModel : driverModel;
    done(null, { id: JSON.stringify(user.id), model: userModel.modelName });
    console.log(user.id);
    console.log(userModel.modelName);
  });
  
  passport.deserializeUser(function(data, done) {
    try {
        console.log(data.id);
        const Model = data.model === 'riderModel' ? riderModel : driverModel;
        //console.log(Model.findOne({ id: data.id }));
        const user = Model.findOne({ id: data.id,  model: data.modelName });
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      } catch (err) {
        done(err, false);
      }
});
  
  
  passport.use('local-rider', new LocalStrategy(riderModel.authenticate()));
  passport.use('local-driver', new LocalStrategy(driverModel.authenticate()));



  passport.use(new LocalStrategy(function(username, password, done) {
    riderModel.findOne({
        username: username
    }, function(err, user) {
        // This is how you handle error
        if (err) return done(err);
        // When user is not found
        if (!user) return done(null, false);
        // When password is not correct
        if (!user.authenticate(password)) return done(null, false);
        // When all things are good, we return the user
        return done(null, user);
     });
}));






//mongoose.connect('mongodb://127.0.0.1:27017/riderDB', {useNewUrlParser: true});





/*const Schema = {
    username: String,
    email: String,
    password: String,
    phoneNumber: Number
};*/



app.get('/',function(req,res){
    res.sendFile(path.join(__dirname, 'sign-up.html'));
});

app.get('/sign-up.html',function(req,res){
    res.sendFile(path.join(__dirname, 'sign-up.html'));
});

app.get('/sign-in.html',function(req,res){
    res.sendFile(path.join(__dirname, 'sign-in.html'));
});

app.get('/rider-page-default',function(req,res){
    
    if(req.isAuthenticated()){
                res.render('rider-page-default',{rider: req.name});
            } 
        else{
            console.log(req.isAuthenticated());
            res.sendFile(path.join(__dirname, 'sign-in.html'));
        }

});

app.get('/driver-main-page',function(req,res){
    if(req.isAuthenticated()){
    let rides;
    var today = new Date();
    var dat= today.getDate();
    var mon = today.getMonth() + 1 ;
    var year = today.getFullYear();
    if(mon < 10){
        if(dat<10){
            var datte = (year + '-0' + mon + '-0' + dat);
        }

        else{
            var datte = (year + '-0' + mon + '-' + dat);
        }
        
    }

    else{
        var datte = (year + '-' + mon + '-' + dat);
    }
    

    rideRequests.find({ dateof: datte }).then((result) => {
        if (result) {
          rides = result;
          res.render('driver-main-page', { rides: rides, driver: "" });
        } else {
          console.log('No ride requests found');
          res.render('driver-main-page', { rides :[], driver: "" });
        }
      }).catch((err) => {
        console.log(err);
        res.render('driver-main-page', { rides: [], driver: "" });
      });
    } else{
        res.sendFile(path.join(__dirname, 'sign-in.html'));
    }
});




app.post("/sign-up.html",function(req,res){

    const response = {
        success: false,
        message: '',
      };

    if(req.body.button1Value == 'true'){

        riderModel.findOne({username: req.body.email}).then((result) => {   
            if (result) {
                response.message = 'Sign-up failed as this email is already being used as rider';
                res.json(response);
            } else{
                riderModel.findOne({name: req.body.name}).then((result) => {   
                    if (result) {
                        response.message = 'Sign-up failed as this username is already being used as rider';
                        res.json(response);
                    } else{
                        riderModel.findOne({phoneNumber: req.body.number}).then((result) => {   
                            if (result) {
                                response.message = 'Sign-up failed as this phone number is already being used as rider';
                                res.json(response);
                            } else{
                                driverModel.findOne({username: req.body.email}).then((result) => {   
                                    if (result) {
                                        response.message = 'Sign-up failed as this email is already being used as driver';
                                        res.json(response);
                                    } else{
                                        driverModel.findOne({name: req.body.name}).then((result) => {   
                                            if (result) {
                                                response.message = 'Sign-up failed as this username is already being used as driver';
                                                res.json(response);
                                            } else{
                                                driverModel.findOne({phoneNumber: req.body.number}).then((result) => {   
                                                    if (result) {
                                                        response.message = 'Sign-up failed as this phone number is already being used as driver';
                                                        res.json(response);
                                                    } else{

                                                          riderModel.register({ name: req.body.name,                                                              username: req.body.name,
                                                            username: req.body.email,
                                                            phoneNumber: req.body.number}, req.body.password,function(err,user){
                                                                if(err){
                                                                    console.log(err);
                                                                    res.sendFile(path.join(__dirname, 'sign-up.html'));
                                                                }else{
                                                                    passport.authenticate('local')(req,res, function(){
                                                                        req.session.save();
                                                                        console.log('Registered succesfully');
                                                                        res.sendFile(path.join(__dirname, 'sign-up.html'));
                                                                    });
                                                                }
                                                            });

                                                           /*const newRider = new riderModel({
                                                               username: req.body.name,
                                                               email: req.body.email,
                                                               password: req.body.password,
                                                               phoneNumber: req.body.number
                                                           });
                                                           
                                                           newRider.save().then(()=>{
                                                               res.sendFile(path.join(__dirname, 'sign-in.html'));
                                                               //res.json({ success: true, redirect: '/sign-in.html' });
                                                           }).catch((err)=>{
                                                               console.log(err);
                                                           });*/

                                                          }}).catch((err1) => {   
                                                              console.log(err1);
                                                           });
                                                  }}).catch((err1) => {   
                                                    console.log(err1);
                                                 });
                                        }}).catch((err1) => {   
                                            console.log(err1);
                                            });
                        }}).catch((err1) => {   
                            console.log(err1);
                            });
                    }}).catch((err1) => {   
                        console.log(err1);
                        });
                }}).catch((err1) => {   
                    console.log(err1);
                    });
                }
            



    else if(req.body.button2Value == 'true'){


        riderModel.findOne({username: req.body.email}).then((result) => {   
            if (result) {
                response.message = 'Sign-up failed as this email is already being used as rider';
                res.json(response);
            } else{
                riderModel.findOne({name: req.body.name}).then((result) => {   
                    if (result) {
                        response.message = 'Sign-up failed as this username is already being used as rider';
                        res.json(response);
                    } else{
                        riderModel.findOne({phoneNumber: req.body.number}).then((result) => {   
                            if (result) {
                                response.message = 'Sign-up failed as this phone number is already being used as rider';
                                res.json(response);
                            } else{
                                driverModel.findOne({username: req.body.email}).then((result) => {   
                                    if (result) {
                                        response.message = 'Sign-up failed as this email is already being used as driver';
                                        res.json(response);
                                    } else{
                                        driverModel.findOne({name: req.body.name}).then((result) => {   
                                            if (result) {
                                                response.message = 'Sign-up failed as this username is already being used as driver';
                                                res.json(response);
                                            } else{
                                                driverModel.findOne({phoneNumber: req.body.number}).then((result) => {   
                                                    if (result) {
                                                        response.message = 'Sign-up failed as this phone number is already being used as driver';
                                                        res.json(response);
                                                    } else{


                                                           driverModel.register({ name: req.body.name,                                                              username: req.body.name,
                                                            username: req.body.email,
                                                            phoneNumber: req.body.number}, req.body.password,function(err,user){
                                                                if(err){
                                                                    console.log(err);
                                                                    res.sendFile(path.join(__dirname, 'sign-up.html'));
                                                                }else{
                                                                    passport.authenticate('local')(req,res, function(){
                                                                        req.session.save();
                                                                        console.log('Registered succesfully');
                                                                        res.sendFile(path.join(__dirname, 'sign-up.html'));
                                                                    });
                                                                }
                                                            });

                                                           /*const newDriver = new driverModel({
                                                               username: req.body.name,
                                                               email: req.body.email,
                                                               password: req.body.password,
                                                               phoneNumber: req.body.number
                                                           });
                                                           
                                                           newDriver.save().then(()=>{
                                                               res.sendFile(path.join(__dirname, 'sign-in.html'));
                                                           }).catch((err)=>{
                                                               console.log(err);
                                                           });*/


                                                          }}).catch((err1) => {   
                                                              console.log(err1);
                                                           });
                                                  }}).catch((err1) => {   
                                                    console.log(err1);
                                                 });
                                        }}).catch((err1) => {   
                                            console.log(err1);
                                            });
                        }}).catch((err1) => {   
                            console.log(err1);
                            });
                    }}).catch((err1) => {   
                        console.log(err1);
                        });
                }}).catch((err1) => {   
                    console.log(err1);
                    });
}
});


app.post("/sign-in.html",function(req,res){



    const username = req.body.username;
    const password = req.body.password;

    riderModel.findOne({username: username}).then((result) => {   
        if (result) {
            
            const user = new riderModel({
                username: req.body.username,
                name: result.name,
                password: req.body.password,
                phoneNumber: result.phoneNumber,
                myRides: result.myRides,
            });

            passport.authenticate('local')(req, res, function() {
                req.login(user, function(err) {
                  if (err) {
                    console.log(err);
                  } else {
                    req.session.save(() =>
                            {
                              return res.redirect('rider-page-default');
                            });
                  }
                });
              });
              
            
            /*riderModel.findOne({password: passWord}).then((result) => {   
                if (result) {*/
                    /*req.login(user,function(err){
                        if(err){
                            console.log(err);
                        }else{
                            /*passport.authenticate('local', {
                                successRedirect : '/rider-page-default.html',
                                failureRedirect : '/sign-in.html',
                                failureFlash : true // allow flash messages
                              });
                            passport.authenticate('local')(req,res,function(){
                                req.session.save(() =>
                                      {
                                           res.redirect('rider-page-default');
                                      });
                                //res.render('rider-page-default',{rider: user.username});
                            });
                        }
                    });
                    //res.sendFile(path.join(__dirname, 'rider-page-default.html'));
                /*} else{
                    console.log("Invalid password");
                    res.sendFile(path.join(__dirname, 'sign-in.html'));
                }}).catch((err1) => {   
                    console.log(err1);
                 });*/
            
        } else {
            driverModel.findOne({username: username}).then((result) => {   
                if (result) {
                    const user = new driverModel({
                        username: req.body.username,
                        name: result.name,
                        password: req.body.password,
                        phoneNumber: result.phoneNumber,
                        myRides: result.myRides,
                    });
                    /*driverModel.findOne({password: password}).then((result) => {  
                        if (result) {*/
                            req.login(user,function(err){
                                if(err){
                                    console.log(err);
                                }else{
                                    passport.authenticate('local')(req,res,function(){
                                        res.redirect('driver-main-page');
                                    });
                                }
                        })} /*else{
                            console.log("Invalid password");
                            res.sendFile(path.join(__dirname, 'sign-in.html'));
                        }}).catch((err2) => {   
                            console.log(err2);
                         });*/
                    
                 else {
                    console.log("Invalid email");
                    res.sendFile(path.join(__dirname, 'sign-in.html'));
                }
            }).catch((err3) => {   
                console.log(err3);
             });
        }
    }).catch((err4) => {   
        console.log(err4);
     });

});


app.post("/rider-page-default",function(req,res){
    if(req.isAuthenticated()){
    const Pickup = req.body.pickup;
    const Drop = req.body.drop;
    const Type = req.body.type;
    const People = req.body.people;
    const Date = req.body.date;
    const Time = req.body.time;
    const Freq = req.body.freq;


    const newRideRequests = new rideRequests({
        pickup: Pickup,
        drop: Drop,
        type: Type,
        people: People,
        dateof: Date,
        timeof: Time,
        freq: Freq
    });
    
    newRideRequests.save().then(()=>{
        console.log('Your Ride is successfully scheduled');
    }).catch((err)=>{
        console.log(err);
    });}

    else{
        res.sendFile(path.join(__dirname, 'sign-in.html'));
    }

});


app.post("/driver-main-page",function(req,res){
    const filters = {
        pickup: req.body.pickup || null,
        drop: req.body.drop || null,
        dateof: req.body.date || null,
        timeof: req.body.time || null,
        type: req.body.type || null
    };

    const query = {};

    // Building the query dynamically based on the provided filters
    for (const key in filters) {
      if (filters[key]) {
        query[key] = filters[key];
      }
    }

    rideRequests
    .find(query)
    .then((result) => {
      const rides = result;
      res.render('driver-main-page', { rides: rides, driver: "" });
    })
    .catch((err) => {
      console.log(err);
      res.render('driver-main-page', { rides :[], driver: "" }); // Redirect in case of an error
    });


});




app.listen(3000,function(){
    console.log('Server started at port 3000');
});
