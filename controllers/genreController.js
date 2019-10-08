var Genre = require('../models/genre');
var async = require('async');
var Book = require('../models/book');
var mongoose = require('mongoose');
const validator = require('express-validator');

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
    validator.body('name', 'Genre name required').isLength({min: 1}).trim(),
    // santize (escape) name field
    validator.sanitizeBody('name').escape(),
    // process request after validation and sanitization
    (req, res, next) => {
        // get errors from request
        const errors = validator.validationResult(req);
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
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};