const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const RecipesModel = require('../models/recipe.model')
const UserModel = require('../models/user.model');
const CommentModel = require('../models/comment-model');


// My-profile page
router.get('/my-profile/:userId', (req, res) => {
    UserModel.findById(req.params.userId)
        .then((currentUser) => res.render('profile/my-profile.hbs', {currentUser}))
        .catch(() => res.redirect('/signup'))
});

// Editing user-info
router.get('/my-profile/:userId/edit', (req, res) => {
    UserModel.findById(req.params.userId)
        .then((currentUser) => res.render('profile/my-profile-edit.hbs', {currentUser}))
        .catch((err) =>  console.log('Some error:', err));
});


router.post('/my-profile/:userId/edit', (req, res) => {
    UserModel.findByIdAndUpdate(req.params.userId, {$set: req.body})
        .then((user) => res.redirect('/my-profile/' + user._id))
        .catch((err) => console.log(err))
});

// Delete user
router.get('/delete-user', (req, res) => {
    let currentUser = req.session.loggedInUser
    res.render('profile/sure-delete.hbs', {currentUser})
});

router.get('/my-profile/:userId/delete', (req, res) => {
    UserModel.findByIdAndDelete(req.params.userId)
      .then(() => req.session.destroy(() => res.redirect('/')))
      .catch((err) => console.log(err));
});

  
// My recipes
router.get('/my-profile/:userId/my-recipes', (req, res) => {
    let currentUser = req.session.loggedInUser;
    RecipesModel.find({user: req.params.userId})
        .then((recipes) => res.render('profile/my-recipes.hbs', {recipes, currentUser}))
        .catch((err) => console.log(err));
});

  

// Favorite button route (my-favorite page)
router.get('/my-profile/:userId/my-favorites', (req, res) => {
    UserModel.findById(req.params.userId)
        .populate('favorites')
        .then((currentUser) => {
            res.render('profile/my-favorites.hbs', {currentUser});
        })
        .catch((err) => console.log(err));
    });

// Unfavorite button route (my-favorite page)
router.post('/my-profile/:userId/my-favorites/:recipeId/unfavorite', (req, res) => {
    UserModel.findByIdAndUpdate(req.session.loggedInUser._id, { $pull: { favorites: mongoose.Types.ObjectId(req.params.recipeId) }}) 
        .then(() => {
            UserModel.findById(req.session.loggedInUser._id)
             .then(() => {
                res.redirect('/my-profile/'+ req.session.loggedInUser._id +'/my-favorites')
             })
             .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
});


// My comments
router.get('/my-profile/:userId/my-comments', (req, res) => {
    let currentUser = req.session.loggedInUser;
    CommentModel.find({user: req.params.userId}) 
        .populate('recipe')
        .then((comment) => res.render('profile/my-comments.hbs', {comment, currentUser}))
        .catch((err) => console.log(err));
});

//Delete comment
router.get('/my-profile/my-comments/:commentId/delete', (req, res) => {
    let currentUser = req.session.loggedInUser;
    CommentModel.findByIdAndDelete(req.params.commentId) 
        .then((result) => {
            CommentModel.find({user: currentUser._id})
            .populate('recipe')
            .then((comment) => res.render('profile/my-comments.hbs', {comment, currentUser}))
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
});

// Public profile
router.get('/public-profile/:userId', (req, res) => {
    let currentUser = req.session.loggedInUser;
    RecipesModel.find({user: req.params.userId})
        .populate('user')
        .then((recipe) => {
            UserModel.findById(currentUser)
                .then((result) => {
                    let newRecipes = recipe.map((elem) => {
                        if (result.favorites.includes(elem._id)) {
                            let newElem = JSON.parse(JSON.stringify(elem))
                            newElem.alreadyFav = true;
                            return newElem;
                        } else {
                            return elem;
                        }
                    })
                    let username = recipe[0].user.username;
                    res.render('profile/public-profile.hbs', {currentUser, username, recipe: newRecipes})
                })
                .catch((err) => console.log(err));
            
            
        }).catch((err) => console.log(err));
});


router.get('*', (req, res) => res.render('general/404.hbs'));
  

module.exports = router;




