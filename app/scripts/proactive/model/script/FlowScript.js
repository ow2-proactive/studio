define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/script/Script',
        'proactive/config'
    ],

    function (Backbone, SchemaModel, Script, config) {

    "use strict";

    return Script("Script/flow", "Control Flow", "Script which configures the control-flow (branch to choose, number of replications, terminate or continue a loop)", "A flow script written in Groovy, Ruby, Python and other languages supported by the JSR-223. It must define one of the three bindings <u>branch</u>, <u>runs</u> or <u>loop</u>.")
})