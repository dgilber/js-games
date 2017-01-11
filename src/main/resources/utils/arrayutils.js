
(function (root) {

    "use strict";

    /* **************************************************
     * Imports
     * ************************************************** */
    var isInteger = NumberUtils.isInteger,
        isNonNegativeInteger = NumberUtils.isNonNegativeInteger;

    /* **************************************************
     * Private methods
     * ************************************************** */

    /**
     * @param {*} arg
     * @returns {boolean} Whether `arg` is an Array instance.
     */
    function _isArray (arg) {
        return (arg instanceof Array);
    }

    /**
     * @param {(Array|Object)} arg
     * @returns {boolean} Whether `arg` is an array-like object.
     */
    function _isArrayLike (arg) {

        return (   arg !== null
                && typeof arg === "object"
                && isNonNegativeInteger(arg.length) );
    }

    /**
     * Validates `arg` to be an array, throws if it isn't.
     * @param {Array} arg - Argument to validate.
     * @param {string} name - Name given to the array.
     * @returns {Array} `arg`
     * @private
     */
    function _requireArray (arg, name) {

        if (!_isArray(arg))
            throw new TypeError(name + ": Array");

        return arg;
    }

    /**
     * Validates `arg` to be an array-like object, throws if it isn't.
     * @param {(Array|Object)} arg - Argument to validate.
     * @param {string} name - Name given to the object.
     * @returns {(Array|Object)} `arg`
     * @private
     */
    function _requireArrayLike (arg, name) {

        if (!_isArrayLike(arg))
            throw new TypeError(name + ": Array-like object");

        return arg;
    }


    /* *************************************************************
     * Public object
     * ************************************************************* */

    /**
     * A collection of utility functions that revolve around arrays.
     * @namespace
     * @alias ArrayUtils
     */
    root.ArrayUtils = Object.freeze( /** @lends {ArrayUtils} */ {

        /**
         * @param {*} arg
         * @returns {boolean} Whether `arg` is an Array instance.
         * @method
         */
        isArray: _isArray,

        /**
         * @param {*} arg
         * @returns {boolean} Whether `arg` is an array-like object.
         * @method
         */
        isArrayLike: _isArrayLike,

        /**
         * Adds all items into the array.
         * @param {Array} array
         * @param {Object[]} items
         * @returns {Array} `array`
         */
        pushAll: function (array, items) {

            _requireArray(array, "array");
            _requireArrayLike(items, "items");

            for (var i = 0, len = items.length; i < len; i++)
                array.push(items[i]);

            return array;
        },

        /**
         * @param {Array} array
         * @param {Array} firstItems
         * @returns {boolean} Whether the first items in `array` match those found in `firstItems`,
         *          in the same order.
         */
        startsWith: function (array, firstItems) {

            _requireArrayLike(array, "array");
            _requireArrayLike(firstItems, "firstItems");

            if (array.length < firstItems.length)
                return false;

            var isMatch = true;

            for ( var i = 0, len = firstItems.length;
                  i < len && isMatch;
                  i++ ) {

                if (array[i] !== firstItems[i])
                    isMatch = false;
            }

            return isMatch;
        }
    });

})(this);
