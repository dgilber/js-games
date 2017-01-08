
var Games = (Games || {});

// TODO
(function (root, $) {

    "use strict";
    
    /* *************************************************************
     * Imports
     * ************************************************************* */
    var requireIntBetween = NumberUtils.requireIntegerBetween,
        KeyCodes          = Keyboard.Codes;

    /* *************************************************************
     * Private variables
     * ************************************************************* */

    /** Animation easing. */
    var EASING = 'swing';

    /** Animation speed during reset, in milliseconds. */
    var RESET_SPEED = 500;

    /**
     * Default board dimensions, rows and columns.
     * @type {int}
     */
    var BOARD_DIM = 3;

    /**
     * Button dimensions, width and height, in pixels.
     * @type {int}
     */
    var BUTTON_DIM = 60;  // Must match width and height in CSS.


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

    /** @returns {int} Board size. */
    function _boardSize (dim) {
        return Math.pow(dim, 2);
    }

    /**
     * Creates a new game board.
     * @param {int} dim - dimension
     * @returns {int[]} Array of integers in random order, from 0 to (dim - 1).
     * @private
     */
    function _newBoard (dim) {

        var board;
        do {
            board = [];
            var size   = _boardSize(dim),
                values = [];


            for (var i = 0; i < size; i++)
                values.push(i);

            for (var i = 0; i < size; i++) {
                var r = NumberUtils.randomInteger(0, size - i - 1);

                board.push(values[r]);
                values.splice(r, 1);
            }
        } while (_isSolved(board));  // Make sure we don't give users a done deal.

        return board;
    }

    /**
     * @param {int[]} board
     * @returns {boolean} Whether the given board is solved.
     * @private
     */
    function _isSolved (board) {

        var last = board.length - 1;

        // Bottom-right space must be empty
        if (board[last] !== 0)
            return false;

        var isSolved = true;

        for ( var i = 0;
                  i < last && isSolved;
                  i++ ) {

            if (board[i] !== i + 1)
                isSolved = false;
        }

        return isSolved;
    }

    /**
     * Validates a given board as per the given dimension.
     * @param {int} dim - Dimension
     * @param {int[]} board - Board to validate.
     * @returns {int[]} `board`
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

            requireIntBetween(id, 0, max, "board[" + i + "]");

            if (checked[id] === true)
                throw new Error("Repeated value found at index [" + i + "]: " + id);

            checked[id] = true;
        }

        return board;
    }

    /**
     * @param {int} i - Index in board.
     * @param {int} dim - Board dimension.
     * @returns {int} Row index on the GUI board.
     * @private
     */
    function _row (i, dim) {
        return Math.floor(i / dim);
    }

    /**
     * @param {int} i - Index in board.
     * @param {int} dim - Board dimension.
     * @returns {int} Column index on the GUI board.
     * @private
     */
    function _col (i, dim) {
        return (i % dim);
    }

    /**
     * @param {int} row
     * @param {int} col
     * @param {int} dim
     * @returns {int} Index position within the board (array) that correspond to `row` and `col`.
     * @private
     */
    function _indexByCoord (row, col, dim) {
        return (row * dim) + col;
    }

    /**
     * @param {int} id
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {int} Index position of a button within the board array, -1 if `id` is invalid.
     * @private
     */
    function _indexById (id, puzzle) {
        return puzzle._board.indexOf(id);
    }

    /**
     * Positions all buttons.
     * @param {Games.SlidingPuzzle} puzzle
     * @private
     */
    function _paint (puzzle) {

        _setNumButtons(puzzle);

        var board     = puzzle._board,
            size      = board.length,
            boardWH   = _boardWidthHeight(puzzle),
            container = puzzle._top.parent();

        puzzle._top
            .width(boardWH)
            .height(boardWH)
            .css({
                top:  Math.max(0, (container.height() / 2) - (boardWH / 2)),
                left: Math.max(0, (container.width()  / 2) - (boardWH / 2))
            });

        for (var i = 0; i < size; i++) {

            var id = board[i];
            if (id > 0)
                _animateButtonTo(puzzle, id, i, RESET_SPEED);
        }
    }

    /**
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {int} With and height of the game, in pixels.
     * @private
     */
    function _boardWidthHeight (puzzle) {
        return (puzzle._dim * BUTTON_DIM);
    }

    /**
     * Animates a button to the position on the board.
     * @param {Games.SlidingPuzzle} puzzle
     * @param {int} btnId
     * @param {int} indexInBoard - Where the button is moving.
     * @param {int} speed - Animation speed
     * @private
     */
    function _animateButtonTo (puzzle, btnId, indexInBoard, speed) {

        puzzle._btns[btnId]
            .stop()
            .animate({
                    top: _row(indexInBoard, puzzle._dim) * BUTTON_DIM,
                    left: _col(indexInBoard, puzzle._dim) * BUTTON_DIM
                },
                speed,
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

        var btns    = puzzle._btns,
            size    = puzzle._board.length,
            newAt   = (_boardWidthHeight(puzzle) / 2)
                    - (BUTTON_DIM / 2);

        while (btns.length < size) {
            var id = btns.length;

            btns.push(
                $('<button type="button">')
                    .css({
                        top: newAt,
                        left: newAt
                    })
                    .appendTo(puzzle._top)
                    .text(id)
                    .data(BUTTON_ID, id)
                    .data(BUTTON_PUZZLE, puzzle)
            );
        }

        _.each(btns.splice(size), function (btn) {
            _removeButton(btn, puzzle._animSpeed);
        });

        return btns;
    }

    /**
     * Removes a button from the board.
     * @param {jQuery} btn - Button to remove.
     * @param {int} duration - Animation duration.
     * @private
     */
    function _removeButton (btn, duration) {

        btn.animate(
            { opacity: 0 },
            duration,
            EASING,
            function () {
                btn.remove();
            }
        );
    }

    /**
     * Listener for *click* event of buttons on the board.
     * @param {jQuery.Event} event
     * @private
     */
    function _buttonClick (event) {
        _move($(event.target));
    }

    /**
     * Attempts to move the given button to the available spot, returns true if it succeeds.
     * @param {jQuery} btn
     * @returns {boolean}
     * @private
     */
    function _move (btn) {

        /** @type {Games.SlidingPuzzle} */
        var puzzle = btn.data(BUTTON_PUZZLE),
            id     = btn.data(BUTTON_ID);

        if (_canMove(id, puzzle)) {

            var free = _indexById(0,  puzzle),
                me   = _indexById(id, puzzle);

            // Move the button the the free spot.
            puzzle._board[free] = id;
            puzzle._board[me]   = 0;

            _animateButtonTo(puzzle, id, free, puzzle._animSpeed);

            _setSolved(puzzle);
        }
    }

    /**
     * @param {int} id
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {boolean} Whether the given button (id) is allowed to move to the free spot.
     * @private
     */
    function _canMove (id, puzzle) {
        return _getMovables(puzzle).hasOwnProperty(id);
    }

    /**
     * Returns a list of buttons that are allowed to move to the free spot, indexed by IDs.
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {Object.<int, jQuery>} List of movable buttons, indexed by IDs.
     * @private
     */
    function _getMovables (puzzle) {

        var dim   = puzzle._dim,
            max   = dim - 1,
            free  = _indexById(0, puzzle),
            freeY = _row(free, dim),
            freeX = _col(free, dim),
            list  = {};

        if (freeY > 0)   _addMovable(list, freeY - 1, freeX, puzzle);
        if (freeY < max) _addMovable(list, freeY + 1, freeX, puzzle);
        if (freeX > 0)   _addMovable(list, freeY, freeX - 1, puzzle);
        if (freeX < max) _addMovable(list, freeY, freeX + 1, puzzle);

        return list;
    }

    /**
     * Adds a button to the index.
     * @param {Object.<int, jQuery>} index
     * @param {int} y
     * @param {int} x
     * @param {Games.SlidingPuzzle} puzzle
     * @private
     */
    function _addMovable (index, y, x, puzzle) {

        var idx = _indexByCoord(y, x, puzzle._dim),
            id  = puzzle._board[idx];

        index[id] = puzzle._btns[idx];
    }

    /**
     * Listener for *keydown* event anywhere on the board.
     * @param {jQuery.Event} event
     * @private
     */
    function _keydown (event) {

        /** @type {Games.SlidingPuzzle} */
        var puzzle = event.data;

        var keycode = event.which;

        switch (keycode) {
            case KeyCodes.ARROW_DOWN:  _applyKey(-1,  0, puzzle); break;
            case KeyCodes.ARROW_UP:    _applyKey( 1,  0, puzzle); break;
            case KeyCodes.ARROW_RIGHT: _applyKey( 0, -1, puzzle); break;
            case KeyCodes.ARROW_LEFT:  _applyKey( 0,  1, puzzle); break;
        }
    }

    /**
     * Attempts to move a button based on arrow key.
     * @param {int} y - Row offset from the free spot pointing to the button to move.
     * @param {int} x - Column offset from the free spot pointing to the button to move.
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {boolean} Whether a button moved.
     * @private
     */
    function _applyKey (y, x, puzzle) {

        // Find the free spot
        var dim   = puzzle._dim,
            max   = dim - 1,
            free  = _indexById(0, puzzle),
            btnY  = _row(free, dim) + y,
            btnX  = _col(free, dim) + x;

        if (   btnY < 0 || btnY > max
            || btnX < 0 || btnX > max )
            return false;

        var me = _indexByCoord(btnY, btnX, dim),
            id = puzzle._board[me];

        // Move the button the the free spot.
        puzzle._board[free] = id;
        puzzle._board[me]   = 0;

        _animateButtonTo(puzzle, id, free, puzzle._animSpeed);
        _setSolved(puzzle);

        return true;
    }

    /**
     * Sets the visual cues indicating whether a puzzle is solved.
     * @param {Games.SlidingPuzzle} puzzle
     * @private
     */
    function _setSolved (puzzle) {

        if (_isSolved(puzzle._board))
            puzzle._top.addClass('solved');
        else
            puzzle._top.removeClass('solved');
    }

    /**
     * @constructor
     * @name Games.SlidingPuzzle
     */
    function SlidingPuzzle () {

        /** @type {int} */
        this._dim = BOARD_DIM;

        /** @type {jQuery} */
        this._top = $('<form class="sliding-puzzle">')
            .prop('tabindex', 0)  // Required to capture keyboard events.
            .on('submit', _returnFalse)
            .on('mousedown', 'button', this, _buttonClick)
            .on('keydown',   null,     this, _keydown);

        /** @type {int[]} */
        this._board = _newBoard(this._dim);

        /** @type {Array.<?jQuery>} */
        this._btns = [null];  // button[0] is null

        /** @type {int} */
        this._animSpeed = 250;  // default speed

        _paint(this);
    }
    
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
         * @param {int} [dim] - New dimension, 3-5.
         * @param {int[]} [board] - Array indicating where each button is on the board.
         *        If not provided, a random board is generated.
         *        If provided, the board must contain dim^2, non-repeating, within-range integers.
         * @returns {Games.SlidingPuzzle}
         */
        reset: function (dim, board) {

            var numArgs = arguments.length,
                d       = this._dim,
                b       = null;

            if (numArgs > 0) {

                requireIntBetween(dim, 3, 15, "dim");

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
         * @returns {int} Current board dimension.
         */
        dim: function () {
            return this._dim;
        },

        /**
         * Gets or sets the animation speed (in millisecond).
         * @param {int} animDuration - Duration of animation, higher is slower,
         *        0 is instantaneous.
         * @returns {(int|Games.SlidingPuzzle)}
         */
        speed: function (animDuration) {

            if (arguments.length < 1)
                return this._animSpeed;

            else {
                requireIntBetween(animDuration, 0, 1000, 'animDuration');

                this._animSpeed = animDuration;
                return this;
            }
        }
    };
    
    Object.freeze(SlidingPuzzle);
    Object.freeze(SlidingPuzzle.prototype);
    
    /* *************************************************************
     * Public object
     * ************************************************************* */
    root.SlidingPuzzle = SlidingPuzzle;
    
})(Games, jQuery);