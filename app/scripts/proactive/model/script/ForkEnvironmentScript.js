define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/script/Script',
        'proactive/config'
    ],

    function (Backbone, SchemaModel, Script, config) {

    "use strict";

    return Script("Script/environment", null, null, "An environment script written in Groovy, Ruby, Python and other languages supported by the JSR-223. Only java-compatible languages are supported. It can use the Java binding <u>forkEnvironment</u> to configure the forked Java Virtual Machine.")
})