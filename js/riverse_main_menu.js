// three '/' represents comments for minification purposes
var scene_main_menu = (function () {
  var scene_main_menu = new kz.Scene();
  var graphics;

  scene_main_menu.initialize = function () {
    graphics = {
      press_space_visible: 1,
      text_alpha: 1,
      fadeAlpha: 1,
      exiting: false,
      choice: 0,
      state: 0
    };
    kz.tween({
      object: graphics,
      property: 'fadeAlpha',
      value: 0,
      duration: 100
    });
    graphics.blinkID = setInterval(function() {
      graphics.press_space_visible ^= 1;
    }, 400);
  }

  scene_main_menu.draw = function () {
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

    kz.context.textAlign = 'center';
    kz.context.textBaseline = 'center';
    kz.context.font = '48px f';
    ///kz.context.fillStyle = 'rgb(142, 212, 165)';
    kz.context.fillStyle = '#8ed4a5';
    kz.context.fillText(
      'ZODIAC 13',
      kz.canvas.width / 2,
      125
    );

    if (graphics.state == 0 && graphics.press_space_visible) {
      kz.context.save();
      kz.context.globalAlpha = graphics.text_alpha;
      ///kz.context.textAlign = 'center';
      ///kz.context.textBaseline = 'center';
      kz.context.font = '24px f';
      kz.context.fillStyle = 'white';
      kz.context.fillText(
        'PRESS   Z',
        kz.canvas.width / 2,
        250
      );
      kz.context.restore();
    }
    if (graphics.state == 1) {
      kz.context.textAlign = 'center';
      kz.context.textBaseline = 'center';
      kz.context.font = '24px f';
      kz.context.fillStyle = graphics.choice == 0 ? '#fff' : '#666';
      kz.context.fillText('GAME START', kz.canvas.width/2, kz.canvas.height/2+40);
      kz.context.fillStyle = graphics.choice == 1 ? '#fff' : '#666';
      kz.context.fillText('RECORDS', kz.canvas.width/2, kz.canvas.height/2+88);
      kz.context.restore();
    }

    kz.context.save();
    kz.context.globalAlpha = graphics.text_alpha;
    ///kz.context.textAlign = 'center';
    ///kz.context.textBaseline = 'center';
    kz.context.font = '10px f';
    kz.context.fillStyle = '#50605b';
    kz.context.lineWidth = 2;
    kz.context.fillText(
      'HERMAN CHAU (KCAZE)',
      kz.canvas.width / 2,
      380
    );
    kz.context.restore();
    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  scene_main_menu.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress') {
        if (graphics.exiting) continue;
        if (kz.events[ii].which == kz.KEYS.Z) {
          kz.resources.sounds['sfx_select'].play();
          if (!graphics.state) {
            graphics.state = 1;
          } else {
            var s = graphics.choice ? scene_records : scene_character_select;
            graphics.exiting = true;
            kz.tween({
              object: graphics,
              property: 'fadeAlpha',
              value: 1,
              duration: 100
            }).then(function () {
              clearInterval(graphics.blinkID);
              kz.run(s);
            });
          }
        }
      }
      if (kz.events[ii].which == kz.KEYS.UP) {
        if (graphics.state) {
          graphics.choice = Math.max(0, graphics.choice-1);
        }
      }
      if (kz.events[ii].which == kz.KEYS.DOWN) {
        if (graphics.state) {
          graphics.choice = Math.min(1, graphics.choice+1);
        }
      }
    }
    kz.events = [];
  }

  return scene_main_menu;
})();
