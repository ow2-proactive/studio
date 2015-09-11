/**
 * The menu sometimes doesn't show depending on the width of the browser.
 * If the menu doesn't show, this function clicks on the navbar-toggle button.
 */
exports.command = function () {
    var browser = this

    var showMenu = function () {
        // isVisible will cause a test failure if element cannot be found, fallback to Selenium method
        browser.element("css selector", ".navbar-collapse.in", function (result) {
            if (result.status != 0) {
                browser.click('.navbar-toggle').pause(2000)
                showMenu()
            }
        })
    }
    showMenu();

    return this;
};