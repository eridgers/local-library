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
    res.send('NOT IMPLEMENTED: Genre create GET');
};

// Handle Genre create on POST.
exports.genre_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre create POST');
};

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};