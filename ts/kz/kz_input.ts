/// <reference path="kz_event.ts"/>

module kz {
  export enum KEYCODES {
    ENTER = 13,
    SPACE = 32,
    LEFT = 37,
    RIGHT = 39,
    Z = 90,
  }
  var key_pressed: Array<boolean> = new Array(256);

  document.addEventListener('keydown', function(event) {
    event.preventDefault();
    var key = event.which;

    if (!key_pressed[key]) {
      key_pressed[key] = true;
      kz.Event.sendEvent(new kz.Event('keypress', key));
    } else {
      kz.Event.sendEvent(new kz.Event('keyheld', key));
    }
  });

  document.addEventListener('keyup', function(event) {
    event.preventDefault();
    var key = event.which;

    key_pressed[key] = false;
    kz.Event.sendEvent(new kz.Event('keyrelease', key));
  });
}
