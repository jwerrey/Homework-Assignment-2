var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

//container for the module 
var lib = {};


//get the base directory of the folder
lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = function(dir, file, data, callback) {

    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            //take the data and convert it to a string
            var stringData = JSON.stringify(data);

            //write to file nd close it
            fs.writeFile(fileDescriptor, stringData, function(err) {
                if (!err) {
                    fs.close(fileDescriptor, function(err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    });

                } else {
                    callback('Error writing to new file');
                }

            });
        } else {
            console.log(lib.baseDir + dir + '/' + file + '.json');
            //open the file for writing 
            callback('Could not create new file it may already exist');
        }
    });
};

//read data from a file note here the callback parameter is a function passed to read so callback is defined as a function by the original method call 
lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function(err, data) {
        if (!err && data) {

            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {

            callback(err, data);
        }
    });
};

lib.update = function(dir, file, data, callback) {


    //open the file for writing the flag r+ creates an error object if the file does not exist the error flag wx above creates  an error object if the file does exist
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {

            //convert the data to a string
            var stringData = JSON.stringify(data);
            console.log(stringData);
            fs.truncate(fileDescriptor, function(err) {
                if (!err) {
                    //write to the file and close it
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if (!err) {
                            console.log('file write was fine');
                            fs.close(fileDescriptor, function(err) {
                                if (!err) {
                                    console.log('file close was fine');
                                    callback(false);

                                } else {
                                    callback('There was an error closing the file');
                                }

                            });

                        } else {
                            callback('error writing to existing file');
                        }

                    });

                } else {
                    callback('Error truncating file');
                }

            });


        } else {
            callback('Could not open the file for updating, it may not exist yet');
        }

    });
};



lib.delete = function(dir, file, callback) {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err) {
        if (!err) {
            callback(false);
        } else {
            callback('Error Deleting the file');
        }

    });
};

//list all the files in a directory
lib.list = function(dir, callback) {
    fs.readdir(lib.baseDir + dir + '/', function(err, data) {
        if (!err && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(function(fileName) {
                trimmedFileNames.push(fileName.replace('.json', ''));
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    });

};


//export module
module.exports = lib;