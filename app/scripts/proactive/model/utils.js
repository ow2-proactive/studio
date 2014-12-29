define(function (require) {

    return {
        inlineName: function(prop) {
            var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
            return name;
        },
        inlineNameValue: function(prop) {
            return prop['Name']+": " + prop["Value"];
        }
    }
})