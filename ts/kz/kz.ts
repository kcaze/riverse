/// <reference path="kz_entity.ts"/>
/// <reference path="kz_event.ts"/>
/// <reference path="kz_graphics.ts"/>
/// <reference path="kz_input.ts"/>
/// <reference path="kz_scene.ts"/>

module kz {
  var current_scene:kz.Scene;

  export function play(scene:kz.Scene) {
    scene.initialize();
    current_scene = scene;
  }

  function tick(now:number) {
    if (current_scene) {
      current_scene.update(now);
      current_scene.draw(now);
    }
    window.requestAnimationFrame(tick);
  }
  tick(0);
}
