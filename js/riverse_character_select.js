var character;
var scene_character_select = (function () {
  var scene = new kz.Scene();
  var state;

  var characters;

  scene.initialize = function () {
    state = {
      selected: 0,
      exiting: false,
      fadeAlpha: 1
    }
    kz.tween({
      object: state,
      property: 'fadeAlpha',
      value: 0,
      duration: 100});
    characters = [
      {
        description: 'ENDS TURN WHITE',
        name: 'BOAR',
        image: kz.r.images['character_boar'],
        unlock_message: '13 WHITE ORBS IN A ROW',
        unlocked: getRecord('max_white_orbs') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.config;
          for (var yy = 0; yy < config.board_height; yy++) {
            if (state.board[yy][0].piece_type && state.board[yy][0].piece_type != 1) {
              state.board[yy][0].piece_type = 1;
              data.animateColorChange(state.board[yy][0].piece, 1);
            }
            if (state.board[yy][config.board_width-1].piece_type && state.board[yy][config.board_width-1].piece_type != 1) {
              state.board[yy][config.board_width-1].piece_type = 1;
              data.animateColorChange(state.board[yy][config.board_width-1].piece, 1);
            }
          }
        }
      },
      {
        description: 'CLEAR ROW ABOVE',
        name: 'CAT',
        image: kz.r.images['character_cat'],
        unlocked: true,
        zodiac: function (data) {
          var state = data.state;
          var config = data.config;
          var row = data.row;
          row--;
          var row_pieces = [];
          for (var xx = 0; xx < config.board_width; xx++) {
            if (state.board[row][xx].piece) {
              row_pieces.push(state.board[row][xx].piece);
            }
          }
          for (xx = 0; xx < config.board_width; xx++) {
            state.board[row][xx] = {
              piece_type: 0
            };
          }
          data.animateClearPieces(row_pieces);
        }
      },
      {
        description: 'CLEAR LEFT SIDE',
        name: 'DOG',
        image: kz.r.images['character_dog'],
        unlock_message: '169 ORBS SHOT',
        unlocked: getRecord('total_orbs') >= 169,
        zodiac: function (data) {
          var board = data.state.board;
          var pieces = [];
          for (var yy = 0; yy < data.config.board_height; yy++) {
            if (board[yy][0].piece_type) {
              pieces.push(board[yy][0].piece);
              board[yy][0].piece_type = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        description: 'CLEAR 4 ON ENDS',
        name: 'DRAGON',
        image: kz.r.images['character_dragon'],
        unlock_message: 'SCORE 169',
        unlocked: getRecord('max_score') >= 169,
        zodiac: function(data) {
          var leftCounter = 4;
          var rightCounter = 4;
          var pieces = [];
          var board = data.state.board;
          var width = data.config.board_width;
          for (var yy = data.config.board_height - 1; yy >= 0; yy--) {
            if (leftCounter) {
              if (board[yy][0].piece_type) {
                pieces.push(board[yy][0].piece);
                board[yy][0].piece_type = 0;
                leftCounter--;
              }
            }
            if (rightCounter) {
              if (board[yy][width-1].piece_type) {
                pieces.push(board[yy][width-1].piece);
                board[yy][width-1].piece_type = 0;
                rightCounter--;
              }
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        description: 'CLEAR 12 RANDOM',
        name: 'HARE',
        image: kz.r.images['character_hare'],
        unlock_message: 'REACH LEVEL 13',
        unlocked: getRecord('max_level') >= 13,
        zodiac: function(data) {
          var board = data.state.board;
          var count = 0;
          var pieces = [];
          var piece_locs = [];
          for (var yy = 0; yy < data.config.board_height; yy++) {
            for (var xx = 0; xx < data.config.board_width; xx++) {
              if (board[yy][xx].piece_type) {
                piece_locs.push({x:xx,y:yy});
              }
            }
          }
          count = Math.min(piece_locs.length, 12);
          for (var ii = 0; ii < count; ii++) {
            var idx = Math.floor(Math.random()*piece_locs.length);
            var xx = piece_locs[idx].x;
            var yy = piece_locs[idx].y;
            pieces.push(board[yy][xx].piece);
            board[yy][xx].piece_type = 0;
            pieces.splice(idx, 1);
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        description: 'SCORE +2',
        name: 'HORSE',
        image: kz.r.images['character_horse'],
        unlock_message: 'ZODIAC 13 TIMES',
        unlocked: getRecord('total_zodiac') >= 13,
        zodiac: function(data) {
          data.incrementScore(2);
        }
      },
      {
        description: 'DELAY ROW DROP',
        name: 'MONKEY',
        image: kz.r.images['character_monkey'],
        unlock_message: 'ZODIAC 169 TIMES',
        unlocked: getRecord('total_zodiac') >= 169,
        zodiac: function (data) {
          var state = data.state;
          state.next_row_time_diff = state.next_row_time - kz.performance.now();
          state.next_row_freeze = true;
          setTimeout(function() {
            state.next_row_freeze = false;
          }, 5000);
        }
      },
      {
        description: 'ENDS TURN BLACK',
        name: 'OX',
        image: kz.r.images['character_ox'],
        unlock_message: '13 BLACK ORBS IN A ROW',
        unlocked: getRecord('max_black_orbs') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.config;
          for (var yy = 0; yy < config.board_height; yy++) {
            if (state.board[yy][0].piece_type && state.board[yy][0].piece_type != 2) {
              state.board[yy][0].piece_type = 2;
              data.animateColorChange(state.board[yy][0].piece, 2);
            }
            if (state.board[yy][config.board_width-1].piece_type && state.board[yy][config.board_width-1].piece_type != 2) {
              state.board[yy][config.board_width-1].piece_type = 2;
              data.animateColorChange(state.board[yy][config.board_width-1].piece, 2);
            }
          }
        }
      },
      {
        description: 'NEXT ALL WHITE',
        name: 'RAT',
        image: kz.r.images['character_rat'],
        unlock_message: '1313 ORBS SHOT',
        unlocked: getRecord('total_orbs') >= 1313,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.state.player.next[ii] = 1;
          }
        }
      },
      {
        description: 'CLEAR RIGHT SIDE',
        name: 'ROOSTER',
        image: kz.r.images['character_rooster'],
        unlock_message: 'SURVIVE 13 MINUTES',
        unlocked: getRecord('max_time') >= 13*60,
        zodiac: function (data) {
          var board = data.state.board;
          var pieces = [];
          var width = data.state.board_width;
          for (var yy = 0; yy < data.config.board_height; yy++) {
            if (board[yy][width-1].piece_type) {
              pieces.push(board[yy][width-1].piece);
              board[yy][width-1].piece_type = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        description: 'CLEAR TOP ROW',
        name: 'SHEEP',
        image: kz.r.images['character_sheep'],
        unlock_message: 'SCORE 13',
        unlocked: getRecord('max_score') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.config;
          var row_pieces = [];
          for (var xx = 0; xx < config.board_width; xx++) {
            if (state.board[0][xx].piece) {
              row_pieces.push(state.board[0][xx].piece);
            }
            state.board[0][xx] = {
              piece_type: 0
            };
          }
          data.animateClearPieces(row_pieces);
        }
      },
      {
        description: 'NEXT ALL BLACK',
        name: 'SNAKE',
        image: kz.r.images['character_snake'],
        unlock_message: 'PLAY 13 GAMES',
        unlocked: getRecord('play_count') >= 13,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.state.player.next[ii] = 2;
          }
        }
      },
      {
        description: 'SCORE +LEVEL/3',
        name: 'TIGER',
        image: kz.r.images['character_tiger'],
        unlock_message: '169 ROWS CLEARED',
        unlocked: getRecord('total_rows') >= 169,
        zodiac: function (data) {
          data.incrementScore(Math.floor(data.state.level/3));
        }
      },
      {
        description: '',
        name: 'RANDOM',
        image: kz.r.images['character_random'],
        unlocked: true
      }
    ];
  }

  scene.draw = function (now) {
    kz.context.clearAll();

    kz.context.save();
    kz.context.fillStyle = '#30403b';
    kz.context.fillRect(
      0,
      0,
      kz.canvas.width,
      kz.canvas.height
    );
    kz.context.restore();

    for (var yy = 0; yy < 7; yy++) {
      for (var xx = 0; xx < 2; xx++) {
        var idx = yy*2 + xx;
        if (idx >= characters.length) break;
        kz.context.strokeStyle = '#89928e';
        kz.context.lineWidth = 0.5;
        kz.context.fillStyle = '#50605b';
        kz.context.fillRect(xx*49 + 11, yy*49 + 21, 48, 48) ;
        kz.context.strokeRect(xx*49 + 10, yy*49 + 20, 50, 50) ;
        kz.context.drawImage(
          characters[idx].image,
          xx*49 + 10,
          yy*49 + 20
        )
        if (!characters[idx].unlocked) {
          kz.context.fillStyle = 'rgba(0,0,0,0.7)';
          kz.context.fillRect(xx*49 + 11, yy*49 + 21, 48, 48) ;
        }
      }
    }
    if (Math.floor(now/200) % 3) {
      kz.context.strokeStyle = '#fff';
      kz.context.lineWidth = 1;
      kz.context.strokeRect((state.selected%2)*49 + 10, Math.floor(state.selected/2)*49 + 20, 50, 50) ;
    }
    kz.context.textAlign = 'right';
    kz.context.textBaseline = 'center';
    kz.context.font = '24px f';
    kz.context.fillStyle = 'white';
    kz.context.fillText(
      characters[state.selected].name,
      kz.canvas.width - 10,
      330
    );
    kz.context.textAlign = 'right';
    kz.context.textBaseline = 'center';
    kz.context.font = '16px f';
    kz.context.fillStyle = 'white';
    if (characters[state.selected].unlocked) {
      kz.context.fillText(
        characters[state.selected].description,
        kz.canvas.width - 10,
        360
      );
    } else {
      kz.context.font = '12px f';
      kz.context.fillStyle = '#50605b';
      kz.context.fillText(
        characters[state.selected].unlock_message,
        kz.canvas.width - 10,
        360
      );
    }
    kz.context.fillStyle = 'rgba(0,0,0,'+state.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.K.R) {
          state.selected = Math.min(13, state.selected+1);
        } else if (kz.events[ii].which == kz.K.D) {
          state.selected = Math.min(13, state.selected+2);
        } else if (kz.events[ii].which == kz.K.L) {
          state.selected = Math.max(0, state.selected-1);
        } else if (kz.events[ii].which == kz.K.U) {
          state.selected = Math.max(0, state.selected-2);
        } else if (kz.events[ii].which == kz.K.Z) {
          if (state.selected == 13) {
            state.selected = Math.floor(Math.random() * 13);
            while (!characters[state.selected].unlocked) {
              state.selected = Math.floor(Math.random() * 13);
            }
          }
          if (characters[state.selected].unlocked) {
            kz.r.sounds['sfx_select'].play();
            character = characters[state.selected];
            state.exiting = true;
            kz.tween({
              object: state,
              property: 'fadeAlpha',
              value: 1,
              duration: 100
            }).then(function () {
              kz.run(scene_game);
            });
          } else {
            kz.r.sounds['sfx_denied'].play();
          }
        } else if (kz.events[ii].which == kz.K.X) {
          state.exiting = true;
          kz.tween({
            object: state,
            property: 'fadeAlpha',
            value: 1,
            duration: 100
          }).then(function () {
            kz.run(scene_main_menu);
          });
        }
      }
    }
    kz.events = [];
  }

  return scene;
})();
