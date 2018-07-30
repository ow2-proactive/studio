define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/script/Script'
    ],

    function (Backbone, SchemaModel, Script) {

    "use strict";

    return Script("Script/task", null, null, "A task script written in Groovy, Ruby, Python and other languages supported by the JSR-223. Define the binding <u>result</u> to return an object accessible from dependent tasks.");
})
