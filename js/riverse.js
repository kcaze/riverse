
var resources = {
  images: {
    'background': 'images/background.gif',
    'piece_blue': 'images/piece_blue0.gif',
    'piece_blue1': 'images/piece_blue1.gif',
    'piece_blue2': 'images/piece_blue2.gif',
    'piece_red': 'images/piece_red0.gif',
    'piece_red1': 'images/piece_red0.gif',
    'piece_red2': 'images/piece_red0.gif',
    'portrait_maduse': 'images/gggg.gif',
    'shooter_0': 'images/shooter0.gif',
    'shooter_1': 'images/shooter1.gif',
    'shooter_2': 'images/shooter2.gif',
    'shooter_3': 'images/shooter1.gif'
  },
  sounds: {
    'sfx_shoot' : jsfxr([2,0,0.2540739289484918,0.4,0.2864944875240326,0.8718781877541915,0.2,-0.2551874935626984,0,0,0,0,0,0.23003287834580988,0.15378500670194628,0,0,0,1,0,0,0,0,0.5])
  }
  /*sounds: {
    'sfx1': 'audio/sfx1.wav',
    'sfx_shoot': 'audio/sfx_shoot2.wav',
    'sfx_drop': 'audio/sfx_drop.wav',
    'bgm': 'audio/bgm.ogg',
    'main_menu_bgm': 'audio/main_menu_bgm.ogg'
  }*/
};

kz.loadResources(resources).then(function () {
  kz.initialize('g');
  kz.run(scene_main_menu);
});
