const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/TaskManager', { userNewUrlParser: true }).then(() => {
    console.log("Connected to mongodb succesfully");
}).catch((e) => {
    console.log("Error while attempting to connect to MongoDB");
    console.log(e);
})

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

module.exports = {
    mongoose
};