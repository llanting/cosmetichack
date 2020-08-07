const express = require('express')
const router = express.Router()
const bcryptjs = require('bcryptjs');

const UserModel = require('../models/user.model')



router.get('/signup', (req, res) => {
    res.render('authentication/signup.hbs')
  })
  
  
router.get('/login', (req, res) => {
    res.render('authentication/login.hbs')
})


router.post('/signup', (req, res) => {
    const {username, email, password} = req.body
  
    if(!username || !email || !password){
      res.status(500).render('authentication/signup.hbs', {errorMessage: 'Please fill in all fields'})
      return;
    }
    
    const emailReg = new RegExp(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/)
    if (!emailReg.test(email)){
      res.status(500).render('authentication/signup.hbs', {errorMessage: 'Please enter a valid email address'})
      return;
    }
    
    const passReg = new RegExp(/^(?=.*\d).{6,20}$/)
    if (!passReg.test(password)){
      res.status(500).render('authentication/signup.hbs', {errorMessage: 'Password must have a minimum of 6 characters and must include at least one number digit.'})
      return;
    }
  
  
    bcryptjs.genSalt(10)
    .then((salt) => {
        bcryptjs.hash(password , salt)
          .then((hashPass) => {
              console.log(hashPass)
              // create that user in the db
              //can write only username, email (without double)
              UserModel.create({username, email, passwordHash: hashPass })
                .then(() => {
                    res.redirect('/')
                })
          })
    })
  
  })
  
  
  //login is comparing with the  DB
  
router.post('/login', (req, res) => {
    const {email, password} = req.body

    if(!email || !password){
        console.log(email, password)
        res.status(500).render('authentication/login.hbs', {errorMessage: 'Please fill in all fields'})
        return;
    }

    // const emailReg = new RegExp(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/)
    // if (!emailReg.test(email)){
    //     res.status(500).render('authentication/login.hbs', {errorMessage: 'Please enter a valid email address'})
    //     return;
    // }

    // const passReg = new RegExp(/^(?=.*\d).{6,20}$/)
    // if (!passReg.test(password)){
    //     res.status(500).render('authentication/login.hbs', {errorMessage: 'Password must have a minimum of 6 characters and must include at least one number digit.'})
    //     return;
    // }

    UserModel.findOne({email: email})
        .then((userData) => {
            let doesItMatch = bcryptjs.compareSync(password, userData.passwordHash); 
            if (doesItMatch){
                req.session.loggedInUser = userData
                res.redirect('/my-profile')
            } else {
                res.status(500).render('authentication/login.hbs', {errorMessage: 'Password incorrect'})
            }
        }) 
        .catch((err) => {
            console.log('Error is', err)
            res.render('general/error.hbs')
        })
})
  
  










module.exports = router;