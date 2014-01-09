/*
 *  This file contains the JS that handles the first init of jsPlumb library
 */
(function () {
    var color = "gray";

    jsPlumb.importDefaults({
        // notice the 'curviness' argument to this Bezier curve.  the curves on this page are far smoother
        // than the curves on the first demo, which use the default curviness value.
        Connector: [ "Bezier", { curviness: 50 } ],
        DragOptions: { cursor: "pointer", zIndex: 2000 },
        PaintStyle: { strokeStyle: color, lineWidth: 2 },
        EndpointStyle: { radius: 9, fillStyle: color },
        HoverPaintStyle: {strokeStyle: "#ec9f2e" },
        EndpointHoverStyle: {fillStyle: "#ec9f2e" },
        Anchors: [ "BottomCenter", "TopCenter" ]
    });

    jsPlumb.bind("ready", function () {
        console.log("JsPlumb is ready");
        // render mode
        var resetRenderMode = function (desiredMode) {
            var newMode = jsPlumb.setRenderMode(desiredMode);
            $(".rmode").removeClass("selected");
            $(".rmode[mode='" + newMode + "']").addClass("selected");

            $(".rmode[mode='canvas']").attr("disabled", !jsPlumb.isCanvasAvailable());
            $(".rmode[mode='svg']").attr("disabled", !jsPlumb.isSVGAvailable());
            $(".rmode[mode='vml']").attr("disabled", !jsPlumb.isVMLAvailable());
        };

        $(".rmode").bind("click", function () {
            var desiredMode = $(this).attr("mode");
            if (jsPlumbDemo.reset) jsPlumbDemo.reset();
            jsPlumb.reset();
            resetRenderMode(desiredMode);
        });

        resetRenderMode(jsPlumb.SVG);
    });

    $('.workflow-view').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    })
    $("#project-name").click(function () {
        $(".job-view").click();
    })

})();
