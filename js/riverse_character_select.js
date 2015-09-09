var character;
var scene_character_select = (function () {
  var scene = new kz.Scene();
  var graphics;
  var state;

  var characters;

  scene.initialize = function () {
    state = {
      selected: 0,
    }
    characters = [
      {
        description: 'ENDS TURN WHITE',
        name: 'BOAR',
        image: kz.resources.images.character_boar,
        unlock_message: '',
        unlocked: parseInt(localStorage.getItem('playcount')) >= 10
      },
      {
        description: 'CLEAR ROW ABOVE',
        name: 'CAT',
        image: kz.resources.images.character_cat,
        unlocked: true,
        zodiac: function(data) {
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
        image: kz.resources.images.character_dog,
        unlock_message: '',
        unlocked: false
      },
      {
        description: 'CLEAR 4 ON ENDS',
        name: 'DRAGON',
        image: kz.resources.images.character_dragon,
        unlock_message: '',
        unlocked: false
      },
      {
        description: 'CLEAR 12 RANDOM',
        name: 'HARE',
        image: kz.resources.images.character_hare,
        unlock_message: '',
        unlocked: false
      },
      {
        description: 'SCORE +2',
        name: 'HORSE',
        image: kz.resources.images.character_horse,
        unlock_message: '',
        unlocked: false
      },
      {
        description: 'DELAY ROW DROP',
        name: 'MONKEY',
        image: kz.resources.images.character_monkey,
        unlock_message: '',
        unlocked: false
      },
      {
        description: 'ENDS TURN BLACK',
        name: 'OX',
        image: kz.resources.images.character_ox,
        unlock_message: '',
        unlocked: false
      },
      {
        description: 'NEXT ALL WHITE',
        name: 'RAT',
        image: kz.resources.images.character_rat,
        unlock_message: '',
        unlocked: false
      },
      {
        description: 'CLEAR RIGHT SIDE',
        name: 'ROOSTER',
        image: kz.resources.images.character_rooster,
        unlock_message: '',
        unlocked: false
      },
      {
        description: 'CLEAR TOP ROW',
        name: 'SHEEP',
        image: kz.resources.images.character_sheep,
        unlock_message: '',
        unlocked: parseInt(localStorage.getItem('highscore')) >= 10
      },
      {
        description: 'NEXT ALL BLACK',
        name: 'SNAKE',
        image: kz.resources.images.character_snake,
        unlock_message: '',
        unlocked: false
      },
      {
        description: 'SCORE +LEVEL/3',
        name: 'TIGER',
        image: kz.resources.images.character_tiger,
        unlock_message: '',
        unlocked: false
      },
      {
        description: '',
        name: 'RANDOM',
        image: kz.resources.images.character_random,
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
    kz.context.font = '24px font';
    kz.context.fillStyle = 'white';
    kz.context.fillText(
      characters[state.selected].name,
      kz.canvas.width - 10,
      330
    );
    kz.context.textAlign = 'right';
    kz.context.textBaseline = 'center';
    kz.context.font = '16px font';
    kz.context.fillStyle = 'white';
    if (characters[state.selected].unlocked) {
      kz.context.fillText(
        characters[state.selected].description,
        kz.canvas.width - 10,
        360
      );
    } else {
      kz.context.fillText(
        'LOCKED',
        kz.canvas.width - 10,
        360
      );
    }
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.KEYS.RIGHT) {
          state.selected = Math.min(13, state.selected+1);
        } else if (kz.events[ii].which == kz.KEYS.DOWN) {
          state.selected = Math.min(13, state.selected+2);
        } else if (kz.events[ii].which == kz.KEYS.LEFT) {
          state.selected = Math.max(0, state.selected-1);
        } else if (kz.events[ii].which == kz.KEYS.UP) {
          state.selected = Math.max(0, state.selected-2);
        } else if (kz.events[ii].which == kz.KEYS.Z) {
          if (state.selected == 13) {
            state.selected = Math.floor(Math.random() * 14);
            while (!characters[state.selected].unlocked) {
              state.selected = Math.floor(Math.random() * 14);
            }
          }
          if (characters[state.selected].unlocked) {
            character = characters[state.selected];
            kz.run(scene_game);
          }
        }
      }
    }
    kz.events = [];
  }

  scene.exit = function () {
  }

  return scene;
})();
