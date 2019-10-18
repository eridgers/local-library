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
exports.book_delete_get = function(req, res, next) {
// use async to get book, book instances
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback)
        },
        book_instance: function(callback){
            BookInstance.find({'book': req.params.id}).exec(callback)
        },
    }, function(err, results){// check errors
        if(err) {return next(err);}
        // render list page if no results else render delete
        if(results.book==null){
            res.redirect('/catalog/books')
        }
        res.render('book_delete', {title: 'Delete Book', book: results.book, books: results.book_instance});
    });
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
// use async to get book, book instances
    async.parallel({
        book: function(callback){
            Book.findById(req.body.id).populate('author').populate('genre').exec(callback)
        },
        book_instance: function(callback){
            BookInstance.find({'book': req.body.id}).exec(callback)
        },
    }, function(err, results){
        // check erors
        if(err) {return next(err);}
        // check if book instances exist, render book delete if so
        if(results.book_instance.length > 0){
            res.redirect('book_delete', {title: 'Delete Book', book: results.book, books: results.book_instance});
        }else{
            // else delete dat book, render books list after
            Book.findByIdAndRemove(req.body.id, function deleteBook(err){
                if(err) {return next(err);}
                res.redirect('/catalog/books');
            });
        }
    });
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
    // get book, authors and genres for form
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback)
        },
        authors: function(callback){
            Author.find(callback); //finds all
        },
        genres: function(callback){
            Genre.find(callback); //finds all
        },
    }, function(err, results){
        if(err) {return next(err);}
        if(results.book==null){
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        //success, mark select genres as checked
        for(var i = 0; i < results.genres.length; i++){
            for(var j = 0; j < results.book.genre.length; j++){
                // loop through all genres and tick box if genre is returned against book results
                if(results.genres[i]._id.toString()==results.book.genre[j]._id.toString()){
                    results.genres[i].checked='true';
                }
            }
        }
        res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book});
    });
};

// Handle book update on POST.
exports.book_update_post = [
    //convert genre to array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined'){
                req.body.genre = [];
            }else{
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    // validate fields
    body('title', 'Title must not be empty').isLength({min: 1}).trim(),
    body('author', 'Author must not be empty').isLength({min: 1}).trim(),
    body('summary', 'Summary must not be empty').isLength({min: 1}).trim(),
    body('isbn', 'ISBN must not be empty').isLength({min: 1}).trim(),
    //sanititze
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),
    //process request after validate and sanitize
    (req, res, next) => {
        //get errors from request
        const errors = validationResult(req);
        //create book
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
                _id:req.params.id //need this or new id will be assigned.
            });
        if(!errors.isEmpty()){
            //errors render form again
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback){
                    Genre.find(callback);
                },                
            }, function(err, results){
                if(err) {return next(err);}
                //check(tick) selected genres
                for(let i = 0; i < results.genre.length; i++){
                    if(book.genre.indexOf(results.genres[i]._id) > -1){
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.Array()});
            });
            return;
        }else{
            //data valid update record
            Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook){
                if(err) {return next(err);}
                // go to newly created book
                res.redirect(thebook.url);
            });
        }
    }
];

