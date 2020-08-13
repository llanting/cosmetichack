const express = require('express')
const router = express.Router()
const bcryptjs = require('bcryptjs');

const UserModel = require('../models/user.model')

router.get('/signup', (req, res) => {
    res.render('authentication/signup.hbs')
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
      res.status(500).render('authentication/signup.hbs', {errorMessage: 'Password must have a minimum of 6 characters and must include at least one number digit'})
      return;
    }
  
    bcryptjs.genSalt(10)
    .then((salt) => {
        bcryptjs.hash(password, salt)
          .then((hashPass) => {
              UserModel.findOne({$or: [{username, email}]})
                .then((result) => {
                  console.log('result', result)
                  if (result === null) {
                    UserModel.create({username, email, passwordHash: hashPass })
                    .then(() => res.redirect('/'))
                    .catch((err) => console.log(err))
                  } else {
                    res.status(500).render('authentication/signup.hbs', {errorMessage: 'Username or email already exists'})
                  }
                })
                .catch((err) => console.log(err))
          })
    })
  })
  
// Login
router.get('/login', (req, res) => {
    res.render('authentication/login.hbs')
})  
  
  
router.post('/login', (req, res) => {
    const {email, password} = req.body

    if(!email || !password){
        res.status(500).render('authentication/login.hbs', {errorMessage: 'Please fill in all fields'})
        return;
    }

    const emailReg = new RegExp(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/)
    if (!emailReg.test(email)){
        res.status(500).render('authentication/login.hbs', {errorMessage: 'Please enter a valid email address'})
        return;
    }

    const passReg = new RegExp(/^(?=.*\d).{6,20}$/)
    if (!passReg.test(password)){
        res.status(500).render('authentication/login.hbs', {errorMessage: 'Password must have a minimum of 6 characters and must include at least one number digit'})
        return;
    }

    UserModel.findOne({email: email})
        .then((userData) => {
            let doesItMatch = bcryptjs.compareSync(password, userData.passwordHash); 
            if (doesItMatch){
                req.session.loggedInUser = userData
                res.redirect('/my-profile/' + req.session.loggedInUser._id)
            } else {
                res.status(500).render('authentication/login.hbs', {errorMessage: 'Password incorrect'})
            }
        }) 
        .catch((err) => {
            console.log('Error is', err)
            res.render('general/error.hbs', {errorMessage: 'Wrong email or password'})
        })
})

// Log out & destroying session
router.get('/logout', (req,res) => {
  req.session.destroy(() => res.redirect('/'))
})


//This for making sure the private routes are only available when logged in! Pay attention to order of routes in app.js
router.use((req, res, next) => {
  if (req.session.loggedInUser) {
      next();
  }
  else {
      res.redirect('/login')
  }
})


module.exports = router;