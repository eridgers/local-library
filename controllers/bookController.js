var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
var async = require('async');
const {sanitizeBody} = require('express-validator');
const {body, validationResult} = require('express-validator');

exports.index = function(req, res) {
    async.parallel({
        book_count: function(callback){
            Book.countDocuments({}, callback);  // pass empty object as match condition to find all docs in collections
        },
        book_instance_count: function(callback){
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback){
            BookInstance.countDocuments({status: 'Available'}, callback);
        },
        author_count: function(callback){
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback){
            Genre.countDocuments({}, callback);
        }
    }, function(err, results){
        res.render('index', {title: 'Local Library Home', error: err, data: results});
    });
};

// Display list of all books.
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author').populate('author').exec(function(err, books){
        if(err){
            return next(err);
        }
        res.render('book_list', {title: 'Book List', books: books});
        });
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        book_instance: function(callback){
            BookInstance.find({'book': req.params.id}).exec(callback);
        },
    }, function(err, results){
        if(err) {return next(err);}
        if(results.book == null){
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_detail', {title: results.book.title, book: results.book, books: results.book_instance});
    });
};

// Display book create form on GET.
exports.book_create_get = function(req, res) {
    // get all authors and genres so we can use them to add our book
    async.parallel({
        authors: function(callback){
            Author.find(callback);
        },
        genres: function(callback){
            Genre.find(callback);
        },
    }, function(err, results){
        if(err) {return next(err);}
        res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres});
    });
};

// Handle book create on POST.
exports.book_create_post = [
    // convert genre to array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre==='undefined'){
                req.body.genre = [];
            }else{
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    // field validation
    body('title', 'Title must not be empty').isLength({min: 1}).trim(),
    body('author', 'Author must not be empty').isLength({min: 1}).trim(),
    body('summary', 'Summary must not be empty').isLength({min: 1}).trim(),
    body('isbn', 'ISBN must not be empty').isLength({min: 1}).trim(),
    // sanitize fields using * wildcard
    sanitizeBody('*').escape(),
    //process request
    (req, res, next) => {
        // get validation errors
        const errors = validationResult(req);
        // create book with escaped/trimmed data
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            }
        );
        if(!errors.isEmpty()){
            //errors so render form again
            async.parallel({
                authors: function(calback){
                    Author.find(callback);
                },
                genres: function(callback){
                    Genre.find(callback);
                },
            }, function(err, results){
                if(err) {return next(err);}
                // mark selected genres as check
                for(let i = 0; i < results.genres.length; i++){
                    if(book.genre.indexOf(results.genres[i]._id) > -1){
                        // current genre is selected set 'checked' flag
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()});
            });
        }else{
            //data valid save bok
            book.save(function (err){
                if(err) {return next(err);}
                res.redirect(book.url);
            });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update GET');
};

// Handle book update on POST.
exports.book_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update POST');
};