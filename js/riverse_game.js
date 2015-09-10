var previous_time;

var scene_game = (function () {
  var config = {
    board_width: 8,
    board_height: 17,
    grid_size: 20,
    next_length: 8,
    next_row_interval: 20000
  };
  var board_canvas = document.createElement('canvas');
  var info_canvas = document.createElement('canvas');
  var pause_canvas = document.createElement('canvas');
  var gameover_canvas = document.createElement('canvas');
  board_canvas.width = config.board_width*config.grid_size;
  board_canvas.height = 390;
  info_canvas.width = 96;
  info_canvas.height = 390;
  gameover_canvas.width = 280;
  gameover_canvas.height = 390;
  pause_canvas.width = 280;
  pause_canvas.height = 390;
  var board_context = board_canvas.getContext('2d');
  var info_context = info_canvas.getContext('2d');
  var gameover_context = gameover_canvas.getContext('2d');
  var pause_context = pause_canvas.getContext('2d');
  var PieceTypes = {
    Empty: 0,
    Red: 1,
    Blue: 2,
    Zodiac: 3
  };
  var normal_piece_types = [PieceTypes.Red, PieceTypes.Blue];

  var state;
  var pause_choice;
  var graphics;
  var bgm;

  function pause() {
    kz.pause();
    pause_choice = 0;
    // copy over game picture at pause time
    pause_context.clearRect(
      0,
      0,
      pause_canvas.width,
      pause_canvas.height
    );
    pause_context.drawImage(
      kz.canvas,
      0,
      0
    );
    kz.tween({
      object: graphics,
      property: 'pause_alpha',
      value: 0.8,
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
    return [
      kz.resources.images.piece_red,
      kz.resources.images.piece_blue,
      kz.resources.images.piece_zodiac
    ][piece_type-1];
  }

  function piece_to_board(piece_coord) {
    return Math.floor((piece_coord - 1) / 20);
  }

  function board_to_piece(board_coord) {
    return 1 + 20 * board_coord;
  }

  /*^ Messy section of game logic */
  function lose() {
    bgm.stop();
    state.alive = false;
    if (!localStorage.getItem('playcount')) {
      localStorage.setItem('playcount', '1');
    } else {
      localStorage.setItem('playcount', parseInt(localStorage.getItem('playcount'))+1);
    }
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
    gameover_context.clearRect(
      0,
      0,
      gameover_canvas.width,
      gameover_canvas.height
    );
    gameover_context.drawImage(
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
    var activateAbility = false;

    for (var yy = 0; yy < config.board_height; yy++) {
      var piece_type = state.board[yy][0].piece_type;
      var zodiacCounter = 0;
      var cleared = true;
      for (var xx = 0; xx < config.board_width; xx++) {
        if (state.board[yy][xx].piece_type == PieceTypes.Zodiac) {
          zodiacCounter++;
        }
        // wow, much hack. this works because zodiac = 3, so it ANDs with
        // both 1 (black) and 2 (white) to be nonzero.
        piece_type &= state.board[yy][xx].piece_type;
        if (piece_type == 0) {
          cleared = false;
          break;
        }
      }
      if (cleared) {
        if (zodiacCounter > 0) {
          activateAbility = true;
        }
        row = yy;
        break;
      }
    }

    if (typeof row === 'undefined') return;

    // update score
    incrementScore(1);
    state.rows_cleared += 1;
    if (!localStorage.getItem('highrows')
        || parseInt(localStorage.getItem('highrows')) < state.rows_cleared) {
      localStorage.setItem('highrows', ''+state.rows_cleared)
    }
    if (state.rows_cleared % 1 == 0) {
      state.level += 1;
      if (!localStorage.getItem('highlevel')
          || parseInt(localStorage.getItem('highlevel')) < state.level) {
        localStorage.setItem('highlevel', ''+state.level)
      }
      state.next_row_interval = Math.max(3000, state.next_row_interval - 750);
      console.log(state.next_row_interval);
    }

    // capture row pieces before we update board so we can animate them
    var row_pieces = [];
    for (var xx = 0; xx < config.board_width; xx++) {
      row_pieces.push(state.board[row][xx].piece);
    }

    // update of underlying board
    for (xx = 0; xx < config.board_width; xx++) {
      state.board[row][xx] = {
        piece_type: PieceTypes.Empty
      };
    }

    // animation
    animateClearPieces(row_pieces);

    if (!activateAbility) return;
    character.zodiac({
      state: state,
      animateClearPieces: animateClearPieces,
      animateColorChange: animateColorChange,
      config: config,
      incrementScore: incrementScore,
      row: row
    });
  }

  function animateClearPieces(pieces) {
    kz.resources.sounds.sfx_clear.play();
    // animate fade away
    // ensure that all row piece animations have finished
    var promise  = [];
    pieces.forEach(function (piece) {
      promise.push(piece.actions_promise);
    })
    promise = Promise.all(promise);
    pieces.forEach(function (piece) {
      var piecePromise = promise.then(function () {
        return kz.tween({
          object: piece,
          property: 'alpha',
          value: 0,
          duration: 100
        }).then(function () {
          piece.destroy();
        });
      });
      piece.actions_promise = piecePromise;
    });
  }

  function drop() {
    for (var yy = config.board_height-1; yy > 0; yy--) {
      for (var xx = 0; xx < config.board_width; xx++) {
        if (state.board[yy][xx].piece_type && !state.board[yy-1][xx].piece_type) {
          state.board[yy-1][xx] = state.board[yy][xx];
          state.board[yy][xx] = {
            piece_type: PieceTypes.Empty
          };
          var piece = state.board[yy-1][xx].piece;
          (function (piece) {
            // ensure we start the animation AFTER the row fades away
            piece.actions_promise = piece.actions_promise.then(function () {
              return kz.tween({
                object: piece,
                property: 'y',
                value: piece.y - config.grid_size,
                duration: 100
              });
            });
          })(piece);
        }
      }
    }
  }

  function reverse(board_x, board_y) {
    var dxs = [1, -1, 0, 0, 1, 1, -1, -1];
    var dys = [0, 0, 1, -1, 1, -1, 1, -1];
    var piece_type = state.board[board_y][board_x].piece_type;

    if (piece_type == PieceTypes.Empty || piece_type == PieceTypes.Zodiac) return

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
        if (state.board[y][x].piece_type == PieceTypes.Empty
          || state.board[y][x].piece_type == PieceTypes.Zodiac) break;
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
        animateColorChange(piece, piece_type);
      }
    }
  }

  function incrementScore(amount) {
    state.score += amount;
    if (!localStorage.getItem('highscore')
        || parseInt(localStorage.getItem('highscore')) < state.score) {
      localStorage.setItem('highscore', ''+state.score)
    }
  }

  function animateColorChange(piece, to_type) {
    piece.actions_promise = piece.actions_promise.then(function () {
      return new Promise(function(resolve) {
        piece.blend_type = to_type;
        kz.tween({
          object: piece,
          property: 'blend_alpha',
          value: 1,
          duration: 100
        }).then(function() {
          piece.type = to_type;
          piece.blend_type = 0;
          piece.blend_alpha = 0;
          resolve();
        });
      });
    });
  }

  function addRow() {
    kz.resources.sounds.sfx_drop.play();
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
    // if all colors the same, change the color of last one
    var piece_type = new_row[config.board_width-1].piece_type;
    for (var ii = 0; ii < config.board_width; ii++) {
      piece_type ^= new_row[ii].piece_type;
    }
    if (piece_type) {
      new_row[config.board_width-1].piece_type ^= 3;
      new_row[config.board_width-1].piece.type ^= 3;
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
    bgm = kz.resources.sounds.bgm_game.play(true);
    bgm.stop();
  // initialize graphics
    graphics = {
      background_pattern: kz.context.createPattern(
        kz.resources.images.background,
        'repeat'),
      pause_alpha: 0,
      gameover_background_alpha: 0,
      gameover_text_alpha: 0,
      fadeAlpha: 1
    }
    kz.tween({
      object: graphics,
      property: 'fadeAlpha',
      value: 0,
      duration: 100});


  // intialize state
    state = {
      alive: true,
      begin: kz.performance.now(),
      board: [],
      can_restart: false,
      score: 0,
      level: 1,
      rows_cleared: 0,
      next_row_interval: config.next_row_interval,
      next_row_time: 0,
      next_row_time_diff: 0,
      next_row_freeze: false
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
          // check if all colors if the same. if so, change the color of the last
          if (xx == config.board_width - 1) {
            var piece_type = state.board[yy][0].piece_type;
            for (var xxx = 0; xxx < config.board_width; xxx++) {
              piece_type &= state.board[yy][xxx].piece_type
            }
            if (piece_type) {
              state.board[yy][config.board_width - 1].piece_type ^= 3;
              state.board[yy][config.board_width - 1].piece.type ^= 3;
            }
          }
        } else {
          state.board[yy].push({
            piece_type: PieceTypes.Empty
          });
        }
      }
    }
    pause_choice = 0;
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
        board_context.save();
        board_context.globalAlpha = 1;
        board_context.lineWidth = 1;
        board_context.setLineDash([2, 8]);
        board_context.strokeStyle = '#8ed4a5';
        board_context.beginPath();
        board_context.moveTo(
          this.sprite_x+config.grid_size/2-5,
          this.sprite_y-8
        );
        board_context.lineTo(
          this.sprite_x+config.grid_size/2-5,
          (h+1) * config.grid_size + 20
        );
        board_context.stroke();
        board_context.restore();
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
        var next_piece_type = Math.random()*16 > 1
          ? randomPieceType(normal_piece_types)
          : PieceTypes.Zodiac;
        this.next.push(next_piece_type);

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
      if (Math.random()*16 < 1) {
        state.player.next[ii] = PieceTypes.Zodiac;
      }
    }
  }

  //TODO: should rewrite things to use context.save and context.restore
  function drawAlive(now) {
    // clear contexts
    kz.context.clearAll();
    board_context.clearRect(
      0,
      0,
      board_canvas.width,
      board_canvas.height
    );
    info_context.clearRect(
      0,
      0,
      info_canvas.width,
      info_canvas.height
    );

    // board context drawing
      // background translucent box
    board_context.fillStyle = 'rgba(0,0,0,0.5)';
    board_context.fillRect(
      0,
      0,
      board_canvas.width,
      board_canvas.height
    );
      // draw board line
    board_context.save();
    board_context.globalAlpha = 1;
    board_context.lineWidth = 1;
    board_context.strokeStyle = '#50605b';
    board_context.beginPath();
    board_context.moveTo(
      0,
      config.board_height * config.grid_size + 20
    );
    board_context.lineTo(
      config.board_width * config.grid_size,
      config.board_height * config.grid_size + 20
    );
    board_context.stroke();
    board_context.restore();
      // draw pieces
    // TODO: This is extremely hacky and necessary so that we can draw
    // the pieces fading away after a row clear. Should rewrite to make
    // this better
    for (var id in kz.entities) {
      var piece = kz.entities[id];
      // only piece entities have a type field
      if (!piece.type) continue;
      board_context.globalAlpha = piece.alpha;
      board_context.drawImage(
        pieceTypeImage(piece.type),
        piece.x,
        piece.y+20
      );
      if (piece.blend_type) {
        board_context.globalAlpha = piece.blend_alpha;
        board_context.drawImage(
          pieceTypeImage(piece.blend_type),
          piece.x,
          piece.y+20
        );
      }
    };
      // draw player
    board_context.globalAlpha = 1;
    state.player.draw(board_context);

      // draw timer
    board_context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    board_context.fillRect(
      0,
      8,
      board_canvas.width,
      5
    );
    if (state.next_row_freeze) {
      board_context.fillStyle = 'rgb(80, 96, 91)';
    } else {
      board_context.fillStyle = 'rgb(142, 212, 165)';
    }
    board_context.fillRect(
      0,
      8,
      board_canvas.width * (state.next_row_time - now) / state.next_row_interval,
      5
    );

    // info context drawing
      // draw translucent boxes
    info_context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // character box
    info_context.fillRect(
      0,
      10,
      info_canvas.width,
      info_canvas.width
    );
        // next pieces box
    info_context.fillRect(
      0,
      117,
      info_canvas.width,
      80
    );
        // score box
    info_context.fillRect(
      0,
      208,
      info_canvas.width,
      50
    );
        // level box
    info_context.fillRect(
      0,
      269,
      info_canvas.width,
      50
    );
        // time box
    info_context.fillRect(
      0,
      330,
      info_canvas.width,
      50
    );

      // draw text
    info_context.textAlign = 'center';
    info_context.textBaseline = 'top';
    info_context.font = '24px font';
    info_context.fillStyle = 'white';
    info_context.fillText('NEXT', 48, 120);
    info_context.fillText('SCORE', 48, 211);
    info_context.fillText('LEVEL', 48, 272);
    info_context.fillText('TIME', 48, 333);
    info_context.font = '20px font';
    info_context.textBaseline = 'bottom';
    info_context.fillText(character.name, 48, 101);

    info_context.font = '20px font';
    info_context.fillText('' + state.level, 48, 316);
    var score_string = '' + state.score;
        // pad with zeroes
    score_string = '0'.repeat(5 - score_string.length) + score_string;
    info_context.fillText(score_string, 48, 255);
    var time = Math.floor((kz.performance.now() - state.begin)/1000);
    var sec_string = '' + time%60;
    var min_string = '' + Math.floor(time/60);
    time_string = '0'.repeat(2-min_string.length) + min_string + ':'  + '0'.repeat(2-sec_string.length)+sec_string;
    info_context.fillText(time_string, 48, 377);

      // draw sprites
    for (var ii = 0; ii < config.next_length; ii++) {
      info_context.drawImage(
        pieceTypeImage(state.player.next[ii]),
        9+(ii%4)*config.grid_size,
        148 + Math.floor(ii/4)*23
      );
    }

    info_context.drawImage(
      character.image,
      23,
      20
    );

    // main context drawing
    kz.context.fillStyle = graphics.background_pattern;
    kz.context.fillRect(0, 0, kz.canvas.width, kz.canvas.height);
    kz.context.drawImage(board_canvas, 10, 0);
    kz.context.drawImage(
      info_canvas,
      10 + board_canvas.width + 7,
      0
    );
    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
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
    if (state.next_row_freeze) {
      state.next_row_time = now + state.next_row_time_diff;
    }
    if (state.next_row_time < now) {
      addRow();
      state.next_row_time = now + state.next_row_interval;
    }
    clearRow();
    drop();
  }

  function drawPause(now) {
    kz.context.clearAll();
    kz.context.save();
    kz.context.globalAlpha = 1;
    kz.context.drawImage(
      pause_canvas,
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
    kz.context.save();
    kz.context.textAlign = 'center';
    kz.context.textBaseline = 'center';
    kz.context.font = '24px font';
    kz.context.fillStyle = pause_choice == 0 ? '#fff' : '#666';
    kz.context.fillText('RESUME', kz.canvas.width/2, kz.canvas.height/2-48);
    kz.context.fillStyle = pause_choice == 1 ? '#fff' : '#666';
    kz.context.fillText('RESTART', kz.canvas.width/2, kz.canvas.height/2);
    kz.context.fillStyle = pause_choice == 2 ? '#fff' : '#666';
    kz.context.fillText('QUIT', kz.canvas.width/2, kz.canvas.height/2+48);
    kz.context.restore();
    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  function drawDead(now) {
    kz.context.clearAll();
    kz.context.save();
    kz.context.globalAlpha = 1;
    kz.context.drawImage(
      gameover_canvas,
      0,
      0
    );
    kz.context.globalAlpha = graphics.gameover_background_alpha;
    kz.context.fillStyle = 'rgb(142, 212, 165)';
    kz.context.fillRect(
      10,
      (kz.canvas.height / 2) - 28,
      160,
      42
    );
    kz.context.globalAlpha = graphics.gameover_text_alpha;
    kz.context.textAlign = 'center';
    kz.context.textBaseline = 'center';
    kz.context.font = '24px font';
    kz.context.fillStyle = '#fff';
    kz.context.fillText(
      'GAME OVER',
      kz.canvas.width / 2 - 46,
      kz.canvas.height / 2);
    kz.context.restore();
    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  function preUpdateDead(now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.KEYS.Z &&
          state.can_restart) {
        kz.tween({
          object: graphics,
          property: 'fadeAlpha',
          value: 1,
          duration: 100}).then(function () {
            kz.run(scene_main_menu);
          })
      }
    }
    kz.events = [];
  }

  function preUpdatePause(now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.KEYS.ESCAPE) {
          resume();
        } else if (kz.events[ii].which == kz.KEYS.DOWN) {
          pause_choice = Math.min(2, pause_choice+1);
        } else if (kz.events[ii].which == kz.KEYS.UP) {
          pause_choice = Math.max(0, pause_choice-1);
        } else if (kz.events[ii].which == kz.KEYS.Z) {
          resume();
          if (pause_choice == 0) {
          } else if (pause_choice == 1) {
            kz.tween({
              object: graphics,
              property: 'fadeAlpha',
              value: 1,
              duration: 100}).then(function () {
                kz.run(scene_game);
              });
          } else {
            kz.tween({
              object: graphics,
              property: 'fadeAlpha',
              value: 1,
              duration: 100}).then(function () {
                kz.run(scene_main_menu);
              });
          }
        }
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
    bgm.stop();
  }
  return scene_game
})();
