// Author Schema
var mongoose = require('mongoose');
var moment = require('moment');

const authorSchema = new mongoose.Schema(
    {
        first_name: {type: String, required: true, max: 100},
        family_name: {type: String, required: true, max:100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date}
    }
);

// create fullname virtual
authorSchema.virtual('name').get(function() {
  return this.family_name + ', ' + this.first_name;
});

// create lifespan virtual
authorSchema.virtual('lifespan').get(function() {
    return this.date_of_death.getYear() - this.date_of_birth.getYear().toString();
});

// create URL virtual
authorSchema.virtual('url').get(function(){
    return 'catalog/author/' + this._id;
});

//format date of death & birth
authorSchema.virtual('dob').get(function(){
    return this.date_of_birth ? moment(this.date_of_birth).format('MMM-DD-YYYY') : '';
});

authorSchema.virtual('dod').get(function(){
    return this.date_of_death ? moment(this.date_of_death).format('MMM-DD-YYYY') : '';
});

module.exports = mongoose.model('Author', authorSchema);