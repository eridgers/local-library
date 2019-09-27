// Author Schema
var mongoose = require('mongoose');

const authorSchema = new mongoose.Schema(
    {
        first_name: {type: String, required: true, max: 100},
        family_name: {type: String, required: true, max:100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date}
    }
);

// create fullname virtual
authorSchema.virtual('name').get( () => this.first_name + ' ' + this.family_name);

// create lifespan virtual
authorSchema.virtual('lifespan').get( () => this.date_of_death.getYear() - this.date_of_birth.getYear().toString());

// create URL virtual
authorSchema.virtual('url').get( () => 'catalog/author/' + this._id);

module.exports = mongoose.model('Author', authorSchema);