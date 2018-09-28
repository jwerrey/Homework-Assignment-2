//route file 
//primary file for the api
var server = require('./lib/server');



//declare the app container
var app = {};

//init function  which initiates the server object adn the workers object
app.init = function() {
    //start the server 
    server.init();

};

//start the app
app.init();

module.exports = app;