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
    kz.context.font = '32px f';
    kz.context.fillStyle = '#fff';
    kz.context.fillText(
      'RECORDS',
      kz.canvas.width / 2,
      48
    );
    kz.context.font = '12px f';
    for (var ii = 0; ii < records.length; ii++) {
      kz.context.fillStyle = '#fff';
      kz.context.textAlign = 'left';
      kz.context.fillText(records[ii].text + ': ', 12, 90 + ii*20);
      kz.context.textAlign = 'right';
      kz.context.fillStyle = '#8ed4a5';
      var value;
      if (records[ii].name == 'total_time' || records[ii].name == 'max_time') {
        var time = getRecord(records[ii].name);
        var sec_string = '' + time%60;
        var min_string = '' + (Math.floor(time/60)%60);
        var hour_string = records[ii].name == 'total_time' ? '' + Math.floor(time/3600) + ':' : '';
        value = hour_string+'0'.repeat(2-min_string.length) + min_string + ':'  + '0'.repeat(2-sec_string.length)+sec_string;
      } else {
        value = getRecord(records[ii].name);
      }
      kz.context.fillText(value, kz.canvas.width-12, 90+ii*20);
    }

    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.KEYS.ESCAPE || kz.events[ii].which == kz.KEYS.Z) {
          state.exiting = true;
          kz.tween({
            object: graphics,
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
  };

  return scene;
})();
