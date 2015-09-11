/**
 * The menu sometimes doesn't hide properly on the first click.
 * If the menu doesn't show, this function clicks .
 */
exports.command = function () {
    var browser = this

    var hideMenu = function () {
        // isVisible will cause a test failure if element cannot be found, fallback to Selenium method
        browser.element("css selector", "div.navbar-collapse.collapsed", function (result) {
            if (result.status === 0) {
                browser.click('.navbar-toggle')
                hideMenu()
            }
        })
    }
    hideMenu();

    return this;
};