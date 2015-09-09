var previous_time;

var scene_game = (function () {
  var state;
  var graphics;
  var config = {
    board_width: 8,
    board_height: 17,
    grid_size: 20,
    next_length:  4,
    next_row_interval: 10000
  };
  var PieceTypes = {
    Empty: 0,
    Red: 1,
    Blue: 2
  };
  var normal_piece_types = [PieceTypes.Red, PieceTypes.Blue];

  function pause() {
    kz.pause();
    // copy over game picture at pause time
    graphics.pause_context.clearRect(
      0,
      0,
      graphics.pause_canvas.width,
      graphics.pause_canvas.height
    );
    graphics.pause_context.drawImage(
      kz.canvas,
      0,
      0
    );
    kz.tween({
      object: graphics,
      property: 'pause_alpha',
      value: 0.75,
      duration: 50
    });
  }

  function resume() {
    kz.tween({
      object: graphics,
      property: 'pause_alpha',
      value: 0,
      duration: 50
    }).then(kz.resume);
  }

  function blankPromise() {
    return new Promise(function (resolve) {
      resolve();
    });
  }

  function randomPieceType(piece_type_array) {
    var length = piece_type_array.length;
    return piece_type_array[Math.floor(Math.random()*length)];
  }

  // TODO: This should be converted to a constructor
  function makePiece(x, y, piece_type) {
    return new kz.Entity({
      x: x,
      y: y,
      type: piece_type,
      alpha: 1,
      blend_alpha: 0,
      blend_type: 0,
      actions_promise: blankPromise()
    });
  }

  function pieceTypeImage(piece_type) {
    switch (piece_type) {
      case PieceTypes.Red:
        return kz.resources.images.piece_red;
      case PieceTypes.Blue:
        return kz.resources.images.piece_blue;
    }
  }

  function piece_to_board(piece_coord) {
    return Math.floor((piece_coord - 1) / 20);
  }

  function board_to_piece(board_coord) {
    return 1 + 20 * board_coord;
  }

  /*^ Messy section of game logic */
  function lose() {
    state.alive = false;
    console.log('Lost :(');
    /*kz.resources.sounds.bgm.fade(
      1,
      0,
      100,
      function () {
        kz.resources.sounds.bgm.stop();
      }
    );*/

    // copy over game picture at losing time
    graphics.gameover_context.clearRect(
      0,
      0,
      graphics.gameover_canvas.width,
      graphics.gameover_canvas.height
    );
    graphics.gameover_context.drawImage(
      kz.canvas,
      0,
      0
    );
    // fade to black
    kz.tween({
      object: graphics,
      property: 'gameover_background_alpha',
      value: 1,
      duration: 1000
    }).then(function () {
      return kz.tween({
        object: graphics,
        property: 'gameover_text_alpha',
        value: 1,
        duration: 1000
      });
    }).then(function () {
      state.can_restart = true;
    });
  }

  function clearRow() {
    var row;
    for (var yy = 0; yy < config.board_height; yy++) {
      var piece_type = state.board[yy][0].piece_type;
      if (piece_type == PieceTypes.Empty) continue;
      var cleared = true;
      for (var xx = 0; xx < config.board_width; xx++) {
        if (state.board[yy][xx].piece_type != piece_type) {
          cleared = false;
          break;
        }
      }
      if (cleared) {
        row = yy;
        break;
      }
    }

    if (typeof row === 'undefined') return;

    // capture row pieces before we update board so we can animate them
    var row_pieces = [];
    for (var xx = 0; xx < config.board_width; xx++) {
      row_pieces.push(state.board[row][xx].piece);
    }

    // update of underlying board
    for (yy = row; yy < config.board_height-1; yy++) {
      for (xx = 0; xx < config.board_width; xx++) {
        state.board[yy][xx] = state.board[yy+1][xx];
      }
    }
    for (xx = 0; xx < config.board_width; xx++) {
      state.board[config.board_height-1][xx] = {
        piece_type: PieceTypes.Empty
      };
    }

    state.score++;

    // animation
    kz.resources.sounds.sfx_clear.play();
    // animate fade away of row pieces
    // ensure that all row piece animations have finished
    var row_promise  = [];
    row_pieces.forEach(function (piece) {
      row_promise.push(piece.actions_promise);
    })
    row_promise = Promise.all(row_promise);
    var promises = [];
    row_pieces.forEach(function (piece) {
      var promise = row_promise.then(function () {
        return kz.tween({
          object: piece,
          property: 'alpha',
          value: 0,
          duration: 100
        }).then(function () {
          piece.destroy();
        });
      });
      piece.actions_promise = promise;
      promises.push(promise);
    });

    // drop pieces
    for (var yy = row; yy < config.board_height; yy++) {
      for (var xx = 0; xx < config.board_width; xx++) {
        var piece = state.board[yy][xx].piece;
        if (!piece) continue;
        // ugh, again, wrapping in closure to capture piece
        (function (piece) {
          // ensure we start the animation AFTER the row fades away
          var promise = Promise.all(
            promises.concat([piece.actions_promise])
          );
          piece.actions_promise = promise.then(function () {
            return kz.tween({
              object: piece,
              property: 'y',
              value: piece.y - config.grid_size,
              rate: 1
            });
          });
        })(piece);
      }
    }
  }

  function reverse(board_x, board_y) {
    var dxs = [1, -1, 0, 0, 1, 1, -1, -1];
    var dys = [0, 0, 1, -1, 1, -1, 1, -1];
    var piece_type = state.board[board_y][board_x].piece_type;

    if (piece_type == PieceTypes.Empty) return

    for (var ii = 0; ii < 8; ii++) {
      var dx = dxs[ii];
      var dy = dys[ii];
      var reverse = false;
      var length = 1;
      var x = board_x + length * dx;
      var y = board_y + length * dy;
      while (0 <= x
             && 0 <= y
             && x < config.board_width
             && y < config.board_height) {
        if (state.board[y][x].piece_type == PieceTypes.Empty) break;
        if (state.board[y][x].piece_type == piece_type) {
          reverse = true;
          break;
        }
        length++;
        x = board_x + length * dx;
        y = board_y + length * dy;
      }
      if (!reverse) continue;
      for (var jj = 1; jj < length; jj++) {
        var xx = board_x + jj * dx;
        var yy = board_y + jj * dy;
        state.board[yy][xx].piece_type = piece_type;
        var piece = state.board[yy][xx].piece;
        // ugh, creating a closure to capture the piece variable
        (function (piece) {
          piece.actions_promise = piece.actions_promise.then(function () {
            return new Promise(function(resolve) {
              piece.blend_type = piece_type;
              return kz.tween({
                object: piece,
                property: 'blend_alpha',
                value: 1,
                duration: 100
              }).then(function() {
                piece.type = piece.blend_type;
                piece.blend_type = 0;
                piece.blend_alpha = 0;
                resolve();
              });
            });
          });
        })(piece);
      }
    }
  }

  function addRow() {
    var new_row = [];
    for (var ii = 0; ii < config.board_width; ii++) {
      var piece_type = randomPieceType(normal_piece_types);
      new_row.push({
        piece_type: piece_type,
        piece: makePiece(
          board_to_piece(ii),
          board_to_piece(-1),
          piece_type
        )
      });
    }

    // update board
    for (var xx = 0; xx < config.board_width; xx++) {
      if (state.board[config.board_height-1][xx].piece_type
          != PieceTypes.Empty) {
        lose();
        return;
      }
      for (var yy = config.board_height-1; yy > 0; yy--) {
        state.board[yy][xx] = state.board[yy-1][xx];
      }
      state.board[0][xx] = new_row[xx];
    }

    // animate pieces
    //kz.resources.sounds.sfx_drop.play();
    state.board.forEach(function (row) {
      row.forEach(function (square) {
        var piece = square.piece;
        if (!piece) return;
        piece.actions_promise = piece.actions_promise.then(function () {
          return kz.tween({
            object: piece,
            property: 'y',
            value: piece.y + config.grid_size,
            rate: 1
          });
        });
      });
    });
  }
  /*$ Messy section of game logic */

  function initialize() {
    kz.resources.sounds.bgm_game.play(true);
  // initialize graphics
    graphics = {
      background_pattern: kz.context.createPattern(
        kz.resources.images.background,
        'repeat'),
      board_canvas: document.createElement('canvas'),
      info_canvas: document.createElement('canvas'),
      pause_canvas: document.createElement('canvas'),
      pause_alpha: 0,
      gameover_canvas: document.createElement('canvas'),
      gameover_background_alpha: 0,
      gameover_text_alpha: 0
    }

    graphics.board_canvas.width = config.board_width*config.grid_size;
    //graphics.board_canvas.height = (config.board_height+1)*config.grid_size;
    graphics.board_canvas.height = kz.canvas.height;
    graphics.board_context = graphics.board_canvas.getContext('2d');

    graphics.info_canvas.width = 95;
    graphics.info_canvas.height = 400;
    graphics.info_context = graphics.info_canvas.getContext('2d');

    graphics.gameover_canvas.width = 400;
    graphics.gameover_canvas.height = 400;
    graphics.gameover_context = graphics.gameover_canvas.getContext('2d');

    graphics.pause_canvas.width = 400;
    graphics.pause_canvas.height = 400;
    graphics.pause_context = graphics.pause_canvas.getContext('2d');

  // intialize state
    state = {
      alive: true,
      board: [],
      can_restart: false,
      score: 0,
      level: 1,
      next_row_interval: config.next_row_interval,
      next_row_time: 0
    };
    state.next_row_time = kz.performance.now() + state.next_row_interval;
    // initialize board
    for (var yy = 0; yy < config.board_height; yy++) {
      state.board.push([]);
      for (var xx = 0; xx < config.board_width; xx++) {
        // initialize board to have two random rows
        if (yy < 2) {
          var piece_type = randomPieceType(normal_piece_types);
          var piece = makePiece(
            board_to_piece(xx),
            board_to_piece(yy),
            piece_type
          );
          state.board[yy].push({
            piece_type: piece_type,
            piece: piece
          });
        } else {
          state.board[yy].push({
            piece_type: PieceTypes.Empty
          });
        }
      }
    }
    // initialize player
    state.player = new kz.Entity({
      frames: [
        kz.resources.images.shooter_0,
        kz.resources.images.shooter_1,
        kz.resources.images.shooter_2,
        kz.resources.images.shooter_3
      ],
      frame_lengths: [
        500,
        200,
        200,
        200
      ],
      current_frame: 0,
      animate_timer: kz.performance.now(),
      animate: function (now) {
        var dt = now - this.animate_timer;
        if (dt > this.frame_lengths[this.current_frame]) {
          this.current_frame++;
          this.current_frame %= this.frames.length;
          this.animate_timer = now;
        }
      },
      x: Math.floor(config.board_width/2),
      sprite_x: 4+Math.floor(config.board_width/2)*config.grid_size,
      sprite_y: config.board_height*config.grid_size+23,
      actions_promise: blankPromise(),
      draw: function (context) {
        context.drawImage(
          this.frames[this.current_frame],
          this.sprite_x,
          this.sprite_y);
        // draw aiming line
        var h;
        for (h = config.board_height-1; h >= 0; h--) {
          if (state.board[h][this.x].piece_type != PieceTypes.Empty) {
            break;
          }
        }
        graphics.board_context.save();
        graphics.board_context.globalAlpha = 1;
        graphics.board_context.lineWidth = 1;
        graphics.board_context.setLineDash([2, 8]);
        graphics.board_context.strokeStyle = '#8ed4a5';
        graphics.board_context.beginPath();
        graphics.board_context.moveTo(
          this.sprite_x+config.grid_size/2-5,
          this.sprite_y-8
        );
        graphics.board_context.lineTo(
          this.sprite_x+config.grid_size/2-5,
          (h+1) * config.grid_size + 20
        );
        graphics.board_context.stroke();
        graphics.board_context.restore();
      },
      listen: function (event) {
        if (event.kztype == 'keypress') {
          switch (event.which) {
            case kz.KEYS.LEFT:
              this.move(-1);
              break;
            case kz.KEYS.RIGHT:
              this.move(1);
              break;
            case kz.KEYS.Z:
              this.shoot();
              break;
          }
        } else if (event.kztype == 'keyheld') {
          switch (event.which) {
            case kz.KEYS.LEFT:
              this.move(-1);
              break;
            case kz.KEYS.RIGHT:
              this.move(1);
              break;
          }
        }
      },
      move: function (dx) {
        if (this.x+dx >= 0 && this.x+dx < config.board_width) {
          this.x += dx;
          this.actions_promise = this.actions_promise.then(function () {
            return kz.tween({
              object: this,
              property: 'sprite_x',
              value: this.sprite_x + dx*config.grid_size,
              rate: 0.7
            }).then(function () {
              return blankPromise();
            }.bind(this));
          }.bind(this));
        }
      },
      next: [],
      shoot : function() {
        if (state.board[config.board_height-1][this.x].piece_type
            != PieceTypes.Empty) {
          lose();
          return;
        }

        var piece_type = this.next.shift();
        this.next.push(randomPieceType(normal_piece_types));

        var target_y = config.board_height-1;
        while (target_y > 0) {
          if (state.board[target_y-1][this.x].piece_type
              != PieceTypes.Empty) {
            break;
          }
          target_y--;
        }
        var piece = makePiece(
          this.x*config.grid_size + 1,
          (config.board_height-1)*config.grid_size + 1,
          piece_type
        );
        state.board[target_y][this.x] = {
          piece_type: piece_type,
          piece: piece
        };
        reverse(this.x, target_y);

        piece.actions_promise = piece.actions_promise.then(function () {
          kz.resources.sounds.sfx_shoot.play();
          return kz.tween({
            object: piece,
            property: 'y',
            value: board_to_piece(target_y),
            rate: 3
          });
        });
       }
    });
    for (var ii = 0; ii < 8; ii++) {
      state.player.next.push(randomPieceType(normal_piece_types));
    }
  }

  //TODO: should rewrite things to use context.save and context.restore
  function drawAlive(now) {
    // clear contexts
    kz.context.clearAll();
    graphics.board_context.clearRect(
      0,
      0,
      graphics.board_canvas.width,
      graphics.board_canvas.height
    );
    graphics.info_context.clearRect(
      0,
      0,
      graphics.info_canvas.width,
      graphics.info_canvas.height
    );

    // board context drawing
      // background translucent box
    graphics.board_context.fillStyle = 'rgba(0,0,0,0.5)';
    graphics.board_context.fillRect(
      0,
      0,
      graphics.board_canvas.width,
      graphics.board_canvas.height
    );
      // draw board line
    graphics.board_context.save();
    graphics.board_context.globalAlpha = 1;
    graphics.board_context.lineWidth = 1;
    graphics.board_context.strokeStyle = '#50605b';
    graphics.board_context.beginPath();
    graphics.board_context.moveTo(
      0,
      config.board_height * config.grid_size + 20
    );
    graphics.board_context.lineTo(
      config.board_width * config.grid_size,
      config.board_height * config.grid_size + 20
    );
    graphics.board_context.stroke();
    graphics.board_context.restore();
      // draw pieces
    // TODO: This is extremely hacky and necessary so that we can draw
    // the pieces fading away after a row clear. Should rewrite to make
    // this better
    for (var id in kz.entities) {
      var piece = kz.entities[id];
      // only piece entities have a type field
      if (!piece.type) continue;
      graphics.board_context.globalAlpha = piece.alpha;
      graphics.board_context.drawImage(
        pieceTypeImage(piece.type),
        piece.x,
        piece.y+20
      );
      if (piece.blend_type) {
        graphics.board_context.globalAlpha = piece.blend_alpha;
        graphics.board_context.drawImage(
          pieceTypeImage(piece.blend_type),
          piece.x,
          piece.y+20
        );
      }
    };
      // draw player
    graphics.board_context.globalAlpha = 1;
    state.player.draw(graphics.board_context);

      // draw timer
    graphics.board_context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    graphics.board_context.fillRect(
      0,
      8,
      graphics.board_canvas.width,
      5
    );
    graphics.board_context.fillStyle = 'rgba(142, 212, 165, 1)';
    graphics.board_context.fillRect(
      0,
      8,
      graphics.board_canvas.width * (state.next_row_time - now) / state.next_row_interval,
      5
    );

    // info context drawing
      // draw translucent boxes
    graphics.info_context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // character box
    graphics.info_context.fillRect(
      0,
      20,
      graphics.info_canvas.width,
      graphics.info_canvas.width
    );
        // next pieces box
    graphics.info_context.fillRect(
      0,
      185,
      graphics.info_canvas.width,
      50
    );
        // score box
    graphics.info_context.fillRect(
      0,
      260,
      graphics.info_canvas.width,
      45
    );
        // level box
    graphics.info_context.fillRect(
      0,
      335,
      graphics.info_canvas.width,
      45
    );

      // draw text
    graphics.info_context.textAlign = 'center';
    graphics.info_context.textBaseline = 'center';
    graphics.info_context.font = '24px font';
    graphics.info_context.fillStyle = 'white';
    graphics.info_context.fillText('NEXT', 50, 205);
    graphics.info_context.fillText('SCORE', 50, 280);
    graphics.info_context.fillText('LEVEL', 50, 355);

    graphics.info_context.font = '20px font';
    graphics.info_context.fillText('' + state.level, 50, 375);
    var score_string = '' + state.score;
        // pad with zeroes
    score_string = '0'.repeat(5 - score_string.length) + score_string;
    graphics.info_context.fillText(score_string, 50, 300);

      // draw sprites
    for (var ii = 0; ii < config.next_length; ii++) {
      graphics.info_context.drawImage(
        pieceTypeImage(state.player.next[ii]),
        10+ii*config.grid_size,
        212
      );
    }

    // main context drawing
    kz.context.fillStyle = graphics.background_pattern;
    kz.context.fillRect(0, 0, kz.canvas.width, kz.canvas.height);
    kz.context.drawImage(graphics.board_canvas, 10, 0);
    kz.context.drawImage(
      graphics.info_canvas,
      10 + graphics.board_canvas.width + 10,
      0
    );
  }

  function preUpdateAlive(now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.KEYS.ESCAPE) {
        pause();
        kz.events = [];
        return;
      }
    }
    kz.processEvents();
    state.player.animate(now);
    if (state.next_row_time < now) {
      addRow();
      state.next_row_time = now + state.next_row_interval;
    }
    clearRow();
  }

  function drawPause(now) {
    kz.context.clearAll();
    kz.context.save();
    kz.context.globalAlpha = 1;
    kz.context.drawImage(
      graphics.pause_canvas,
      0,
      0
    );
    kz.context.globalAlpha = graphics.pause_alpha;
    kz.context.fillStyle = '#000000';
    kz.context.fillRect(
      0,
      0,
      kz.canvas.width,
      kz.canvas.height
    );
    kz.context.restore();
  }

  function drawDead(now) {
    kz.context.clearAll();
    kz.context.save();
    kz.context.globalAlpha = 1;
    kz.context.drawImage(
      graphics.gameover_canvas,
      0,
      0
    );
    kz.context.globalAlpha = graphics.gameover_background_alpha;
    kz.context.fillStyle = '#290000';
    kz.context.fillRect(
      0,
      0,
      kz.canvas.width,
      kz.canvas.height
    );
    kz.context.globalAlpha = graphics.gameover_text_alpha;
    kz.context.textAlign = 'center';
    kz.context.textBaseline = 'center';
    kz.context.font = '48px font';
    kz.context.strokeStyle = '#ce0000';
    kz.context.fillStyle = '#ffa100';
    kz.context.lineWidth = 6;
    kz.context.strokeText(
      'GAME OVER',
      kz.canvas.width / 2,
      kz.canvas.height / 2);
    kz.context.fillText(
      'GAME OVER',
      kz.canvas.width / 2,
      kz.canvas.height / 2);
    kz.context.restore();
  }

  function preUpdateDead(now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.KEYS.Z &&
          state.can_restart) {
        kz.tween({
          object: graphics,
          property: 'gameover_text_alpha',
          value: 0,
          duration: 1000
        }).then(function () {
          kz.run(scene_main_menu);
        });
      }
    }
    kz.events = [];
  }

  function preUpdatePause(now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.KEYS.ESCAPE) {
        resume();
      }
    }
    kz.events = [];
  }

  var scene_game = new kz.Scene();
  scene_game.initialize = initialize;
  scene_game.draw = function (now) {
    if (!kz.paused) {
      state.alive ? drawAlive(now) : drawDead(now);
    } else {
      drawPause(now);
    }
  };
  scene_game.preUpdate = function (now) {
    if (!kz.paused) {
      state.alive ? preUpdateAlive(now) : preUpdateDead(now);
    } else {
      preUpdatePause(now);
    }
  };
  scene_game.exit = function () {
    //kz.resources.sounds.bgm.stop();
  }
  return scene_game
})();
