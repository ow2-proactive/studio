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
        jsplumb: {
            deps: [
                'jquery'
            ]
        },
        jqueryUI: {
            deps: [
                'jquery'
            ]
        },
        pnotify: {
            deps: [
                'jquery'
            ]
        },
        backboneFormsAdapter: {
            deps: [
                'backbone-forms'
            ]
        },
        codemirror: {
            exports: "CodeMirror"
        },
        codemirrorJs: { deps: [ 'codemirror' ]},
        codemirrorXml: { deps: [ 'codemirror' ]},
        codemirrorComment: { deps: [ 'codemirror' ]},
        codemirrorMB: { deps: [ 'codemirror' ]}
    },
    paths: {
        jquery: '../libs/jquery/jquery',
        jqueryUI: '../libs/jquery-ui/ui/jquery-ui',
        backbone: '../libs/backbone/backbone',
        'backbone-forms': '../libs/backbone-forms/distribution.amd/backbone-forms',
        list: '../libs/backbone-forms/distribution.amd/editors/list',
        backboneFormsAdapter: '../libs/backbone.bootstrap-modal/src/backbone.bootstrap-modal',
        underscore: '../libs/underscore/underscore',
        bootstrap: '../libs/bootstrap/dist/js/bootstrap',
        vkbeautify: '../libs/vkbeautify.0.99.00.beta/index',
        dagre: '../libs/dagre/index',
        text : '../libs/requirejs-text/text',
        pnotify : '../libs/pines-notify/jquery.pnotify',
        fileSaver : '../libs/FileSaver/FileSaver',
        codemirror: '../libs/codemirror/lib/codemirror',
        codemirrorJs: '../libs/codemirror/mode/javascript/javascript',
        codemirrorXml: '../libs/codemirror/mode/xml/xml',
        codemirrorComment: '../libs/codemirror/addon/comment/comment',
        codemirrorMB: '../libs/codemirror/addon/edit/matchbrackets',
        jsplumb : '../libs/jsplumb/dist/js/jquery.jsPlumb-1.5.5',
        filesaver: '../libs/FileSaver/FileSaver',
        xml2json: 'thirdparties/xml2json',

        StudioApp: 'proactive/app'
    }
});

require(['StudioApp'],
    function (StudioApp) {
        StudioApp.init();
    }
);
