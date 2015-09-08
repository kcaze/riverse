var scene_main_menu = (function () {
  var scene_main_menu = new kz.Scene();
  var graphics;
  var state;

  scene_main_menu.initialize = function () {
    //kz.resources.sounds.main_menu_bgm.loop(true);
    //kz.resources.sounds.main_menu_bgm.play();
    graphics = {
      press_space_visible: true,
      blink: true,
      text_alpha: 1
    };
    state = {
      pressed_space: false
    };
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

    if (graphics.press_space_visible) {
      kz.context.save();
      kz.context.globalAlpha = graphics.text_alpha;
      kz.context.textAlign = 'center';
      kz.context.textBaseline = 'center';
      kz.context.font = '24px font';
      kz.context.fillStyle = 'white';
      kz.context.fillText(
        'PRESS   Z',
        kz.canvas.width / 2,
        250
      );
      kz.context.restore();
    }

    kz.context.save();
    kz.context.globalAlpha = graphics.text_alpha;
    kz.context.textAlign = 'center';
    kz.context.textBaseline = 'center';
    kz.context.font = '10px font';
    kz.context.fillStyle = '#50605b';
    kz.context.lineWidth = 2;
    kz.context.fillText(
      'HERMAN CHAU (KCAZE)',
      kz.canvas.width / 2,
      380
    );
    kz.context.restore();
  }

  scene_main_menu.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.KEYS.Z &&
          !state.pressed_space) {
        state.pressed_space = true;
        graphics.blink = false;
        graphics.press_space_visible = false;
        kz.tween({
          object: graphics,
          property: 'text_alpha',
          value: 0,
          duration: 500
        }).then(function () {
          setTimeout(function () {
            kz.run(scene_game);
          }, 500);
        });
      }
    }
    kz.events = [];

    if (graphics.blink) {
      if (Math.floor(now/500)%4 < 2) {
        graphics.press_space_visible = true;
      } else {
        graphics.press_space_visible = false;
      }
    }
  }

  scene_main_menu.exit = function () {
    //kz.resources.sounds.main_menu_bgm.stop();
  }

  return scene_main_menu;
})();
