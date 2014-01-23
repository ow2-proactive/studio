var fs = require('fs');

var testSelector = "#palette-container";

var tmpfile = phantom.args[0];
var url = phantom.args[1];


var sendMessage = function(arg) {
    var args = Array.isArray(arg) ? arg : [].slice.call(arguments);
    last = new Date();
    fs.write(tmpfile, JSON.stringify(args) + '\n', 'a');
};

function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    sendMessage('test.fail', 'Could not load page, check manually');
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};

var page = require('webpage').create();

page.open(url, function (status) {
    // Check for page load success
    if (status !== "success") {
        console.log("Unable to access network at " + url);
        sendMessage('test.fail', 'Unable to access page (' + url + ', is connect:test running?');
    } else {
        // Wait for 'signin-dropdown' to be visible
        waitFor(function() {
            // Check in the page if a specific element is now visible
            return page.evaluate(function() {
                return $(testSelector).is(":visible");
            });
        }, function() {
            console.log("The page is displayed properly");
            sendMessage('test.ok', 'Page displayed properly');
            phantom.exit(0);
        });
    }
});
