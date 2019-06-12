exports.command = function (xpathCheck) {
    var self = this;
    
    this
        .openDropdown('#file-dropdown')
    	.moveToElement('#export-button', 0, 250)
    	.click('#export-button')
        .waitForElementVisible('.CodeMirror-code')
        
        .element("css selector", ".CodeMirror", function (codeMirrorElement) {
            self.execute(function (element) {
                return element.CodeMirror.getValue();
            }, [codeMirrorElement.value], function (codeMirrorTextContent) {
                var jobXml = codeMirrorTextContent.value;
                var xpath = require('xpath');
                var dom = require('xmldom').DOMParser;

                var select = xpath.useNamespaces({"p": "urn:proactive:jobdescriptor:3.11"});

                var jobXmlDocument = new dom().parseFromString(jobXml);

                if (typeof xpathCheck === "function") {
                    xpathCheck.call(self, select, jobXmlDocument);
                }
            });
        });
    return this;
};
