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
    kz.x.font = '32px f';
    kz.x.fillStyle = '#fff';
    kz.x.fillText(
      'RECORDS',
      kz.v.width / 2,
      48
    );
    kz.x.font = '12px f';
    for (var ii = 0; ii < records.length; ii++) {
      kz.x.fillStyle = '#fff';
      kz.x.textAlign = 'left';
      kz.x.fillText(records[ii].text + ': ', 12, 90 + ii*20);
      kz.x.textAlign = 'right';
      kz.x.fillStyle = '#8ed4a5';
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
      kz.x.fillText(value, kz.v.width-12, 90+ii*20);
    }

    kz.x.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.x.fillRect(0,0,kz.v.width,kz.v.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.K.X || kz.events[ii].which == kz.K.Z) {
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
