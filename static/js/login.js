var $window = $(window);

(function() {
  var canvas = $('.underlay')[0];
  var ctx = canvas.getContext('2d');
  var bodyBg = 'rgba(0, 0, 0, 0)';
  var lineColor = 'rgba(255, 255, 255, 0.5)';
  var vSpace = 25
  var hSpace = 120;
  var vLines;
  var hLines;

  function getGradient() {
    var grad = ctx.createLinearGradient(canvas.width / 2,
                                        canvas.height / 2,
                                        canvas.width / 2,
                                        canvas.height);
    grad.addColorStop(0, bodyBg);
    grad.addColorStop(1, lineColor);
    return grad;
  };

  function draw() {
    var start = -(hSpace * hLines / 3);
    ctx.strokeStyle = getGradient();
    var i;
    for (i = 0; i < hLines; i++) {
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
      ctx.lineTo(start + hSpace * i, canvas.height);
      ctx.closePath();
      ctx.stroke();
    }
    for (i = 0; i < vLines; i++) {
      var y = canvas.height - Math.sin(Math.PI / 2 * ((i + 1) / vLines)) * canvas.height / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.closePath();
      ctx.stroke();
    }
  };

  function resize() {
    canvas.width = $window.width();
    canvas.height = $window.height();
    vLines = Math.round((canvas.height / 2 / vSpace));
    hLines = Math.round((canvas.width / hSpace) * 3);
    draw();
  };

  $(window).on('resize', resize);
  resize();
})();

(function() {
  var $clip = $('.input-clip');
  var $inputs = $('input');
  
  $inputs.on('focus', function() {
    var $this = $(this);
    var offset = $this.position();
    $clip.css('top', offset.top)
      .addClass('active');
  });
  
  $inputs.on('blur', function() {
    $clip.removeClass('active');
  });
  
})();

