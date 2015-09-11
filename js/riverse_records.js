var scene_records = (function () {
  var scene = new kz.Scene();
  var graphics;
  var state;

  scene.initialize = function () {
    graphics = {
      fadeAlpha: 1
    };
    kz.tween({
      object: graphics,
      property: 'fadeAlpha',
      value: 0,
      duration: 100
    });
    state = {
      exiting: false
    };
  }

  scene.draw = function () {
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
    kz.context.fillStyle = 'rgb(142, 212, 165)';
    kz.context.fillText(
      'RECORDS',
      kz.canvas.width / 2,
      125
    );

    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.KEYS.ESCAPE) {
          state.exiting = true;
          kz.tween({
            object: state,
            property: 'fadeAlpha',
            value: 1,
            duration: 100
          }).then(function () {
            kz.run(scene);
          });
        }
      }
    }
    kz.events = [];
  };

  return scene;
})();

