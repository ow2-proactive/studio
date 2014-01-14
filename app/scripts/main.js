/*global require*/
'use strict';

require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/jquery',
        jqueryUI: '../bower_components/jquery-ui/ui/jquery-ui',
        backbone: '../bower_components/backbone/backbone',
        backboneForms: '../bower_components/backbone-forms/distribution.amd/backbone-forms',
        backboneFormsEditor: '../bower_components/backbone-forms/distribution/editors/list',
        backboneFormsAdapter: '../bower_components/backbone-forms/distribution/adapters/backbone.bootstrap-modal',
        underscore: '../bower_components/underscore/underscore',
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
        vkbeautify: '../bower_components/vkbeautify.0.99.00.beta/index',
        dagre: '../bower_components/dagre/index',
        text : '../bower_components/requirejs-text/text',
        pnotify : '../bower_components/pines-notify/jquery.pnotify',
        fileSaver : '../bower_components/FileSaver/FileSaver',
        codemirror: '../bower_components/codemirror/lib/codemirror',
        jsplumb : '../bower_components/jsplumb/dist/js/jquery.jsPlumb-1.5.5',
        xml2json: 'thirdparties/xml2json',
//        XRegExp: '../bower_components/syntaxhighlighter/scripts/XRegExp',
//        shCore: '../bower_components/syntaxhighlighter/scripts/shCore',
//        shBrushXml: '../bower_components/syntaxhighlighter/scripts/shBrushXml',
//        shBrushJScript: '../bower_components/syntaxhighlighter/scripts/shBrushJScript',

        StudioApp: 'proactive/app'
    }
});

// right order for backbone forms
// TODO find a way to do it better
require(['underscore', 'backbone'], function() {
    require(['backboneForms'], function(c,d) {
        require(['backboneFormsEditor', 'backboneFormsAdapter'],function() {
            require(['StudioApp'],

                function(StudioApp) {
                    StudioApp.init()
                }

            );
        })
    })
})

