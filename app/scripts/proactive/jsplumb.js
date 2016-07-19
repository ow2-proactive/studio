/* global define */

define(
    [
        'jquery',
        'backbone',
        'jsplumb'
    ],

    function ($, Backbone, jsPlumb) {

        'use strict';

        var color = 'gray';

        jsPlumb.importDefaults({
            // notice the 'curviness' argument to this Bezier curve.  the curves on this page are far smoother
            // than the curves on the first demo, which use the default curviness value.
            Connector: ['Bezier', {curviness: 50}],
            DragOptions: {cursor: 'pointer', zIndex: 2000},
            PaintStyle: {strokeStyle: color, lineWidth: 2},
            EndpointStyle: {radius: 9, fillStyle: color},
            HoverPaintStyle: {strokeStyle: '#ec9f2e'},
            EndpointHoverStyle: {fillStyle: '#ec9f2e'},
            Anchors: ['BottomCenter', 'TopCenter']
        });

        $('.workflow-view').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });

        $('#project-name').click(function () {
            $('.job-view').click();
        });
    });
