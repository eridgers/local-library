// Bookinstance Schema
var mongoose = require('mongoose');

bookInstanceSchema = new mongoose.Schema(
    {
        book: [{type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true}],
        imprint: {type: String, required: true},
        status: {type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], 
                default: 'Mainteance'},
        due_back: {type: Date, default: Date.now()}
    }
);

// create url virtual
bookInstanceSchema.virtual('url').get( () => '/catalog/bookinstance/' + this._id);

module.exports = mongoose.model('BookInstance', bookInstanceSchema);