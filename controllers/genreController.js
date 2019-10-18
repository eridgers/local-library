var Genre = require('../models/genre');
var async = require('async');
var Book = require('../models/book');
var mongoose = require('mongoose');
const {sanitizeBody} = require('express-validator');
const {validationResult, body} = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find().sort('name').exec(function(err, genres){
        if(err) {return next(err);}
        res.render('genre_list', {title: 'Genre List', genres: genres});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    var id = mongoose.Types.ObjectId(req.params.id);
    async.parallel({
        genre: function(callback){
            Genre.findById(id).exec(callback);
        },
        books: function(callback){
            Book.find({'genre': id}).exec(callback);
            },
    }, function(err, results){
        if(err) {return next(err);}
        if(results.genre==null){
            var err = new Error('Genre not foud');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, books: results.books});
    });    
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    // check name field not empty
    body('name', 'Genre name required').isLength({min: 1}).trim(),
    // santize (escape) name field
    sanitizeBody('name').escape(),
    // process request after validation and sanitization
    (req, res, next) => {
        // get errors from request
        const errors = validationResult(req);
        // create genre object with escaped & trimmed data
        var genre = new Genre(
            {name: req.body.name}
        );

        if(!errors.isEmpty()){
            // there are errors, render form with error messages
            res.render('genre_form', {title: 'Create Genre', genre: genre, errors: error.array()});
            return;
        }else{
            // data from form valid - check genre is new
            Genre.findOne({'name': req.body.name}).exec(function(err, foundGenre){
                if(err) {return next(err);}
                if(foundGenre){
                    // genre already exists, go to its detail page
                    res.redirect(foundGenre.url);
                }else{
                    genre.save(function(err){
                        if(err) {return next(err);}
                        // else saved so go to detail
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];


// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
// async get genre, books
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback)
        },
        books: function(callback){
            Book.find({'genre': req.params.id}).exec(callback)
        },
    }, function(err, results){
        // check errors, go to list if error, else render delete page
        if (err) {return next(err);}
        if (results.genre==null){
            res.redirect('/catalog/genres');
        }
        res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, books: results.books});
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
// async get genre, books
    async.parallel({
        genre: function(callback){
            Genre.findById(req.body.id).exec(callback)
        },
        books: function(callback){
            Book.find({'genre': req.body.id}).exec(callback)
        },
    }, function(err, results){
        // check errors
        if(err) {return next(err);}
        // if no books delete, else render delete page
        if(results.books.length > 0){
            res.redirect('genre_delete', {title: 'Delete Genre', genre: results.genre, books: results.books});
        }else{
            Genre.findByIdAndRemove(req.body.id, function(err){
                if(err) {return next(err);}
                // if delete good render list
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    // get genre
    Genre.findById(req.params.id).exec(function(err, genre){
        if(err) {return next(err);}
        // check it was found or return error
        if(genre==null){
            var err = new Error('Genre not found');
            err.status = '404';
            return next(err);
        }
        // render the form
        res.render('genre_form', {title: 'Update Genre', genre: genre});
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    //validate
    body('name', 'Genre name required').isLength({min: 1}).trim(),
     //sanitize
    sanitizeBody('name').escape(),
    //process record
    (req, res, next) => {
        // get errors from validator
        const error = validationResult(req);
        // create genre object with escaped & trimmed data
        var genre = new Genre(
            {
                name: req.body.name,
                _id:req.params.id //need this or new id will be assigned.
            }
        );
        //check errors, render form again with errors
        if(!error.isEmpty()){
            res.render('genre_form', {title: 'Update Genre', genre: genre, error: error.array()});
        }else{
            // or no errors find genrebyid and try to update
            Genre.findByIdAndUpdate(req.params.id, genre, function(err, updatedGenre){
                if(err){ return next(err);}
                res.redirect(updatedGenre.url);
            });
        }
    }
];