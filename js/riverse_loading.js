var scene_loading = new kz.Scene();

scene_loading.preUpdate = function (now) {
  kz.events = [];
};

scene_loading.draw = function (now) {
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

  text = ['LOADING', 'LOADING.', 'LOADING..', 'LOADING...']

  kz.x.save();
  kz.x.textAlign = 'center';
  kz.x.textBaseline = 'center';
  kz.x.font = '18px f';
  kz.x.fillStyle = 'rgb(142, 212, 165)';
  kz.x.lineWidth = 2;
  kz.x.fillText(
    text[Math.round(now/500)%4],
    kz.v.width / 2,
    kz.v.height / 2
  );
  kz.x.restore();
};
