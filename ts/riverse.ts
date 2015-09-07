/// <reference path="kz/kz.ts"/>

var canvas = new kz.Canvas(400, 400);
canvas.appendToHTMLElement(document.body);

function initialize() {

}

function draw(now: number) {
  canvas.draw(function(context) {
    context.fillStyle = '#290000';
    context.fillRect(0, 0, canvas.width, canvas.height);
  });
  canvas.draw(function (context) {
    context.textAlign = 'center';
    context.textBaseline = 'center';
    context.font = '48px silom';
    context.strokeStyle = '#ce0000';
    context.fillStyle = '#ffa100';
    context.lineWidth = 6;
    context.strokeText('MONSTERS', canvas.width / 2, 110);
    context.fillText('MONSTERS', canvas.width / 2, 110);
    context.strokeText('REVERSED', canvas.width / 2, 170);
    context.fillText('REVERSED', canvas.width / 2, 170);
  });
}

function update(now: number) {
  kz.Event.getEvents().forEach(function(event:kz.Event) {
    console.log(event.type, event.data);
  })
}

var scene = new kz.Scene(initialize, update, draw);
kz.play(scene);
