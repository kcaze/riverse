var scene_loading = new kz.Scene();

scene_loading.preUpdate = function (now) {
  kz.events = [];
};

scene_loading.draw = function (now) {
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

  text = ['LOADING', 'LOADING.', 'LOADING..', 'LOADING...']

  kz.context.save();
  kz.context.textAlign = 'center';
  kz.context.textBaseline = 'center';
  kz.context.font = '18px f';
  kz.context.fillStyle = 'rgb(142, 212, 165)';
  kz.context.lineWidth = 2;
  kz.context.fillText(
    text[Math.round(now/500)%4],
    kz.canvas.width / 2,
    kz.canvas.height / 2
  );
  kz.context.restore();
};
