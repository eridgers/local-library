var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var async = require('async');
const {body, validationResult, sanitizeBody} = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find().populate('book').exec(function(err, books){
        if(err){return next(err);}
        res.render('bookinstance_list', {title: 'Book Instance List', books: books});
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
    BookInstance.findById(req.params.id).populate('book').exec(function(err, bookinstance){
        if(err) {return next(err);}
        if(bookinstance == null){
            var err = new Error('Book copy not found');
            err.status = 404
            return next(err);
        }
        res.render('bookinstance_detail', {title: 'Copy of ' + bookinstance.book.title, bookinstance: bookinstance});
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title').exec(function(err, books){
        if(err) {return next(err)};
        res.render('bookinstance_form', {title: 'Create Copy', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // valid fields
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min: 1}).trim(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),
    // sanitize fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    // process request
    (req, res, next) => {
        // get errors
        const errors = validationResult(req);
        // create bookinstance
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });
        if(!errors.isEmpty()){
            // errors, render form again
            Book.find({}, 'title').exec(function(err, books){
                if(err) {return next(err);}
                res.render('bookinstance_form', {title: 'Create Copy', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
            });
            return;
        }else{
            //data valid
            bookinstance.save(function(err){
                if(err) {return next(err);}
                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    // get bookinstance, populate book
    BookInstance.findById(req.params.id).populate('book').exec(function(err, bookinstance){
        if(err) {return next(err);}
        if (bookinstance==null) { // No results.
            res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_delete', {title: 'Delete Copy', bookinstance: bookinstance});
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    // get instance, populate book
    BookInstance.findByIdAndRemove(req.body.id, function deleteBookInstance(err){
        if(err) {return next(err);}
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next){
    // get bookinstance by id populate book
    async.parallel({
        bookinstance: function(callback){
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },
        books: function(callback){
            Book.find(callback)
        },
    }, function(err, results){
        if(err) {return next(err);}
        if(results.bookinstance==null){
            var err = new Error('Book Instance not found');
            err.staus = '404';
            return next(err);
        }
        // res.render('bookinstance_form', {title: 'Update Book Instance', bookinstance: bookinstance, selected_book: bookinstance.book._id});
        res.render('bookinstance_form', { title: 'Update  BookInstance', book_list : results.books, selected_book : results.bookinstance.book._id, bookinstance: results.bookinstance });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // validate
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min: 1}).trim(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),
    // sanitize fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    // pop errors
    (req, res, next) => {
        const errors = validationResult(req);
        // create bookinstance
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });
        // check errors
        if(!errors.isEmpty()){
            // errors so render form
            Book.find({},'title').exec(function(err, books){
                if(err) {return next(err);}
                res.render('bookinstance_form', {title: 'Update Book Instance',  book_list : books, bookinstance: bookinstance, selected_book: bookinstance.book._id, errors: errors.array()});
            });
            return;
        }else{
            //data good so update
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, updatedCopy){
                if(err) {return next(err);}
                res.redirect(updatedCopy.url);
            });
        }
    }
]