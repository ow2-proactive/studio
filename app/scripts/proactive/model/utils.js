define(function (require) {

    return {
        inlineName: function(prop) {
            var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
            return name;
        },
        inlineNameValue: function(prop) {
            return "<div class='inlined'>" + prop['Name'] + "</div><div class='inlined'>" + prop["Value"] + "</div>";
        }
    }
})