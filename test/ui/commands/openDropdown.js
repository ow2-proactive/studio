exports.command = function (dropdownSelectionString) {

    this
        .waitForElementVisible(dropdownSelectionString)
        .click(dropdownSelectionString);

    return this;
};
