const express       = require('express');
const router        = express.Router();
const RecipesModel  = require('../models/recipe.model');
const UserModel     = require('../models/user.model');
const IngredientModel = require('../models/ingredient.model');
const moment        = require('moment');
const uploader      = require('../config/cloudinary.js');

// All recipes
router.get('/all-recipes', (req, res) => {
    let currentUser = req.session.loggedInUser;
    RecipesModel.find()
        .then((recipe) => {
            UserModel.findById(currentUser._id)
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
                    let purpose = ['', 'Moisturizing', 'Repairing', 'Sun protection', 'Refreshing', 'Anti-aging', 'Purifying', 'Perfuming', 'Exfoliating'];
                    res.render('recipes/all-recipes.hbs', {recipe: newRecipes, currentUser, purpose})
                })
                .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
});


// Search 
router.get('/all-recipes/search', (req,res) => {
    let {category, purposeQ} = req.query;
    let search = {}
    if (purposeQ != undefined) {
        search.purpose = purposeQ;
    }
    if (category != undefined) {
        search.category = category;
    }

    let currentUser = req.session.loggedInUser;
    let purpose = ['', 'Moisturizing', 'Repairing', 'Sun protection', 'Refreshing', 'Anti-aging', 'Purifying', 'Perfuming', 'Exfoliating'];

    RecipesModel.find({$or: [{category: search.category}, {purpose: search.purposeQ}]})
        .then((recipe) => {
            if (recipe.length === 0) {
                res.render('recipes/all-recipes.hbs', {recipe, purpose, errorMessage: 'No matches found', currentUser})
            } else {
                res.render('recipes/all-recipes.hbs', {recipe, purpose, currentUser})
            }
        })
        .catch((err) => console.log(err));
});

// Recipe-details
router.get('/all-recipes/:recipeId', (req, res) => {
    let currentUser = req.session.loggedInUser;
    RecipesModel.findById(req.params.recipeId)
        // To insert user-info, next to id
        .populate('user')
        .then((recipe) => {
            // Changes recipe.date to a readable format
            let newDate = moment(recipe.date).format("MMMM DD, YYYY");
    

                if (recipe.level == "easy"){  

                    if (recipe.cost == "low"){
                        res.render('recipes/recipe-details.hbs', {recipe, date: newDate, currentUser, cost: '/images/1-round.png', level: '/images/1-round.png'})
                    } else if (recipe.cost == "medium"){
                        res.render('recipes/recipe-details.hbs', {recipe, date: newDate, currentUser, cost: '/images/2-round.png', level: '/images/1-round.png'})
                    } else if (recipe.cost == "high"){
                        res.render('recipes/recipe-details.hbs', {recipe, date: newDate, currentUser, cost: '/images/3-round.png', level: '/images/1-round.png'})
                    }

                } else if (recipe.level == "medium"){
                    if (recipe.cost == "low"){
                        res.render('recipes/recipe-details.hbs', {recipe, date: newDate, currentUser, cost: '/images/1-round.png', level: '/images/2-round.png'})
                    } else if (recipe.cost == "medium"){
                        res.render('recipes/recipe-details.hbs', {recipe, date: newDate, currentUser, cost: '/images/2-round.png', level: '/images/2-round.png'})
                    } else if (recipe.cost == "high"){
                        res.render('recipes/recipe-details.hbs', {recipe, date: newDate, currentUser, cost: '/images/3-round.png', level: '/images/2-round.png'})
                    }


                } else if (recipe.level == "hard"){
                    if (recipe.cost == "low"){
                        res.render('recipes/recipe-details.hbs', {recipe, date: newDate, currentUser, cost: '/images/1-round.png', level: '/images/3-round.png'})
                    } else if (recipe.cost == "medium"){
                        res.render('recipes/recipe-details.hbs', {recipe, date: newDate, currentUser, cost: '/images/2-round.png', level: '/images/3-round.png'})
                    } else if (recipe.cost == "high"){
                        res.render('recipes/recipe-details.hbs', {recipe, date: newDate, currentUser, cost: '/images/3-round.png', level: '/images/3-round.png'})
                    }

                }  

            })

             
            .catch((err) => console.log(err))  
        .catch((err) => console.log(err))
    });

// Creating recipe
router.get('/create-recipe', (req, res) => {
    let currentUser = req.session.loggedInUser;
    IngredientModel.find()
    .then((ingredients) => {
        res.render('recipes/create-recipe.hbs', {ingredients, currentUser})
    })
    .catch((err)=>{
        console.log("error is", err)
    })
})


router.post('/create-recipe', uploader.single("imageUrl"), (req, res) => {
    const {name, category, time, cost, materials, level, purpose, conservation, steps, imageUrl, ingredients} = req.body;
    
    if(!name || !category || !purpose || !time || !cost || !materials || !level || !conservation || !steps || !ingredients){
        res.status(500).render('recipes/create-recipe.hbs', {errorMessage: 'Please fill in all fields'})
        return;
    }

    console.log('file is: ', req.file)
    if (!req.body.imageUrl) {
        console.log('Image not found')
    }

    RecipesModel.create(req.body)
        .then((createdRecipe) => {
            RecipesModel.findByIdAndUpdate(createdRecipe._id, {$set: {image: req.file.path, user: req.session.loggedInUser._id}})
                .then((recipe) => {
                    console.log(recipe)
                    res.redirect('/all-recipes/' + recipe._id);
                    UserModel.findByIdAndUpdate(req.session.loggedInUser._id, {$push: {recipes: [recipe]}})
                        .then(() => console.log('succes'))
                        .catch((err) =>  console.log(err));
                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err));
});

// Edit and delete my recipes
router.get('/my-profile/my-recipes/:recipeId/edit', (req, res) => {
    let currentUser = req.session.loggedInUser
    RecipesModel.findById(req.params.recipeId)
        .then((recipe) => {
            res.render('recipes/edit-recipe.hbs', {recipe, currentUser})
        })
    });

router.post('/my-profile/my-recipes/:recipeId/edit', (req, res) => {
    RecipesModel.findByIdAndUpdate(req.params.recipeId, {$set: req.body})
        .then((recipe) => {
            res.redirect('/all-recipes/' + recipe._id)
        }).catch((err) => {
            console.log(err)
        });
    });

router.post('/my-profile/my-recipes/:recipeId/delete', (req, res) => {
    RecipesModel.findByIdAndDelete(req.params.recipeId)
        .then(() => {
            res.redirect('/my-profile/' + req.session.loggedInUser._id + '/my-recipes')
        })
        .catch((err) => console.log(err))
    });




// Favorite button route (all-recipes page)
router.post('/all-recipes/:recipeId/favorite', (req, res) => {
    UserModel.update({ _id: req.session.loggedInUser._id }, { $push: { favorites: req.params.recipeId } }) 
        .then(() => {
            res.redirect('/all-recipes')
        }).catch((err) => {
            console.log(err)    
        });
});

// Unavorite button route (all-recipes page)
router.post('/all-recipes/:recipeId/unfavorite', (req, res) => {
    UserModel.update({ _id: req.session.loggedInUser._id }, { $pull: { favorites: req.params.recipeId }}) 
        .then(() => {
            res.redirect('/all-recipes')
        }).catch((err) => {
            console.log(err)    
        });
});



module.exports = router;