var kz;
(function (kz) {
    var events = [];
    var Event = (function () {
        function Event(type, data) {
            if (data === void 0) { data = {}; }
            this.type = type;
            this.data = data;
        }
        Event.sendEvent = function (event) {
            events.push(event);
        };
        Event.getEvents = function () {
            var events_ = events;
            events = [];
            return events_;
        };
        return Event;
    })();
    kz.Event = Event;
})(kz || (kz = {}));
/// <reference path="kz_event"/>
var kz;
(function (kz) {
    var Entity = (function () {
        function Entity() {
            this.alpha = 1;
            this.id = Entity.id_counter++;
            Entity.entities[this.id] = this;
        }
        Entity.prototype.delete = function () {
            delete Entity.entities[this.id];
        };
        Entity.prototype.draw = function (context) { };
        Entity.prototype.listen = function (event) { };
        Entity.id_counter = 0;
        Entity.entities = [];
        return Entity;
    })();
    kz.Entity = Entity;
})(kz || (kz = {}));
var kz;
(function (kz) {
    var Canvas = (function () {
        function Canvas(width, height) {
            this.htmlCanvas = document.createElement('canvas');
            this.htmlCanvas.width = this.width = width;
            this.htmlCanvas.height = this.height = height;
            this.context = this.htmlCanvas.getContext('2d');
        }
        Canvas.prototype.appendToHTMLElement = function (element) {
            element.appendChild(this.htmlCanvas);
        };
        Canvas.prototype.clear = function () {
            this.context.clearRect(0, 0, this.width, this.height);
        };
        Canvas.prototype.draw = function (draw_function) {
            this.context.save();
            draw_function(this.context);
            this.context.restore();
        };
        return Canvas;
    })();
    kz.Canvas = Canvas;
})(kz || (kz = {}));
/// <reference path="kz_event.ts"/>
var kz;
(function (kz) {
    (function (KEYCODES) {
        KEYCODES[KEYCODES["ENTER"] = 13] = "ENTER";
        KEYCODES[KEYCODES["SPACE"] = 32] = "SPACE";
        KEYCODES[KEYCODES["LEFT"] = 37] = "LEFT";
        KEYCODES[KEYCODES["RIGHT"] = 39] = "RIGHT";
        KEYCODES[KEYCODES["Z"] = 90] = "Z";
    })(kz.KEYCODES || (kz.KEYCODES = {}));
    var KEYCODES = kz.KEYCODES;
    var key_pressed = new Array(256);
    document.addEventListener('keydown', function (event) {
        event.preventDefault();
        var key = event.which;
        if (!key_pressed[key]) {
            key_pressed[key] = true;
            kz.Event.sendEvent(new kz.Event('keypress', key));
        }
        else {
            kz.Event.sendEvent(new kz.Event('keyheld', key));
        }
    });
    document.addEventListener('keyup', function (event) {
        event.preventDefault();
        var key = event.which;
        key_pressed[key] = false;
        kz.Event.sendEvent(new kz.Event('keyrelease', key));
    });
})(kz || (kz = {}));
var kz;
(function (kz) {
    var scenes = {};
    var Scene = (function () {
        function Scene(initialize, update, draw) {
            if (initialize)
                this.initialize = initialize;
            if (update)
                this.update = update;
            if (draw)
                this.draw = draw;
        }
        Scene.registerScene = function (scene, name) {
            if (name in scenes) {
                throw "A scene with name '" + name + "' is already registered!";
            }
            scenes[name] = scene;
        };
        Scene.findScene = function (name) {
            if (!(name in scenes)) {
                throw "No scene with name '" + name + "' is registered!";
            }
            return scenes[name];
        };
        Scene.prototype.draw = function (now) { };
        Scene.prototype.initialize = function () { };
        Scene.prototype.update = function (now) { };
        return Scene;
    })();
    kz.Scene = Scene;
})(kz || (kz = {}));
/// <reference path="kz_entity.ts"/>
/// <reference path="kz_event.ts"/>
/// <reference path="kz_graphics.ts"/>
/// <reference path="kz_input.ts"/>
/// <reference path="kz_scene.ts"/>
var kz;
(function (kz) {
    var current_scene;
    function play(scene) {
        scene.initialize();
        current_scene = scene;
    }
    kz.play = play;
    function tick(now) {
        if (current_scene) {
            current_scene.update(now);
            current_scene.draw(now);
        }
        window.requestAnimationFrame(tick);
    }
    tick(0);
})(kz || (kz = {}));
/// <reference path="kz/kz.ts"/>
var canvas = new kz.Canvas(400, 400);
canvas.appendToHTMLElement(document.body);
function initialize() {
}
function draw(now) {
    canvas.draw(function (context) {
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
function update(now) {
    kz.Event.getEvents().forEach(function (event) {
        console.log(event.type, event.data);
    });
}
var scene = new kz.Scene(initialize, update, draw);
kz.play(scene);
