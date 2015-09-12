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
    kz.t({
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

    kz.x.textAlign = 'center';
    kz.x.textBaseline = 'center';
    kz.x.font = '48px f';
    kz.x.fillStyle = '#8ed4a5';
    kz.x.fillText(
      'ZODIAC 13',
      kz.v.width / 2,
      125
    );

    if (graphics.state == 0 && graphics.press_space_visible) {
      kz.x.save();
      kz.x.globalAlpha = graphics.text_alpha;
      kz.x.font = '24px f';
      kz.x.fillStyle = 'white';
      kz.x.fillText(
        'PRESS   Z',
        kz.v.width / 2,
        250
      );
      kz.x.restore();
    }
    if (graphics.state == 1) {
      kz.x.textAlign = 'center';
      kz.x.textBaseline = 'center';
      kz.x.font = '24px f';
      kz.x.fillStyle = graphics.choice == 0 ? '#fff' : '#666';
      kz.x.fillText('GAME START', kz.v.width/2, kz.v.height/2+40);
      kz.x.fillStyle = graphics.choice == 1 ? '#fff' : '#666';
      kz.x.fillText('RECORDS', kz.v.width/2, kz.v.height/2+88);
      kz.x.restore();
    }

    kz.x.save();
    kz.x.globalAlpha = graphics.text_alpha;
    kz.x.font = '10px f';
    kz.x.fillStyle = '#50605b';
    kz.x.lineWidth = 2;
    kz.x.fillText(
      'HERMAN CHAU (KCAZE)',
      kz.v.width / 2,
      380
    );
    kz.x.restore();
    kz.x.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.x.fillRect(0,0,kz.v.width,kz.v.height);
  }

  scene_main_menu.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress') {
        if (graphics.exiting) continue;
        if (kz.events[ii].which == kz.K.Z) {
          kz.r.sounds['sfx_select'].play();
          if (!graphics.state) {
            graphics.state = 1;
          } else {
            var s = graphics.choice ? scene_records : scene_character_select;
            graphics.exiting = true;
            kz.t({
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
      if (kz.events[ii].which == kz.K.U) {
        if (graphics.state) {
          graphics.choice = Math.max(0, graphics.choice-1);
        }
      }
      if (kz.events[ii].which == kz.K.D) {
        if (graphics.state) {
          graphics.choice = Math.min(1, graphics.choice+1);
        }
      }
    }
    kz.events = [];
  }

  return scene_main_menu;
})();
