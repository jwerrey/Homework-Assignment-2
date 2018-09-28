var http = require('http');
var https = require('https');
var url = require('url');
var config = require('./config');
var StringDecoder = require('string_decoder').StringDecoder;
//stores the handlers object
var handlers = require('./handlers');
var helpers = require('./helpers');

//create the server container which will be exported via the module.exports at the end of the file
var server = {};

server.init = function() {
    //the request object and response object are new for every single incoming request
    var server = http.createServer(function(req, res) {

        //setting the final parameter to true means that by default and query string parameters in the URL will be parsed as well 
        var parsedUrl = url.parse(req.url, true);
        var path = parsedUrl.pathname;
        //removes the unnecessary slashes from the url
        var trimmedPath = path.replace(/^\/+|\/+$/g, '');

        //Get the query string as an object
        var queryStringObject = parsedUrl.query;

        var method = req.method.toLowerCase();

        //get the headers as an object
        var headers = req.headers;

        //Create a decoder object which is a read and write stream and have it read
        //from the data stream object on each data event and pipe it to the buffer and include
        //the end event to tell it to complete the piping tot he buffer object
        var decoder = new StringDecoder('utf-8');
        var buffer = '';
        //this is where the content of the body if there is any sent by the user 
        req.on('data', function(data) {
            buffer += decoder.write(data);
        });
        req.on('end', function() {
            buffer += decoder.end();

            //choose the handler this request should got to if one is not found use the not found handler
            var chosenHandler = typeof(router[trimmedPath]) !== undefined ? router[trimmedPath] : handlers.notFound;


            //construct the data object to send to the handler from the users request
            var data = {
                'trimmedPath': trimmedPath,
                'queryStringObject': queryStringObject,
                'method': method,
                'headers': headers,
                'payload': helpers.parseJsonToObject(buffer)
            };



            //route the request to the handler specified in the router
            chosenHandler(data, function(statusCode, payload) {
                //use the status code called back by handler or default to 200
                statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
                //ue the payload called back by the handler or an empty object by default
                payload = typeof(payload) == 'object' ? payload : {};
                //convert the body of the data from the client request to a a JSON string 
                var payloadString = JSON.stringify(payload);
                //return the response
                //send a response to the client and log the payload that the client sent as a console .log

                res.writeHead(statusCode);
                res.end(payloadString);

                //log the response we are sending to the client in the console so we can see it server side
                res.on('data', function(chunk) {
                    console.log(chunk);
                });
            });
        });
    });

    server.listen(config.httpPort, function() {
        console.log('The server is listening on port ' + config.httpPort);
    });
};

var router = {
    'signUp': handlers.users,
    'signIn': handlers.users,
    'tokens': handlers.tokens,
    'order': handlers.orders,
    'admin': handlers.admin
};

module.exports = server;