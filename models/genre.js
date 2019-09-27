// Genre Schema
var mongoose = require('mongoose');

const genreSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, min: 3, max: 100}
    }
);

// create url virtual
genreSchema.virtual('url').get(function(){
    return '/catalog/genre/' + this._id;
});

module.exports = mongoose.model('Genre', genreSchema);
