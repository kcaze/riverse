var scene_character_select = (function () {
  var scene = new kz.Scene();
  var graphics;
  var state;

  var characters;

  scene.initialize = function () {
    characters = [
      {
        name: 'BOAR',
        image: kz.resources.images.character_boar
      },
      {
        name: 'CAT',
        image: kz.resources.images.character_cat
      },
      {
        name: 'DOG',
        image: kz.resources.images.character_dog
      },
      {
        name: 'DRAGON',
        image: kz.resources.images.character_dragon
      },
      {
        name: 'HARE',
        image: kz.resources.images.character_hare
      },
      {
        name: 'HORSE',
        image: kz.resources.images.character_horse
      },
      {
        name: 'MONKEY',
        image: kz.resources.images.character_monkey
      },
      {
        name: 'OX',
        image: kz.resources.images.character_ox
      },
      {
        name: 'RAT',
        image: kz.resources.images.character_rat
      },
      {
        name: 'ROOSTER',
        image: kz.resources.images.character_rooster
      },
      {
        name: 'SHEEP',
        image: kz.resources.images.character_sheep
      },
      {
        name: 'SNAKE',
        image: kz.resources.images.character_snake
      },
      {
        name: 'TIGER',
        image: kz.resources.images.character_tiger
      },
      {
        name: 'RANDOM',
        image: kz.resources.images.character_random
      }
    ];
  }

  scene.draw = function () {
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

    for (var yy = 0; yy < 7; yy++) {
      for (var xx = 0; xx < 2; xx++) {
        if (yy*2 + xx >= characters.length) break;
        kz.context.drawImage(
          characters[yy*2+xx].image,
          xx*49 + 10,
          yy*49 + 20
        )
      }
    }

  }

  scene.exit = function () {
  }

  return scene;
})();
