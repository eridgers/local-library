// Bookinstance Schema
var mongoose = require('mongoose');
var moment =  require('moment');

bookInstanceSchema = new mongoose.Schema(
    {
        book: {type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true},
        imprint: {type: String, required: true},
        status: {type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], 
                default: 'Maintenance'},
        due_back: {type: Date, default: Date.now()}
    }
);

// create url virtual
bookInstanceSchema.virtual('url').get(function(){
    return '/catalog/bookinstance/' + this._id;
});

// formatted due date virtual
bookInstanceSchema.virtual('due_back_formatted').get(function(){
    return moment(this.due_back).format('MMMM Do, YYYY');
});

module.exports = mongoose.model('BookInstance', bookInstanceSchema);