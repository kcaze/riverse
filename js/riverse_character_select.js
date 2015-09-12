var character;
var scene_character_select = (function () {
  var scene = new kz.Scene();
  var state;

  var characters;

  scene.initialize = function () {
    state = {
      s: 0, //selected
      exiting: false,
      f: 1 //fadeAlpha
    }
    kz.t({
      object: state,
      property: 'f',
      value: 0,
      duration: 100});
    characters = [
      {
        d: 'ENDS TURN WHITE',
        name: 'BOAR',
        image: kz.r.i.b,
        m: '13 WHITE ORBS IN A ROW',
        u: getRecord('max_white_orbs') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.$c;
          for (var yy = 0; yy < config.w; yy++) {
            if (state.board[yy][0].piece_type && state.board[yy][0].piece_type != 1) {
              state.board[yy][0].piece_type = 1;
              data.animateColorChange(state.board[yy][0].piece, 1);
            }
            if (state.board[yy][config.w-1].piece_type && state.board[yy][config.w-1].piece_type != 1) {
              state.board[yy][config.w-1].piece_type = 1;
              data.animateColorChange(state.board[yy][config.w-1].piece, 1);
            }
          }
        }
      },
      {
        d: 'CLEAR ROW ABOVE',
        name: 'CAT',
        image: kz.r.i.c,
        u: true,
        zodiac: function (data) {
          var state = data.state;
          var config = data.$c;
          var row = data.row;
          row--;
          var row_pieces = [];
          for (var xx = 0; xx < config.w; xx++) {
            if (state.board[row][xx].piece) {
              row_pieces.push(state.board[row][xx].piece);
            }
          }
          for (xx = 0; xx < config.w; xx++) {
            state.board[row][xx] = {
              piece_type: 0
            };
          }
          data.animateClearPieces(row_pieces);
        }
      },
      {
        d: 'CLEAR LEFT SIDE',
        name: 'DOG',
        image: kz.r.i.d,
        m: '169 ORBS SHOT',
        u: getRecord('total_orbs') >= 169,
        zodiac: function (data) {
          var board = data.state.board;
          var pieces = [];
          for (var yy = 0; yy < data.$c.w; yy++) {
            if (board[yy][0].piece_type) {
              pieces.push(board[yy][0].piece);
              board[yy][0].piece_type = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        d: 'CLEAR 4 ON ENDS',
        name: 'DRAGON',
        image: kz.r.i.e,
        m: 'SCORE 169',
        u: getRecord('max_score') >= 169,
        zodiac: function(data) {
          var leftCounter = 4;
          var rightCounter = 4;
          var pieces = [];
          var board = data.state.board;
          var width = data.$c.w;
          for (var yy = data.$c.w - 1; yy >= 0; yy--) {
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
        d: 'CLEAR 12 RANDOM',
        name: 'HARE',
        image: kz.r.i.f,
        m: 'REACH LEVEL 13',
        u: getRecord('max_level') >= 13,
        zodiac: function(data) {
          var board = data.state.board;
          var count = 0;
          var pieces = [];
          var piece_locs = [];
          for (var yy = 0; yy < data.$c.w; yy++) {
            for (var xx = 0; xx < data.$c.w; xx++) {
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
        d: 'SCORE +2',
        name: 'HORSE',
        image: kz.r.i.g,
        m: 'ZODIAC 13 TIMES',
        u: getRecord('total_zodiac') >= 13,
        zodiac: function(data) {
          data.incrementScore(2);
        }
      },
      {
        d: 'DELAY ROW DROP',
        name: 'MONKEY',
        image: kz.r.i.h,
        m: 'ZODIAC 169 TIMES',
        u: getRecord('total_zodiac') >= 169,
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
        d: 'ENDS TURN BLACK',
        name: 'OX',
        image: kz.r.i.i,
        m: '13 BLACK ORBS IN A ROW',
        u: getRecord('max_black_orbs') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.$c;
          for (var yy = 0; yy < $c.w; yy++) {
            if (state.board[yy][0].piece_type && state.board[yy][0].piece_type != 2) {
              state.board[yy][0].piece_type = 2;
              data.animateColorChange(state.board[yy][0].piece, 2);
            }
            if (state.board[yy][config.w-1].piece_type && state.board[yy][config.w-1].piece_type != 2) {
              state.board[yy][config.w-1].piece_type = 2;
              data.animateColorChange(state.board[yy][config.w-1].piece, 2);
            }
          }
        }
      },
      {
        d: 'NEXT ALL WHITE',
        name: 'RAT',
        image: kz.r.i.k,
        m: '1313 ORBS SHOT',
        u: getRecord('total_orbs') >= 1313,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.state.player.next[ii] = 1;
          }
        }
      },
      {
        d: 'CLEAR RIGHT SIDE',
        name: 'ROOSTER',
        image: kz.r.i.l,
        m: 'SURVIVE 13 MINUTES',
        u: getRecord('max_time') >= 13*60,
        zodiac: function (data) {
          var board = data.state.board;
          var pieces = [];
          var width = data.state.w;
          for (var yy = 0; yy < data.$c.w; yy++) {
            if (board[yy][width-1].piece_type) {
              pieces.push(board[yy][width-1].piece);
              board[yy][width-1].piece_type = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        d: 'CLEAR TOP ROW',
        name: 'SHEEP',
        image: kz.r.i.m,
        m: 'SCORE 13',
        u: getRecord('max_score') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.$c;
          var row_pieces = [];
          for (var xx = 0; xx < config.w; xx++) {
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
        d: 'NEXT ALL BLACK',
        name: 'SNAKE',
        image: kz.r.i.n,
        m: 'PLAY 13 GAMES',
        u: getRecord('play_count') >= 13,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.state.player.next[ii] = 2;
          }
        }
      },
      {
        d: 'SCORE +LEVEL/3',
        name: 'TIGER',
        image: kz.r.i.o,
        m: '169 ROWS CLEARED',
        u: getRecord('total_rows') >= 169,
        zodiac: function (data) {
          data.incrementScore(Math.floor(data.state.level/3));
        }
      },
      {
        d: '',
        name: 'RANDOM',
        image: kz.r.i.p,
        u: true
      }
    ];
  }

  scene.draw = function (now) {
    kz.x.clearAll();

    kz.x.save();
    kz.x.fillStyle = '#30403b';
    kz.x.fillRect(
      0,
      0,
      kz.v.width,
      kz.v.height
    );
    kz.x.restore();

    for (var yy = 0; yy < 7; yy++) {
      for (var xx = 0; xx < 2; xx++) {
        var idx = yy*2 + xx;
        if (idx >= characters.length) break;
        kz.x.strokeStyle = '#89928e';
        kz.x.lineWidth = 0.5;
        kz.x.fillStyle = '#50605b';
        kz.x.fillRect(xx*49 + 11, yy*49 + 21, 48, 48) ;
        kz.x.strokeRect(xx*49 + 10, yy*49 + 20, 50, 50) ;
        kz.x.drawImage(
          characters[idx].image,
          xx*49 + 10,
          yy*49 + 20
        )
        if (!characters[idx].u) {
          kz.x.fillStyle = 'rgba(0,0,0,0.7)';
          kz.x.fillRect(xx*49 + 11, yy*49 + 21, 48, 48) ;
        }
      }
    }
    if (Math.floor(now/200) % 3) {
      kz.x.strokeStyle = '#fff';
      kz.x.lineWidth = 1;
      kz.x.strokeRect((state.s%2)*49 + 10, Math.floor(state.s/2)*49 + 20, 50, 50) ;
    }
    kz.x.textAlign = 'right';
    kz.x.textBaseline = 'center';
    kz.x.font = '24px f';
    kz.x.fillStyle = 'white';
    kz.x.fillText(
      characters[state.s].name,
      kz.v.width - 10,
      330
    );
    kz.x.textAlign = 'right';
    kz.x.textBaseline = 'center';
    kz.x.font = '16px f';
    kz.x.fillStyle = 'white';
    if (characters[state.s].u) {
      kz.x.fillText(
        characters[state.s].d,
        kz.v.width - 10,
        360
      );
    } else {
      kz.x.font = '12px f';
      kz.x.fillStyle = '#50605b';
      kz.x.fillText(
        characters[state.s].m,
        kz.v.width - 10,
        360
      );
    }
    kz.x.fillStyle = 'rgba(0,0,0,'+state.f+')';
    kz.x.fillRect(0,0,kz.v.width,kz.v.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.K.R) {
          state.s = Math.min(13, state.s+1);
        } else if (kz.events[ii].which == kz.K.D) {
          state.s = Math.min(13, state.s+2);
        } else if (kz.events[ii].which == kz.K.L) {
          state.s = Math.max(0, state.s-1);
        } else if (kz.events[ii].which == kz.K.U) {
          state.s = Math.max(0, state.s-2);
        } else if (kz.events[ii].which == kz.K.Z) {
          if (state.s == 13) {
            state.s = Math.floor(Math.random() * 13);
            while (!characters[state.s].u) {
              state.s = Math.floor(Math.random() * 13);
            }
          }
          if (characters[state.s].u) {
            kz.r.sounds['sfx_select'].play();
            character = characters[state.s];
            state.exiting = true;
            kz.t({
              object: state,
              property: 'f',
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
          kz.t({
            object: state,
            property: 'f',
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
