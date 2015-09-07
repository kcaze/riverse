/// <reference path="kz_event"/>

module kz {
  export class Entity {
    private static id_counter = 0;
    static entities:Array<Entity> = [];

    alpha:number = 1;
    x:number;
    y:number;

    private id:number;

    constructor() {
      this.id = Entity.id_counter++;
      Entity.entities[this.id] = this;
    }

    delete(): void {
      delete Entity.entities[this.id];
    }
    draw(context:CanvasRenderingContext2D): void {}
    listen(event:kz.Event): void {}
  }
}
