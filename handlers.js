//dependencies
var fs = require('fs');
var path = require('path');
var _data = require('./data');
var helpers = require('./helpers');
var request = require('./request');

//create the handler container
var handlers = {};

handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'delete', 'put'];

    //check the data objects method property - which stored the method of request and compare it to the acceptable method type for the user handler
    if (acceptableMethods.indexOf(data.method) > -1) {
        //call the relevant handler passing in the data to be processed and the call back function to run
        handlers._users[data.method](data, callback);

    } else {
        callback(405);
    }
};

//container for users sub methods require fields are firstName lastName phone and password and a boolean tosAgreement
handlers._users = {};
//users post
handlers._users.post = function(data, callback) {

    //check that all of the required fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;

    if (firstName && lastName && address && password && email) {
        //make sure the user does not already exist
        _data.read('users', email, function(err, data) {

            if (err) {
                //user does not exist so create one and start with hashing the password
                var hashedPassword = helpers.hashing(password);

                if (hashedPassword) {

                    //create the user object
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'email': email,
                        'hashedPassword': hashedPassword,
                        'address': address
                    };

                    //Store the user 
                    _data.create('users', email, userObject, function(err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { 'Error': 'Could not create the user ' });
                        }
                    });
                } else {
                    callback(500, { 'Error': 'could not hash the password' });
                }
            } else {
                callback(400, { 'Error': 'A user with that phone number already exists' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

//users get
handlers._users.get = function(data, callback) {
    //required data phone optional data none
    //check that the phone number provided is valid
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.phone.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if (email) {
        //Get the token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        //verify that the given token from the headers is valid form the email
        handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
            if (tokenIsValid) {
                _data.read('users', email, function(err, data) {
                    if (!err && data) {
                        //remove the hashed password from the user object before returning it to the requester
                        delete data.hashedPassword;
                        callback(200, data);

                    } else {
                        callback(404);
                    }

                });

            } else {
                callback(403, { 'Error': 'Missing required header, or token is invalid' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing Required Field' });
    }
};
//users put
handlers._users.put = function(data, callback) {
    //check fir the required field 
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length == 10 ? data.payload.email.trim() : false;

    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

    var password = typeof(data.payload.password) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.password.trim() : false;

    if (email) {
        if (firstName || lastName || password) {
            //lookup user 
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
                if (tokenIsValid) {
                    _data.read('users', email, function(err, userData) {
                        console.log(phone);
                        if (!err && userData) {
                            //update the necessary fields
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            //store the new updates
                            _data.update('users', email, userData, function(err) {
                                if (!err) {
                                    callback(200);


                                } else {
                                    callback(500, { 'Error': 'Could not update the user' });

                                }
                            });

                        } else {
                            callback(400, { 'Error': 'The specified user does not exist' });
                        }

                    });

                } else {
                    callback(403, { 'Error': 'Missing required header, or token is invalid' });
                }
            });


        } else {
            callback(400, { 'Error': 'Missing fields to update' });
        }

    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};
//users delete
handlers._users.delete = function(data, callback) {
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if (email) {
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
            if (tokenIsValid) {
                _data.read('users', email, function(err, userData) {
                    if (!err && data) {
                        //remove the hashed password from the user object before returning it to the requester
                        _data.delete('users', email, function(err) {
                            if (!err) {
                                handlers._orders.delete(data, function(err) {
                                    if (!err) {
                                        console.log('Successful in deleting the orders for' + data.queryStringObject.email);
                                        handlers._tokens.delete(data, function(err) {
                                            if (!err) {
                                                console.log('Successful in deleting the orders for ' + data.queryStringObject.email);
                                            } else {
                                                console.log('Unable to delete tokens for user:' + data.queryStringObject.email)
                                            }
                                        });
                                    }
                                    console.log('Unable to delete orders for user:' + data.queryStringObject.email);
                                });
                            } else {
                                callback(500, { 'Error': 'could not delete the specified user' });
                            }
                        });
                        callback(200, data);

                    } else {
                        callback(400, { 'Error': 'could not find user' });
                    }
                });
            } else {
                callback(403, { 'Error': 'Missing required header, or token is invalid ' });
            }
        });

    } else {
        callback(400, { 'Error': 'Missing Required Field' });
    }
};


handlers.orders = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'delete'];

    //check the data objects method property- which stored the method of request and compare it to the acceptable method type for the user handler
    if (acceptableMethods.indexOf(data.method) > -1) {
        //call the relevant handler passing in the data to be processed and the call back function to run
        handlers._orders[data.method](data, callback);

    } else {
        callback(405);
    }
};


handlers._orders = {};

handlers._orders.get = function(data, callback) {
    //display the menu 
    callback(200, {
        'c-oldskool': {
            'toppings': ['tomato', 'pesto'],
            'price': '$7.99'
        },
        'javarano': {
            'toppings': ['cheese', 'tomatoes', 'oregano'],
            'price': '$8.99'
        },
        'nodeapoli': {
            'toppings': ['cheese', 'tomatoes', 'pineapple'],
            'price': '$9.99'
        },
        'rubyramo': {
            'toppings': ['cheese', 'bbq sauce', 'chicken'],
            'price': '$10.99'
        },
        'cheeseplusplus': {
            'toppings': ['cheese', ' smelly cheese', 'blue cheese', 'very smelly cheese'],
            'price': '$10.99'
        },
        'pirpleperfecto': {
            'toppings': ['cheese', 'bbq sauce', 'bacon', 'chilli', 'chicken'],
            'price': '$12.99'
        }

    });

};



handlers._orders.delete = function(data, callback) {
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if (email) {
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
            if (tokenIsValid) {

                _data.read('orders', email, function(err) {

                });

                _data.delete('orders', email, function(err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'There was a problem deleting your order' });
                    }
                });

            } else {
                callback(403, { 'Error': 'Invalid token' });
            }

        });
    } else {
        callback(400, { 'Error': 'Missing data fields for validation of user' });
    }
};

