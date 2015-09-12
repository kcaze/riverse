
var kz = {};

/*^ Functions for loading resources */
// queue is an object with names as keys and image paths as values
kz.loadResources = function (resources) {
  var promises = [];
  kz.resources = {};

  promises.push(kz.loadImages(resources.images));
  promises.push(kz.loadSounds(resources.sounds));

  return Promise.all(promises)
    .then(function () {
      return kz.resources;
    });
};

kz.loadImages = function (queue) {
  var images = {};
  var promises = [];

  for (var key in queue) {
    promises.push(new Promise(function(resolve) {
      var c = queue[key];
      var canvas = document.createElement('canvas');
      images[key] = canvas;
      var image = new Image();
      image.addEventListener('load', function() {
        var context = canvas.getContext('2d');
        canvas.width = c.w
        canvas.height = c.h;
        if (c.f) {
          context.drawImage(image, c.x, c.y, c.W, c.H, (c.w-c.W)/2, (c.h-c.H)/2, c.W, c.H);
        } else {
          context.drawImage(image, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
        }
        resolve();
      });
      image.src = 's.png';
    }));
  }

  return Promise.all(promises)
                .then(function () {
                  kz.resources.images = images;
                  return kz.resources.images;
                });
};

kz.audio_context = new AudioContext();
kz.loadSounds = function (queue) {
  var sounds = {};
  var promises = [];

  for (var key in queue) {
    /*sounds[key] = {
      play: function () {}
    };*/
    promises.push(new Promise(function(resolve) {
      var name = key;
      queue[key].loader(queue[key].data, function(buffer) {
        sounds[name] = {
          play: function (loop) {
            loop = typeof loop == undefined ? false : loop;
            var source = kz.audio_context.createBufferSource();
            source.loop = loop;
            source.buffer = this.buffer;
            source.connect(kz.audio_context.destination);
            source.start(0);
            return source;
          },
          buffer: buffer
        };
        resolve();
      });
    }));
  }

  return Promise.all(promises)
                .then(function () {
                  kz.resources.sounds = sounds;
                  return kz.resources.sounds;
                });
};
/*$ Functions for loading resources */

/*^ Keys */
kz.KEYS = {
  ENTER: 13,
  ESCAPE: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  Z: 90
};

kz.keys_status = {};
for (var ii = 0; ii < 256; ii++) {
  kz.keys_status[ii] = 0;
}
/*$ Keys */

/*^ Touches */
kz.TOUCHES = {};
/*$ Touches */

/*^ Tween */
/**
 * kz.tween()
 *
 * Description:
 *  Does a simple linear tween for numerical values.
 * Returns:
 *  A promise which is resolved upon completion of the tween.
 * Expects:
 *   tween = {
 *     object: // object to tween
 *     property: // property on the object to tween
 *     value: // new value to tween the property to
 *     rate: // rate of tweening, units are 1/ms
 *     duration: // duration of the tweening, units are ms
 *   }
 *   Only one of 'rate' or 'duration' should be set.
 */
kz.tween = function (tween) {
  var start_time = performance.now();
  var old_value = tween.object[tween.property];
  var new_value = tween.value;
  var duration = tween.duration
    ? tween.duration
    : Math.abs(new_value - old_value) / tween.rate;

  return new Promise(function (resolve) {
    function update() {
      var time_elapsed = performance.now() - start_time;
      var t = time_elapsed / duration;
      if (t >= 1) {
        tween.object[tween.property] = new_value;
        resolve();
      } else {
        tween.object[tween.property] = t * new_value + (1 - t) * old_value;
        window.requestAnimationFrame(update);
      }
    }
    window.requestAnimationFrame(update);
  });
};
/*$ Tween */

/*^ Events */
kz.events = [];

kz.sendEvent = function(event) {
  kz.events.push(event);
}

kz.processEvents = function () {
  for (var ii = 0; ii < kz.events.length; ii++) {
    for (var id in kz.entities) {
      kz.entities[id].listen(kz.events[ii]);
    }
  }
  kz.events = [];
};
/*$ Events */

/*^ The Entity object */
kz.__entity_id__ = 0;
/**
 * @constructor
 */
kz.Entity = function (properties) {
  for (name in properties) {
    if (!properties.hasOwnProperty(name)) continue;
    this[name] = properties[name];
  }
  /*if (typeof this.x !== 'number') {
    throw 'Entity.x must be a number';
  }
  if (typeof this.y !== 'number') {
    throw 'Entity.y must be a number';
  }
  if (typeof this.listen !== 'function') {
    throw 'Entity.listen must be a function';
  }*/
  this.__entity_id__ = kz.__entity_id__;
  kz.entities[this.__entity_id__] = this;
  kz.__entity_id__++;
};

kz.Entity.prototype.x = 0;
kz.Entity.prototype.y = 0;
kz.Entity.prototype.listen = function () {
};
kz.Entity.prototype.destroy = function () {
  delete kz.entities[this.__entity_id__];
};
/*$ The Entity object */

/*^ The Scene object */
/**
 * @constructor
 */
kz.Scene = function () {};
/*kz.Scene = function (functions) {
  if (typeof functions.initialize === 'function') {
    this.initialize = functions.initialize;
    //throw 'Scene.initialize must be function';
  }
  if (typeof functions.preUpdate === 'function') {
    this.preUpdate = functions.preUpdate;
    //throw 'Scene.preUpdate must be function';
  }
  if (typeof functions.postUpdate === 'function') {
    this.postUpdate = functions.postUpdate;
    //throw 'Scene.postUpdate must be function';
  }
  if (typeof functions.draw === 'function') {
    this.draw = functions.draw;
    //throw 'Scene.draw must be function';
  }
};*/

kz.Scene.prototype.initialize = function () {
};

kz.Scene.prototype.preUpdate = function () {
};

kz.Scene.prototype.postUpdate = function () {
};

kz.Scene.prototype.draw = function () {
};

kz.Scene.prototype.exit = function () {
};

// duck-typing check
/*kz.isSceneLike = function(object) {
  return (object !== undefined &&
    object !== null &&
    typeof object.initialize === 'function' &&
    typeof object.preUpdate === 'function' &&
    typeof object.postUpdate === 'function' &&
    typeof object.draw === 'function');
};*/
/*$ The Scene object */

/*^ Essential functions such as initialize, tick, and run */
kz.initializeCanvas = function (canvas_id) {
  kz.canvas = document.getElementById(canvas_id);
  kz.context = kz.canvas.getContext('2d');
  kz.context.clearAll = function () {
    kz.context.clearRect(0, 0, kz.canvas.width, kz.canvas.height);
  };
};

kz.initialize = function (canvas_id) {
  kz.initializeCanvas(canvas_id);

  document.addEventListener('keydown', function(event) {
    event.preventDefault();
    if (kz.keys_status[event.which] == 0) {
      kz.keys_status[event.which] = 1;
      event.kztype = 'keypress';
    } else {
      event.kztype = 'keyheld';
    }
    kz.events.push(event);
  });

  document.addEventListener('keyup', function(event) {
    event.preventDefault();
    event.kztype = 'keyup';
    kz.keys_status[event.which] = 0;
    kz.events.push(event);
  });

  // touch events
  document.addEventListener('touchstart', function(event) {
    //event.preventDefault();
    for (var ii = 0; ii < event.touches.length; ii++) {
      var touch = event.touches[ii];
      if (kz.TOUCHES[touch.identifier]) continue;
      kz.TOUCHES[touch.identifier] = {
        initial: {x: touch.screenX, y: touch.screenY},
        current: {x: touch.screenX, y: touch.screenY}
      };
    }
  });

  document.addEventListener('touchmove', function(event) {
    event.preventDefault();
    for (var ii = 0; ii < event.touches.length; ii++) {
      var touch = event.touches[ii];
      if (!kz.TOUCHES[touch.identifier]) continue;
      kz.TOUCHES[touch.identifier].current = {x: touch.screenX, y:touch.screenY};
    }
  });

  document.addEventListener('touchend', function(event) {
    event.preventDefault();
    for (var id in kz.TOUCHES) {
      var found = false;
      for (var ii = 0; ii < event.touches.length; ii++) {
        if (event.touches[ii].identifier == id) found = true;
      }
      if (found) continue;
      var start_x = kz.TOUCHES[id].initial.x;
      var start_y = kz.TOUCHES[id].initial.y;
      var end_x = kz.TOUCHES[id].current.x;
      var end_y = kz.TOUCHES[id].current.y;
      if (Math.abs(start_x - end_x) + Math.abs(start_y - end_y) < 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.KEYS.Z
        });
      }
      if (Math.abs(start_y - end_y) < 60
                 && start_x - end_x > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.KEYS.LEFT
        });
      }
      if (Math.abs(start_y - end_y) < 60
                 && end_x - start_x > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.KEYS.RIGHT
        });
      }
      if (Math.abs(start_x - end_x) < 60
                 && end_y - start_y > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.KEYS.DOWN
        });
      }
      if (Math.abs(start_x - end_x) < 60
                 && start_y - end_y > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.KEYS.UP
        });
      }


      delete kz.TOUCHES[id];
    }
  });
};

var tickID;

kz.tick = function (now) {
  kz.scene.preUpdate(kz.performance.now());
  kz.scene.draw(kz.performance.now());
  kz.scene.postUpdate(kz.performance.now());
  tickID = window.requestAnimationFrame(kz.tick);
};

kz.run = function (scene) {
  if (tickID) {
    window.cancelAnimationFrame(tickID);
  }
  if (kz.scene) {
    kz.scene.exit();
  }
  //if (!kz.isSceneLike(scene)) throw 'No scene attached!';
  kz.entities = {};
  kz.scene = scene;
  kz.scene.initialize();
  kz.alive = true;
  tickID = window.requestAnimationFrame(kz.tick);
};

kz.performance = {
  pauseTime: 0,
  now: function () {
    if (kz.paused) {
        return kz.pauseNow;
    } else {
      return performance.now() - kz.performance.pauseTime;
    }
  }
};
kz.paused = false;
kz.pauseTime = 0;
kz.pause = function () {
  kz.pauseNow = kz.performance.now();
  kz.pauseTime = performance.now();
  kz.paused = true;
};
kz.resume = function () {
  kz.performance.pauseTime += performance.now() - kz.pauseTime;
  kz.paused = false;
};
/*$ Essential functions such as tick and run */
