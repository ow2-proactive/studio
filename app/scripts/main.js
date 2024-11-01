/* global require */
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
            deps: [
                'jquery'
            ]
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
        'jquery.ui.touch-punch': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.mouse',
                'jquery.ui.widget'
            ]
        },
        'pnotify.buttons': {
            deps: [
                'pnotify'
            ]
        },
        backboneFormsAdapter: {
            deps: [
                'backbone-forms'
            ]
        }
    },
    packages: [{
        name: "codemirror",
        location: "../libs/codemirror",
        main: "lib/codemirror"
      }],
    paths: {
        jquery: '../libs/jquery/jquery',
        'jquery.ui.core': '../libs/jquery-ui/ui/jquery.ui.core',
        'jquery.ui.mouse': '../libs/jquery-ui/ui/jquery.ui.mouse',
        'jquery.ui.draggable': '../libs/jquery-ui/ui/jquery.ui.draggable',
        'jquery.ui.widget': '../libs/jquery-ui/ui/jquery.ui.widget',
        'jquery.ui.droppable': '../libs/jquery-ui/ui/jquery.ui.droppable',
        'jquery.ui.touch-punch': '../libs/jquery-ui-touch-punch/jquery.ui.touch-punch',
        backbone: '../libs/backbone/backbone',
        'backbone-forms': '../libs/backbone-forms/distribution.amd/backbone-forms',
        list: '../libs/backbone-forms/distribution.amd/editors/list',
        backboneFormsAdapter: '../libs/backbone.bootstrap-modal/src/backbone.bootstrap-modal',
        underscore: '../libs/underscore/underscore',
        bootstrap: '../libs/bootstrap/js/bootstrap',
        vkbeautify: '../libs/vkbeautify.0.99.00.beta/index',
        dagre: '../libs/dagre/index',
        text: '../libs/requirejs-text/text',
        'pnotify': '../libs/pnotify/dist/pnotify',
        'pnotify.buttons': '../libs/pnotify/dist/pnotify.buttons',
        fileSaver: '../libs/FileSaver/FileSaver',
        jsplumb: '../libs/jsplumb/dist/js/jquery.jsPlumb-1.7.2-min',
        filesaver: '../libs/FileSaver/FileSaver',
        xml2json: 'thirdparties/xml2json',
        autoComplete: '../libs/autocomplete/autoComplete.min',
        Showdown:'../libs/showdown/dist/showdown.min',

        StudioApp: 'proactive/app'
    }
});

require(['StudioApp'],
    function (StudioApp) {
        StudioApp.init();
    }
);
