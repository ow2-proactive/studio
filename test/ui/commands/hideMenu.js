/**
 * The menu sometimes doesn't hide properly on the first click.
 * If the menu doesn't show, this function clicks .
 */
exports.command = function () {
    var browser = this

    var hideMenu = function (iteration, amount) {
        // isVisible will cause a test failure if element cannot be found, fallback to Selenium method
        browser.element("css selector", "div.navbar-collapse.collapsed", function (result) {
            console.log("Hide menu, iteration: "+iteration+" max repetitions: "+amount)
            if (result.status === 0 && iteration < amount) {
                browser.click('.navbar-toggle')
                hideMenu(iteration++, amount)
            }
        })
    }
    hideMenu(0, browser.globals.numberOfTries);

    return this;
};