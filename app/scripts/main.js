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
        // only pick jquery droppable to avoid conflict between bootstrap and jqueryui tooltip
        // http://stackoverflow.com/questions/13731400/jqueryui-tooltips-are-competing-with-twitter-bootstrap
        'jquery.ui.core': {
            deps: ['jquery']
        },
        'jquery.ui.mouse': {
            deps: ['jquery.ui.widget']
        },
        'jquery.ui.widget': {
            deps: ['jquery']
        },
        'jquery.ui.draggable': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.mouse',
                'jquery.ui.widget'
            ]
        },
        'jquery.ui.droppable': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.mouse',
                'jquery.ui.widget',
                'jquery.ui.draggable'
            ]
        },
        'pnotify.buttons': {
            deps: [
                'pnotify.core'
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
        'jquery.ui.core': '../libs/jquery-ui/ui/jquery.ui.core',
        'jquery.ui.mouse': '../libs/jquery-ui/ui/jquery.ui.mouse',
        'jquery.ui.draggable': '../libs/jquery-ui/ui/jquery.ui.draggable',
        'jquery.ui.widget': '../libs/jquery-ui/ui/jquery.ui.widget',
        'jquery.ui.droppable': '../libs/jquery-ui/ui/jquery.ui.droppable',
        backbone: '../libs/backbone/backbone',
        'backbone-forms': '../libs/backbone-forms/distribution.amd/backbone-forms',
        list: '../libs/backbone-forms/distribution.amd/editors/list',
        backboneFormsAdapter: '../libs/backbone.bootstrap-modal/src/backbone.bootstrap-modal',
        underscore: '../libs/underscore/underscore',
        bootstrap: '../libs/bootstrap/dist/js/bootstrap',
        vkbeautify: '../libs/vkbeautify.0.99.00.beta/index',
        dagre: '../libs/dagre/index',
        text: '../libs/requirejs-text/text',
        'pnotify.core': '../libs/pnotify/pnotify.core',
        'pnotify.buttons': '../libs/pnotify/pnotify.buttons',
        fileSaver: '../libs/FileSaver/FileSaver',
        codemirror: '../libs/codemirror/lib/codemirror',
        codemirrorJs: '../libs/codemirror/mode/javascript/javascript',
        codemirrorXml: '../libs/codemirror/mode/xml/xml',
        codemirrorComment: '../libs/codemirror/addon/comment/comment',
        codemirrorMB: '../libs/codemirror/addon/edit/matchbrackets',
        jsplumb: '../libs/jsplumb/dist/js/jquery.jsPlumb-1.5.5',
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
