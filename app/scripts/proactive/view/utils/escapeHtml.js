define(function (require) {
        var entityMap= {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': '&quot;',
            "'": '&#39;'
        };

        window.escapeHtml = function (string) {
            return String(string).replace(/[&<>"']/g, function (s) {
                return entityMap[s];
            });
        }
})