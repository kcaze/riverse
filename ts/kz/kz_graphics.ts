module kz {
  export class Canvas {
    constructor(width: number, height: number) {
      this.htmlCanvas = document.createElement('canvas');
      this.htmlCanvas.width = this.width = width;
      this.htmlCanvas.height = this.height = height;
      this.context = this.htmlCanvas.getContext('2d');
    }

    appendToHTMLElement(element: HTMLElement): void {
      element.appendChild(this.htmlCanvas);
    }

    clear(): void {
      this.context.clearRect(0, 0, this.width, this.height);
    }

    draw(draw_function: (context: CanvasRenderingContext2D)=>void) {
      this.context.save();
      draw_function(this.context);
      this.context.restore();
    }

    context: CanvasRenderingContext2D;
    htmlCanvas: HTMLCanvasElement;
    width: number;
    height: number;
  }
}
