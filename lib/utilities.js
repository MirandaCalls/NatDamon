var path = require('path');
var fs = require('fs');
var promisify = require('util').promisify;

var readFileAsync = promisify(fs.readFile);

async function printCliTitle() {
    var logo = (await readFileAsync(path.join(__dirname, '../logo.txt'))).toString();
    console.log(logo);
    console.log("Version 1.0");
    console.log();
}

function logMessage(text) {
    var now = new Date();
    var logtime = now.toLocaleDateString('en-us', {
        dateStyle: 'short'
    }) + ' ' + now.toLocaleTimeString('en-us');
    console.log(logtime + ': ' + text);
};

module.exports = {
    printCliTitle: printCliTitle,
    logMessage: logMessage
};