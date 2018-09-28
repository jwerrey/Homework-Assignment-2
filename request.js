var config = require('./config');
var querystring = require('querystring');
var https = require("https");

//Container for all the request objects
var request = {};

// Payment request by stripe API
request.stripe = function(amount, currency, description, source, callback) {
    console.log('stripe api called');
    // Configure the request payload
    var payload = {
        'amount': amount,
        'currency': currency,
        'description': description,
        'source': source,
    };

    // Stringify the payload as a query string
    var stringPayload = querystring.stringify(payload);

    // Configure the request details
    var requestDetails = {
        'protocol': 'https:',
        'hostname': 'api.stripe.com',
        'method': 'POST',
        'auth': config.stripe.secretKey,
        'path': '/v1/charges',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
        }
    };

    // Instantiate the request object
    var req = https.request(requestDetails, function(res) {
        // Grab the status of the sent request
        var status = res.statusCode;
        // Callback successfully if the request went through
        if (status == 200 || status == 201) {
            console.log('stripe was successful');
            callback(false);

        } else {
            console.log('stripe was not successful');
            callback('Status code return was ' + status);

        }
    });

    // Bind to the error event so it doesn't get the thrown
    req.on('error', function(e) {
        callback('there was a problem');
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
};

// Mailgun API request
request.mailgun = function(to, subject, text, callback) {
    // Configure the request payload
    // var payload = {
    //     'from': config.mailgun.sender,
    //     'to': to,
    //     'subject': subject,
    //     'text': text
    // }

    var payload = {
        from: config.mailgun.sender,
        to: 'jwe1981@gmail.com',
        subject: 'order details',
        text: 'Your order has been successful'
    };

    // Stringify the payload
    var stringPayload = querystring.stringify(payload);

    // Configure the request details

    var requestDetails = {
        auth: config.mailgun.mailGunApiKey,
        protocol: 'https:',
        hostname: 'api.mailgun.net',
        method: 'POST',
        path: '/v3/' + config.mailgun.domainName + '/messages',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    // Instantiate the request object
    var req = https.request(requestDetails, function(res) {
        // Grab the status of the sent request

        var data = '';
        // A chunk of data has been recieved.
        res.on('data', (chunk) => {
            data += chunk;
        });
        // The whole response has been received. Print out the result.
        res.on('end', () => {
            console.log;
        });


        var status = res.statusCode;


        if (status == 200 || status == 201) {
            console.log('mailgun was successful');
            callback(false);

        } else {
            console.log('mailgun was not successful');
            callback('Status code return was ' + status);

        }
    });

    // Bind to the error event so it doesn't get the thrown
    req.on('error', function(e) {
        callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();


};
// Export the module
module.exports = request;