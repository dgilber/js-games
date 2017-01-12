
var Games = (Games || {});

/**
 * SlidingPuzzle is a game with a square layout containing an equal number of
 * rows and columns. The puzzle's board contains `dimension ^ 2 - 1` tiles.
 * The goal is for users to put the tiles in order, left-to-right, top-to-bottom,
 * with the empty spot positioned at the bottom-right corner.
 *
 * This implementation supports auto-solving the puzzle.
 */
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
     * Tile dimensions, width and height, in pixels.
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

    /** @returns {int} Board dimension. */
    function _boardDim (board) {
        return Math.sqrt(board.length);
    }

    /**
     * @param {*} item
     * @param {Array} array
     * @returns {int} Index of item in array, -1 if not found.
     * @private
     */
    function _indexOf (item, array) {
        return array.indexOf(item);
    }

    /**
     * Remove item from array.
     * @param {*} item
     * @param {Array} array
     * @returns {int} Index where item was found, or -1 if array was not modified.
     * @private
     */
    function _removeItem (item, array) {

        var idx = _indexOf(item, array);
        if (idx >= 0)
            array.splice(idx, 1);

        return idx;
    }

    /**
     * Switches values from idx1 and idx2 within the board.
     * @param {int[]} board - Puzzle board.
     * @param {int} idx1 - Index of item 1.
     * @param {int} idx2 - Index of item 2.
     * @returns {int[]} `board` for convenience.
     * @private
     */
    function _switchPosition (board, idx1, idx2) {

        var tmp = board[idx1];
        board[idx1] = board[idx2];
        board[idx2] = tmp;

        return board;
    }

    /**
     * Shuffles the tiles.
     * @param {Games.SlidingPuzzle} puzzle - The puzzle to shuffle.
     * @returns {int[]} New board -array of integers in random order, from 0 to (dim^2 - 1).
     * @private
     */
    function _shuffle (puzzle) {

        var goal  = puzzle._goal,
            board = goal.slice(0),
            free  = _indexOf(0, board),  // Should always be board.length - 1
            last  = -1;

        for (var i = 0, numShuffles = goal.length * 2; i < numShuffles; i++) {

            var movables = _getMovableIndices(board, puzzle._dim);

            // console.log("movables: [%s], last: [%d]", movables.join(','), last);
            _removeItem(last, movables);

            var moveIdx = movables[NumberUtils.randomInteger(0, movables.length - 1)];

            _switchPosition(board, moveIdx, free);

            last = free;
            free = moveIdx;
        }

        return board;
    }

    /**
     * @param {int} dim
     * @returns {int[]} The goal for a board of the given dimension, immutable.
     * @private
     */
    function _newGoal (dim) {

        var goal = [],
            size = _boardSize(dim),
            stop = size - 1;

        for (var i = 0; i < stop; i++)
            goal.push(i + 1);

        goal.push(0);

        return Object.freeze(goal);
    }

    /**
     * @param {int[]} board - Board to validate.
     * @param {int[]} goal - Goal to reach, array of equal or shorter length.
     * @returns {boolean} Whether the board meets the goal.
     * @private
     */
    function _isSolved (board, goal) {
        return ArrayUtils.startsWith(board, goal);
    }

    /**
     * Solves the puzzle with visual feedback.
     * @param {Games.SlidingPuzzle} puzzle
     * @private
     */
    function _solvePuzzle (puzzle) {
        return _solveBoard(puzzle._board, puzzle._goal);
    }

    /**
     * Deprecated, use `_solveBoard2`.
     *
     * Solves the board. This method modifies the given `board` argument.
     * @param {int[]} board - Board to solve.
     * @param {int[]} goal - Desired board layout.
     * @returns {?(int[])} Solution to the puzzle, given as a list of index positions within
     *           `board` to be moved, in that order.  May be null, but really shouldn't.
     * @private
     * @deprecated
     */
    function _solveBoard (board, goal) {

        var dim      = _boardDim(board),
            solution = [];

        for (var g = 0; g < goal.length; g++) {

            var step = goal.slice(0, g + 1);

            var path    = {},
                actions = [],
                wins    = [];

            _tryAll(board, dim, step, actions, path, wins);

            var win = _mostEfficient(wins);
            if (win === null)
                return null;  // We failed, back to the drawing board!

            console.log("Step %d/%d: [%s]", g + 1, goal.length, win.join(','));

            ArrayUtils.pushAll(solution, win);

            board = _play(board, win);
        }

        console.log("Solution has [%d] steps", solution.length);

        return solution;
    }

    /**
     * Recursive method reaches the desired goal by moving all movable pieces, evaluating
     * all possible options.
     *
     * @param {int[]} board - Board as it stands right now.
     * @param {int} dim - Board dimension.
     * @param {int[]} goal - Goal to achieve.
     * @param {int[]} actions - Tiles (indices) moved so far.
     * @param {Object.<string, *>} path - Hash of serialized boards that have lead us here.
     * @param {int[][]} wins - List of winning scenarios encountered on this recursive journey.
     * @private
     */
    function _tryAll (board, dim, goal, actions, path, wins) {

        if (actions.length > 50)
            return;  // TODO - Is there a better way to prevent stack-overflow error?

        if (_isSolved(board, goal)) {
            wins.push(actions.slice(0));
            return;
        }

        var serialized = _serializeBoard(board);
        if (path.hasOwnProperty(serialized))
            return;  // Prevent infinite loop

        path[serialized] = serialized;

        var options = _getMovableIndices(board, dim);

        // TODO - First try to find a solution without undoing any of the previous work.


        for (var i = 0, len = options.length; i < len; i++) {

            var tileIdx = options[i];

            actions.push(tileIdx);
            _tryAll(
                _switchPosition(board.slice(0), tileIdx, _indexOf(0, board)),
                dim,
                goal,
                actions,
                path,
                wins
            );
            actions.pop();
        }

        // delete path[serialized]
    }

    /**
     * @param {int[][]} solutions
     * @returns {?(int[])} Most efficient solution, may be null.
     * @private
     */
    function _mostEfficient (solutions) {

        var mostEfficient = null;

        _.each(solutions, function (solution) {
            if (   mostEfficient === null
                || mostEfficient.length > solution ) {

                mostEfficient = solution;
            }

        });

        return mostEfficient;
    }

    /**
     * Plays the steps to advance the board to the next goal.
     * @param {int[]} board - Board to modify.
     * @param {int[]} steps - Tile indices to be moved, in order.
     * @returns {int[]} New, modified board.
     * @private
     */
    function _play (board, steps) {

        var newBoard = board.slice(0),
            freeIdx  = _indexOf(0, newBoard);  // Track of tile-free index, for better performance.

        for (var i = 0, len = steps.length; i < len; i++) {
            _switchPosition(newBoard, steps[i], freeIdx);
            freeIdx = steps[i];
        }

        return newBoard;
    }

    /**
     * @param {int[]} board - Board to be serialized.
     * @returns {string} Serialized board.
     * @private
     */
    function _serializeBoard (board) {
        return board.join(',');
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
            throw new Error("board has length " + board.length + ", should be " + size);

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
     * @returns {int} Index position of a tile within the board array, -1 if `id` is invalid.
     * @private
     */
    function _indexById (id, puzzle) {
        return _indexOf(id, puzzle._board);
    }

    /**
     * Positions all tiles.
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {Games.SlidingPuzzle} `puzzle`
     * @private
     */
    function _paint (puzzle) {

        _setSolved(puzzle);

        _setNumTiles(puzzle);

        var board     = puzzle._board,
            size      = board.length,
            boardWH   = _boardWidthHeight(puzzle),
            container = puzzle._top.parent();

        puzzle._top
            .width(boardWH)
            .height(boardWH)
            .css({
                left: Math.max(0, (container.width()  / 2) - (boardWH / 2))
            });

        for (var i = 0; i < size; i++) {

            var id = board[i];
            if (id > 0)
                _animateTileTo(puzzle, id, i, RESET_SPEED, _.noop);
        }

        return puzzle;
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
     * Animates a tile to the position on the board.
     * @param {Games.SlidingPuzzle} puzzle
     * @param {int} btnId
     * @param {int} indexInBoard - Where the tile is moving.
     * @param {int} speed - Animation speed
     * @param {function} [callback] - Function to execute after the animation completes.
     * @private
     */
    function _animateTileTo (puzzle, btnId, indexInBoard, speed, callback) {

        puzzle._btns[btnId]
            .stop()
            .animate({
                    top: _row(indexInBoard, puzzle._dim) * BUTTON_DIM,
                    left: _col(indexInBoard, puzzle._dim) * BUTTON_DIM
                },
                speed,
                EASING,
                callback
            );
    }

    /**
     * Creates or removes tiles as needed.
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {Array.<?jQuery>} List of tiles.
     * @private
     */
    function _setNumTiles (puzzle) {

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
            _removeTile(btn, puzzle._animSpeed);
        });

        return btns;
    }

    /**
     * Removes a tile from the board.
     * @param {jQuery} btn - Tile to remove.
     * @param {int} duration - Animation duration.
     * @private
     */
    function _removeTile (btn, duration) {

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
     * Listener for *click* event of tiles on the board.
     * @param {jQuery.Event} event
     * @private
     */
    function _tileClick (event) {
        _move($(event.target));
    }

    /**
     * Attempts to move the given tile to the available spot, returns true if it succeeds.
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

            // Move the tile the the free spot.
            _switchPosition(puzzle._board, free, me);

            _animateTileTo(puzzle, id, free, puzzle._animSpeed, _.noop);

            _setSolved(puzzle);

            puzzle._chg();
        }
    }

    /**
     * @param {int} id
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {boolean} Whether the given tile (id) is allowed to move to the free spot.
     * @private
     */
    function _canMove (id, puzzle) {
        return _getMovableTiles(puzzle).hasOwnProperty(id);
    }

    /**
     * Returns a map of tiles that are allowed to move to the free spot, indexed by IDs.
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {Object.<int, jQuery>} List of movable tiles, indexed by IDs.
     * @private
     */
    function _getMovableTiles (puzzle) {

        return _.reduce(_getMovableIndices(puzzle._board, puzzle._dim), function (memo, idx) {

            var id  = puzzle._board[idx],
                btn = puzzle._btns[idx];

            memo[id] = btn;

            return memo;
        }, {});
    }

    /**
     * @param {int[]} board
     * @param {int} dim
     * @returns {int[]} List of index positions within board that are movable.
     * @private
     */
    function _getMovableIndices (board, dim) {

        var max   = dim - 1,
            free  = _indexOf(0, board),
            freeY = _row(free, dim),
            freeX = _col(free, dim),
            list  = [];

        if (freeY > 0)   list.push(_indexByCoord(freeY - 1, freeX, dim));
        if (freeY < max) list.push(_indexByCoord(freeY + 1, freeX, dim));
        if (freeX > 0)   list.push(_indexByCoord(freeY, freeX - 1, dim));
        if (freeX < max) list.push(_indexByCoord(freeY, freeX + 1, dim));

        return list;
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
     * Attempts to move a tile based on arrow key.
     * @param {int} y - Row offset from the free spot pointing to the tile to move.
     * @param {int} x - Column offset from the free spot pointing to the tile to move.
     * @param {Games.SlidingPuzzle} puzzle
     * @returns {boolean} Whether a tile moved.
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

        // Move the tile the the free spot.
        _switchPosition(puzzle._board, free, me);

        _animateTileTo(puzzle, id, free, puzzle._animSpeed, _.noop);
        _setSolved(puzzle);
        puzzle._chg();

        return true;
    }

    /**
     * Sets the visual cues indicating whether a puzzle is solved.
     * @param {Games.SlidingPuzzle} puzzle
     * @private
     */
    function _setSolved (puzzle) {

        if (_isSolved(puzzle._board, puzzle._goal))
            puzzle._top.addClass('solved');
        else
            puzzle._top.removeClass('solved');
    }

    /**
     * Starts to play the given action sequence.
     * @param {int[]} sequence - List of tile index positions to move, in order.
     * @param {Games.SlidingPuzzle} puzzle
     * @private
     */
    function _animatePuzzle (puzzle) {

        var animateNextTile = function () {

            var playing = puzzle._playing,
                board   = puzzle._board;

            if (playing.length > 0) {

                var meIdx   = playing.shift(),
                    meId    = board[meIdx],
                    freeIdx = _indexOf(0, board);
                _switchPosition(board, freeIdx, meIdx);
                _animateTileTo(puzzle, meId, freeIdx, puzzle._animSpeed, animateNextTile);
            }
        }

        animateNextTile();
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
            .on('mousedown', 'button', this, _tileClick)
            .on('keydown',   null,     this, _keydown);

        /** @type {int[]} */
        this._goal = _newGoal(this._dim);

        /** @type {int[]} */
        this._board = _shuffle(this);

        /** @type {Array.<?jQuery>} */
        this._btns = [null];  // button[0] is null

        /** @type {int} */
        this._animSpeed = 250;  // default speed

        /** @type {function} */
        this._chg = _.noop;

        /**
         * A list of movement being animated.
         * @type {int[]}
         * @private
         */
        this._playing = [];

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
         * Puts focus on the puzzle, so keyboard events are captured.
         * @returns {Games.SlidingPuzzle}
         */
        focus: function () {
            this._top.focus();
            return this;
        },
        
        /**
         * Restarts the game.
         * @param {int} [dim] - New dimension, 3-5.
         * @returns {Games.SlidingPuzzle}
         */
        reset: function (dim) {

            if (arguments.length > 0) {
                this._dim = requireIntBetween(dim, 3, 15, "dim");
                this._goal = _newGoal(this._dim);
            }

            this._board = _shuffle(this);

            return _paint(this);
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
        },

        /**
         * Sets a listener for monitoring changes made by user.
         * @param {function} callback
         * @returns {Games.SlidingPuzzle}
         */
        change: function (callback) {

            if (typeof callback !== "function")
                throw new TypeError("callback: Function");

            this._chg = callback;
            return this;
        },

        /**
         * Gets or sets the board.
         * @param {int[]} [board] - Array indicating where each tile is on the board;
         *        must contain dim^2, non-repeating, within-range integers.
         * @returns {(int[]|Games.SlidingPuzzle)}
         */
        layout: function (board) {

            if (arguments.length < 1)
                return this._board.slice(0);  // protective copy

            else {

                // Make protective copy
                this._board = _validBoard(this._dim, board).slice(0);

                return _paint(this);
            }
        },

        /**
         * Gets or sets the goal of this puzzle, the target tile layout.
         * @param {int[]} goal
         * @returns {(int[]|Games.SlidingPuzzle)}
         */
        goal: function (goal) {

            if (arguments.length < 1)
                return this._goal;

            else {
                _validBoard(this._dim, goal);

                this._goal = Object.freeze(goal.slice(0));
                _setSolved(this);

                return this;
            }
        },

        /**
         * Shuffles the tiles.
         * @returns {Games.SlidingPuzzle}
         */
        shuffle: function () {

            this._board = _shuffle(this);
            return _paint(this);
        },

        /**
         * Solves the puzzle, giving feedback via animation.
         * @returns {Games.SlidingPuzzle}
         */
        solve: function () {

            var solution = _solvePuzzle(this);

            if (solution === null)
                alert("Failed to resolve the puzzle.");

            else {
                ArrayUtils.pushAll(this._playing, solution);

                if (solution.length > 0)
                    _animatePuzzle(this);
            }

            return this;
        }
    };
    
    Object.freeze(SlidingPuzzle);
    Object.freeze(SlidingPuzzle.prototype);
    
    /* *************************************************************
     * Public object
     * ************************************************************* */
    root.SlidingPuzzle = SlidingPuzzle;
    
})(Games, jQuery);