handlers._orders.post = function(data, callback) {
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if (email) {
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
            if (tokenIsValid) {

                var date = new Date();
                //create the order object
                var orderObject = {
                    'firstName': data.payload.firstName,
                    'lastName': data.payload.lastName,
                    'email': data.payload.email,
                    'address': data.payload.address,
                    'source': data.payload.source,
                    'currency': data.payload.currency,
                    'amount': data.payload.amount,
                    'order': data.payload.order,
                    'timestamp': date,
                    'description': data.payload.description
                };

                _data.create('orders', email, orderObject, function(err) {
                    if (!err) {
                        callback(200);

                        request.stripe(orderObject.amount, 'usd', orderObject.description, orderObject.source, function(err) {
                            if (err) {
                                callback(500, { 'Error': 'There was an error processing your payment' });
                            } else {

                                var message = 'Thank you for placing your order of ' + data.payload.order.toString() + ' with Pizza Code, it will be with you shortly';

                                request.mailgun(data.payload.email, 'Order Confirmation', message, function(err) {
                                    if (!err) {
                                        console.log('Email processed successfully');

                                    } else {
                                        console.log('Problem processing email' + err);
                                    }
                                });
                                callback(200, { 'Response': 'Thank you for placing your order of' + data.payload.order.toString() });
                            }

                        });
                    } else {
                        callback(500, { 'Error': 'Could not create the user ' });
                    }
                });
            } else {
                callback(405, { 'Error': 'Invalid token' });
            }
        });
    } else {
        callback(400, { 'Error': 'missing fields' });
    }

};

handlers._tokens = {};

handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'delete', 'put'];

    //check the data objects method property - which stored the method of request and compare it to the acceptable method type for the user handler
    if (acceptableMethods.indexOf(data.method) > -1) {
        //call the relevant handler passing in the data to be processed and the call back function to run
        handlers._tokens[data.method](data, callback);

    } else {
        callback(405);
    }
};

//sub methods for container
handlers._tokens.post = function(data, callback) {
    console.log(data.payload);

    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;


    if (email && password) {
        //look up user who matches that password
        _data.read('users', email, function(err, userData) {
            if (!err) {
                //hash the sent password and compare it to the password stored in the user object
                var hashedPassword = helpers.hashing(password);
                if (hashedPassword == userData.hashedPassword) {
                    //If valid create a new token with a random name valid for one hour
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'email': email,
                        'id': tokenId,
                        'expires': expires
                    };
                    _data.create('tokens', tokenId, tokenObject, function(err) {
                        if (!err) {
                            callback(200, tokenObject);

                        } else {
                            callback(500, { 'Error': 'Could not create a token' });
                        }
                    });

                } else {
                    callback(400, { 'Error': 'password did not match the specified users stored password' });
                }
            } else {
                callback(400, { 'Error': 'User not found' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

//sub methods for container
handlers._tokens.get = function(data, callback) {

    var id = typeof(data.queryStringObject['']) == 'string' && data.queryStringObject[''].trim().length == 20 ? data.queryStringObject[''].trim() : false;

    if (id) {
        _data.read('tokens', id, function(err, tokenData) {
            if (!err && tokenData) {

                callback(200, tokenData);

            } else {
                callback(404);
            }

        });

    } else {
        callback(400, { 'Error': 'Missing Required Field' });
    }

};

//verify if a given token ID is a current valid value for the suer we are checking against 
handlers._tokens.verifyToken = function(id, email, callback) {
    //lookup the token
    _data.read('tokens', id, function(err, tokenData) {
        if (!err && tokenData) {

            if (tokenData.email == email && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

//sub methods for container
handlers._tokens.delete = function(data, callback) {

    var id = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.trim().length == 20 ? data.queryStringObject.token.trim() : false;
    console.log(data.queryStringObject.token);
    if (id) {
        _data.read('tokens', id, function(err, data) {
            if (!err && data) {
                //remove the hashed password from the user object before returning it to the requester
                _data.delete('tokens', id, function(err) {
                    if (!err) {
                        callback(200, { 'Message': 'You Have successfully logged out' });
                    } else {
                        callback(500, { 'Error': 'could not delete the specified user' });
                    }

                });
                callback(200, data);

            } else {
                callback(400, { 'Error': 'could not find user' });
            }

        });

    } else {
        callback(400, { 'Error': 'Missing Required Field' });
    }

};


handlers.notFound = function(data, callback) {
    callback(404);
};

handlers.admin = {};

handlers.admin = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'delete'];

    //check the data objects method property- which stored the method of request and compare it to the acceptable method type for the user handler
    if (acceptableMethods.indexOf(data.method) > -1) {
        //call the relevant handler passing in the data to be processed and the call back function to run
        handlers.admin[data.method](data, callback);

    } else {
        callback(405);
    }
};






module.exports = handlers;