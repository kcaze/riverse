// three '/' represents comments for minification purposes
var scene_main_menu = (function () {
  var scene_main_menu = new kz.Scene();
  var graphics;

  scene_main_menu.initialize = function () {
    graphics = {
      press_space_visible: true,
      blink: true,
      text_alpha: 1,
      fadeAlpha: 1,
      exiting: false
    };
    kz.tween({
      object: graphics,
      property: 'fadeAlpha',
      value: 0,
      duration: 100
    });
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
    kz.context.font = '48px font';
    ///kz.context.fillStyle = 'rgb(142, 212, 165)';
    kz.context.fillStyle = '#8ed4a5';
    kz.context.fillText(
      'ZODIAC 13',
      kz.canvas.width / 2,
      125
    );

    if (graphics.press_space_visible) {
      kz.context.save();
      kz.context.globalAlpha = graphics.text_alpha;
      ///kz.context.textAlign = 'center';
      ///kz.context.textBaseline = 'center';
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
    ///kz.context.textAlign = 'center';
    ///kz.context.textBaseline = 'center';
    kz.context.font = '10px font';
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
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.KEYS.Z &&
          !graphics.exiting) {
        kz.resources.sounds['sfx_select'].play();
        graphics.exiting = true;
        graphics.blink = false;
        graphics.press_space_visible = false;
        kz.tween({
          object: graphics,
          property: 'fadeAlpha',
          value: 1,
          duration: 100
        }).then(function () {
          kz.run(scene_character_select);
        });
      }
    }
    kz.events = [];

    if (graphics.blink) {
      if (Math.floor(now/300)%4 < 2) {
        graphics.press_space_visible = true;
      } else {
        graphics.press_space_visible = false;
      }
    }
  }

  return scene_main_menu;
})();
