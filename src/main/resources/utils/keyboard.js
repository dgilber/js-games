
(function (root) {

    "use strict";

    /**
     * @namespace
     * @alias Keyboard.Codes
     */
    var Codes = {

        /** @type {int} */ BACKSPACE: 8,
        /** @type {int} */ TAB: 9,
        /** @type {int} */ ENTER: 13,
        /** @type {int} */ ESCAPE: 27,
        /** @type {int} */ END: 35,
        /** @type {int} */ HOME: 36,
        /** @type {int} */ PAGE_UP: 33,
        /** @type {int} */ PAGE_DOWN: 34,
        /** @type {int} */ ARROW_LEFT: 37,
        /** @type {int} */ ARROW_UP: 38,
        /** @type {int} */ ARROW_RIGHT: 39,
        /** @type {int} */ ARROW_DOWN: 40,
        /** @type {int} */ DELETE: 46
    }

    /**
     * @namespace
     * @alias Keyboard
     */
    root.Keyboard = Object.freeze({

        Codes: Object.freeze(Codes)
    });

})(this);