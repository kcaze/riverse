module kz {
  var scenes = {};

  export class Scene {
    static registerScene(scene: Scene, name: string):void {
      if (name in scenes) {
        throw `A scene with name '${name}' is already registered!`;
      }
      scenes[name] = scene;
    }
    static findScene(name: string):Scene {
      if (!(name in scenes)) {
        throw `No scene with name '${name}' is registered!`;
      }
      return scenes[name];
    }

    constructor(
        initialize?: ()=>void,
        update?: (now:number)=>void,
        draw?: (now:number)=>void) {
      if (initialize) this.initialize = initialize;
      if (update) this.update = update;
      if (draw) this.draw = draw;
    }

    draw(now: number) {}
    initialize() {}
    update(now: number) {}
  }
}
