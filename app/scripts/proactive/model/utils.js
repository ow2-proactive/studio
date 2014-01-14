define(function (require) {

    return {
        inlineName: function(prop) {
            var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
            return name;
        }
    }
})