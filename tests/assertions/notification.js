var util = require('util');
exports.assertion = function(expectedText, msg) {

  var MSG_ELEMENT_NOT_FOUND = 'Testing if tooltip contains title: "%s". ' +
      'Element could not be located.';

    this.message = msg || util.format('Testing if tooltip contains title: "%s".', expectedText);

    this.expected = function() {
      return expectedText;
    };

    this.pass = function(value) {
      return value.indexOf(expectedText) > -1;
    };

    this.failure = function(result) {
      var failed = result === false || result && result.status === -1;
      if (failed) {
        this.message = msg || util.format(MSG_ELEMENT_NOT_FOUND, expectedText);
      }
      return failed;
    };

    this.value = function(result) {
      return result.value;
    };

    this.command = function(callback) {
      this.api.waitForElementVisible('.ui-pnotify-title', 1000)
      return this.api.getText('.ui-pnotify-title', callback)
    };

};