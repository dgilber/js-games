
var Games = (Games || {});

// TODO
(function (root, $) {

    "use strict";
    
    /* *************************************************************
     * Private variables
     * ************************************************************* */

    /** Animation easing. */
    var EASING = 'swing';

    /**
     * Default board dimensions, rows and columns.
     * @type {Integer}
     */
    var BOARD_DIM = 3;

    /**
     * Button dimensions, width and height, in pixels.
     * @type {Integer}
     */
    var BUTTON_DIM = 30;  // Must match CSS


    var BUTTON_ID = 'btn-id',
        BUTTON_PUZZLE = 'btn-puzzle';

    /* *************************************************************
     * Private methods
     * ************************************************************* */
     
    /**
     * @returns {boolean} Always returns `false`.
     */
    function _returnFalse () {
        return false;
    }

    /** @returns {boolean} Whether `arg` is an array. */
    function _isArray (arg) {
        return (arg instanceof Array);
    }

    /** @returns {Integer} Board size. */
    function _boardSize (dim) {
        return Math.pow(dim, 2);
    }

    /**
     * Creates a new game board.
     * @param {Integer} dim - dimension
     * @returns {Integer[]} Array of integers in random order, from 0 to (dim - 1).
     * @private
     */
    function _newBoard (dim) {

        var size   = _boardSize(dim),
            values = [],
            board  = [];

        for (var i = 0; i < size; i++)
            values.push(i);

        for (var i = 0; i < size; i++) {
            var r = NumberUtils.randomInteger(0, size - i - 1);

            board.push(values[r]);
            values.splice(r, 1);
        }

        return board;
    }

    /**
     * Validates a given board as per the given dimension.
     * @param {Integer} dim - Dimension
     * @param {Integer[]} board - Board to validate.
     * @returns {Integer[]} `board`
     * @throws TypeError - If `board` is not an array of integers.
     * @throws Error - If `board` has wrong size, contains invalid or redundant values.
     * @private
     */
    function _validBoard (dim, board) {

        if (!_isArray(board))
            throw new TypeError("board: Array");

        var size = _boardSize(dim);
        if (board.length !== size)
            throw new Error("board has length " + board.length + " but should be " + size);

        var max     = size - 1,
            checked = [];

        for (var i = 0; i < size; i++) {

            var id = board[i];

            NumberUtils.requireIntegerBetween(id, 0, max, "board[" + i + "]");

            if (checked[id] === true)
                throw new Error("Repeated value found at index [" + i + "]: " + id);

            checked[id] = true;
        }

        return board;
    }

    /**
     * @param {Integer} i - Index in board.
     * @param {Integer} dim - Board dimension.
     * @returns {Integer} Row index on the GUI board.
     * @private
     */
    function _row (i, dim) {
        return Math.floor(i / dim);
    }

    /**
     * @param {Integer} i - Index in board.
     * @param {Integer} dim - Board dimension.
     * @returns {Integer} Column index on the GUI board.
     * @private
     */
    function _col (i, dim) {
        return (i % dim);
    }

    /**
     * TODO
     * @param {Games.SlidingPuzzle} puzzle
     * @private
     */
    function _paint (puzzle) {

        _setNumButtons(puzzle);

        var dim   = puzzle._dim,
            board = puzzle._board,
            size  = board.length;

        puzzle._top
            .width(dim * BUTTON_DIM)
            .height(dim * BUTTON_DIM);

        for (var i = 0; i < size; i++) {

            var id = board[i];
            if (id > 0)
                _animateButtonTo(puzzle, id, i);
        }
    }

    /**
     * Animates a button to the position on the board.
     * @param {Games.SlidingPuzzle} puzzle
     * @param {Integer} btnId
     * @param {Integer} indexInBoard
     * @private
     */
    function _animateButtonTo (puzzle, btnId, indexInBoard) {

        puzzle._btns[btnId]
            .stop()
            .animate({
                    top: _row(indexInBoard, puzzle._dim) * BUTTON_DIM,
                    left: _col(indexInBoard, puzzle._dim) * BUTTON_DIM
                },
                puzzle._animSpeed,
                EASING
            );
    }

    /**
     * Creates or removes buttons as needed.
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {Array.<?jQuery>} List of buttons.
     * @private
     */
    function _setNumButtons (puzzle) {

        var btns = puzzle._btns,
            size = puzzle._board.length;

        while (btns.length < size) {
            var id = btns.length;

            btns.push(
                $('<button type="button">')
                    .appendTo(puzzle._top)
                    .text(id)
                    .data(BUTTON_ID, id)
                    .data(BUTTON_PUZZLE, puzzle)
            );
        }

        _.each(btns.splice(size), function (btn) {
            btn.remove();
        });

        return btns;
    }


    /**
     * @constructor
     * @name Games.SlidingPuzzle
     */
    function SlidingPuzzle () {

        /** @type {Integer} */
        this._dim = BOARD_DIM;

        /** @type {jQuery} */
        this._top = $('<form class="sliding-puzzle">').on('submit', _returnFalse);

        /** @type {Integer[]} */
        this._board = _newBoard(this._dim);

        /** @type {Array.<?jQuery>} */
        this._btns = [null];  // button[0] is null

        /** @type {Integer} */
        this._animSpeed = 500;  // 1 second by default.

        _paint(this);
    };
    
    SlidingPuzzle.prototype = /** @lends {Games.SlidingPuzzle} */ {
        constructor: SlidingPuzzle,
        
        /**
         * Attaches the game to the given DOM element.
         * @param {jQuery} elm
         * @returns {Games.SlidingPuzzle}
         */
        appendTo: function (elm) {
            
            this._top.appendTo(elm);
            return this;
        },
        
        /**
         * Restarts the game.
         * @param {Integer} [dim] - New dimension, 3-5.
         * @param {Integer[]} [board] - Array indicating where each button is on the board.
         *        If not provided, a random board is generated.
         *        If provided, the board must contain dim^2, non-repeating, within-range integers.
         * @returns {Games.SlidingPuzzle}
         */
        reset: function (dim, board) {

            var numArgs = arguments.length,
                d       = this._dim,
                b       = null;

            if (numArgs > 0) {

                NumberUtils.requireIntegerBetween(dim, 3, 5, "dim");

                d = dim;

                if (numArgs > 1)
                    b = _validBoard(d, board);

            }

            if (b === null)
                b = _newBoard(d);

            this._dim = d;
            this._board = b;

            _paint(this);

            return this;
        },

        /**
         * @returns {Integer} Current board dimension.
         */
        dim: function () {
            return this._dim;
        }
    };
    
    Object.freeze(SlidingPuzzle);
    Object.freeze(SlidingPuzzle.prototype);
    
    /* *************************************************************
     * Public object
     * ************************************************************* */
    root.SlidingPuzzle = SlidingPuzzle;
    
})(Games, jQuery);