Template = {
    templates:{},

    loadTemplate:function (name) {

        var that = this;
        console.log('Loading template: ' + name);
        $.ajax({
            type: "GET",
            url: 'js/proactive/templates/' + name + ".html",
            async: false,
            success: function (data) {
                that.templates[name] = data;
            },
            error: function (data) {
                console.log("Cannot load template " + name, data)
            }
        });
    },

    get:function (name) {
        if (!this.templates[name]) {
            this.loadTemplate(name);
        }
        return this.templates[name];
    }
}
