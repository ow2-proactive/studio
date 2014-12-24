exports.command = function (xpathCheck) {
    var self = this;

    this
        .click('#export-button')
        .waitForElementVisible('.CodeMirror-code')

        .element("css selector", ".CodeMirror", function (codeMirrorElement) {
            self.execute(function (data) {
                return arguments[0].CodeMirror.getValue();
            }, [codeMirrorElement.value], function (codeMirrorTextContent) {
                var jobXml = codeMirrorTextContent.value
                var xpath = require('xpath')
                    , dom = require('xmldom').DOMParser

                var jobXmlDocument = new dom().parseFromString(jobXml)

                if (typeof xpathCheck === "function") {
                    xpathCheck.call(self, xpath, jobXmlDocument);
                }

            });
        })

    return this;
};
