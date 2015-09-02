var Piece = (function() {
  var types = {
    Red: {
      name: 'red',
      image: kz.resources.images.piece_red,
      flip_images: [
        kz.resources.images.piece_red0,
        kz.resources.images.piece_red1,
        kz.resources.images.piece_red2
      ]
    },
    Blue: {
      name: 'blue',
      image: kz.resources.images.piece_blue,
      flip_images: [
        kz.resources.images.piece_blue0,
        kz.resources.images.piece_blue1,
        kz.resources.images.piece_bule2
      ]
    },
  };


  var Piece = function(type) {
    kz.Entity.call(this);
    this.name = type.name;
    this.image = piece_type.image;
    this.flip_images = piece_type.flip_images;
  };
  Piece.prototype = Object.create(kz.Entity.prototype);
  Piece.types = types;

  return Piece
});
