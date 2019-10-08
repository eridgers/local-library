var Author = require('../models/author');
var async = require('async');
var Book = require('../models/book');
const {body, validationResult} = require('express-validator');
const {sanitizeBody} = require('express-validator');


// Display list of all Authors
exports.author_list = function(req, res, next) {
    Author.find().sort('family_name').exec(function(err, authors){
        if (err) {return next(err);}
        res.render('author_list', {title: 'Author List', authors: authors});
    });
};

// Display detail page for a specific Author
exports.author_detail = function(req, res, next){
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback){
            Book.find({'author': req.params.id}, 'title summary').exec(callback)
        },
    }, function(err, results){
        if(err) {return next(err);}
        if(results.author == null){
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('author_detail', {title: 'Author Detail', author: results.author, authors_books: results.authors_books});
    });
};

// Display Author create form on GET
exports.author_create_get = function(req, res){
    res.render('author_form', {title: 'Create Author'});
};

// Handle Author create on POST
exports.author_create_post = [
    //validate fields
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601(),
    // sanitize fields
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),
    // process request after validation and sanitization
    (req, res, next) =>{
        //get validation errors
        const errors = validationResult(req);
        
        if(!errors.isEmpty()){
            // errors, render form again with data and errors
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array()});
            return;
        }
        else{
            // data valid, create author with escaped, trimmed data
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                });
            author.save(function(err){
                if(err) {return next(err);}
                // success redirect to created author
                res.redirect(author.url);
            });
        }
    }
];

// Display Author delete form on GET
exports.author_delete_get = function(req, res){
    res.send('NOT IMPLEMENTED: Author delete GET');
};

// Handle Author delete on POST
exports.author_delete_post = function(req, res){
    res.send('NOT IMPLEMENTED: Author delete POST');
};

// Display Author update form on GET
exports.author_update_get = function(req, res){
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update form on POST
exports.author_update_post = function(req, res){
    res.send('NOT IMPLEMENTED: Author update POST');
};