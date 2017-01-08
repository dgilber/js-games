
(function (root) {

    "use strict";

    /* *************************************************************
     * Private methods
     * ************************************************************* */

    /** @returns {boolean} Whether `arg` is a finite number. */
    function _isFinite (arg) {
        return (typeof arg === "number" && isFinite(arg));
    }

    /** @returns {boolean} Whether `arg` is an integer. */
    function _isInt (arg) {
        return (_isFinite(arg) && arg % 1 === 0);
    }

    /** @returns {boolean} Whether `min &lt;= arg &lt;= max`. */
    function _isIntBetween (arg, min, max) {
        return (
               _isInt(arg)
            && min <= arg
            && max >= arg
        );
    }

    /**
     * Returns `arg` if it's an integer; throws a TypeError otherwise.
     * @param {int} arg - Argument to be validated.
     * @param {string} [name] - Name given to the argument.
     * @returns {int} `arg`
     * @throws TypeError - If `arg` is not an integer.
     * @method
     */
    function _requireInt (arg, name) {

        if (!_isInt(arg))
            _throw(TypeError, "Integer", name, "arg");

        return arg;
    }

    /**
     * Throws an error.
     * @param {function} ctor - Error constructor (Error, TypeError, ReferenceError, etc.)
     * @param {string} msg - Error message.
     * @param {?string} [name] - Primary name given to the argument.
     * @param {string} fallbackName - Fallback name given to the argument.
     * @private
     */
    function _throw (ctor, msg, name, fallbackName) {

        var err = (((typeof name === "string") ? name : fallbackName) + ": " + msg);
        throw new ctor(err);
    }

    /* *************************************************************
     * Public object
     * ************************************************************* */

    root.NumberUtils = Object.freeze( /** @lends {NumberUtils} */ {

        /**
         * @param {*} arg - Value to confirm.
         * @returns {boolean} Whether `arg` is an integer.
         * @method
         */
        isInteger: _isInt,

        /**
         * @param {*} arg - Value to confirm.
         * @param {number} min - Lowest acceptable value.
         * @param {number} max - Highest acceptable value.
         * @returns {boolean} Whether `min &lt;= arg &lt;= max`.
         * @method
         */
        isIntegerBetween: _isIntBetween,

        /**
         * Returns `arg` if it's an integer; throws a TypeError otherwise.
         * @param {int} arg - Argument to be validated.
         * @param {string} [name] - Name given to the argument.
         * @returns {int} `arg`
         * @throws TypeError - If `arg` is not an integer.
         * @method
         */
        requireInteger: _requireInt,

        /**
         * Returns `arg` if it's an integer between `min` and `max`; throws a TypeError otherwise.
         * @param {int} arg - Argument to be validated.
         * @param {int} min - Lowest acceptable value.
         * @param {int} max - Highest acceptable value.
         * @param {string} [name] - Name given to the argument.
         * @returns {int} `arg`
         * @throws TypeError - If `arg` is not an integer between `min` and `max`.
         */
        requireIntegerBetween: function (arg, min, max, name) {

            _requireInt(arg, name);

            if (   arg < min
                || arg > max )
                _throw(Error, "Integer out of range " + min + "-" + max + ": " + arg, name, "arg");

            return arg;
        },

        /**
         * Generates a random integer between `min` and `max` (inclusive).
         * @param {int} min
         * @param {int} max
         * @returns {int} Random integer between `min` and `max` (inclusive).
         * @throws TypeError - If `min` or `max` are not integers.
         */
        randomInteger: function (min, max) {

            _requireInt(min, "min");
            _requireInt(max, "max");

            return Math.round((Math.random() * (max - min)) + min);
        }
    });

})(this);
