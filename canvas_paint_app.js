var brushShape = 'tri';
var color = 'rgba(0, 102, 204, .7)';
var draw = false;
var CURSORSIZE = 12;
function drawTriangle(x, y, size) {
  var halfsize = size / 2;
  this.beginPath();
  this.moveTo(x, y-halfsize);
  this.lineTo(x+halfsize, y+halfsize);
  this.lineTo(x-halfsize, y+halfsize);
  this.closePath();
  this.stroke();
}

function drawSquare(x, y, size) {
  var halfsize = size / 2;
  this.strokeRect(x - halfsize, y - halfsize, size, size);
}

function drawCircle(x, y, size) {
  var halfsize = size / 2;
  this.beginPath();
  this.arc(x, y, halfsize, 0, 2 * Math.PI);
  this.stroke();
}

function clearCanvas() {
  var canvas = this.canvas;
  this.clearRect(0, 0, canvas.width, canvas.height);
}

function drawButtonIcons() {
  drawIcon('#tri', drawTriangle);
  drawIcon('#sq', drawSquare);
  drawIcon('#cir', drawCircle);
}

function drawIcon(selector, drawFunction) {
  var btnCanvas = document.querySelector(selector +' canvas');
  var btnCtx = btnCanvas.getContext('2d');
  var x = btnCanvas.width / 2;
  var y = btnCanvas.height / 2;
  btnCtx.strokeStyle = color;
  clearCanvas.call(btnCtx);
  drawFunction.call(btnCtx, x, y, CURSORSIZE);
}

$(function() {
  var canvas = document.getElementById('maincanvis');
  var ctx = canvas.getContext('2d');

  function paint(e) {
    var x = e.pageX - canvas.offsetLeft;
    var y = e.pageY - canvas.offsetTop;
    ctx.strokeStyle = color;

    if (brushShape === 'tri') {
      drawTriangle.call(ctx, x, y, CURSORSIZE);
    } else if (brushShape === 'sq') {
      drawSquare.call(ctx, x, y, CURSORSIZE);
    } else {
      drawCircle.call(ctx, x, y, CURSORSIZE);
    }
  }

  // append a canvas to each brushShape selection button then draw the respective shapes on them
  $('.brushShape').each(function() {
    $(this).append('<canvas width="' + CURSORSIZE + '" height="' + CURSORSIZE + '"></canvas>');
  });

  drawButtonIcons();

  $(canvas).mousedown(function() {
    draw = true;
  });

  $(window).mouseup(function(e) {
    paint(e);
    draw = false;
  });

  $(canvas).mousemove(function(e) {
    if (draw) {
      paint(e);
    }
  });


  $('.brushShape').click(function(e) {
    e.preventDefault();
    $('.selected').removeClass('selected');
    $(this).addClass('selected');
    brushShape = this.id;
  });


  // when color text input changes, update the high-level color var and redraw the button icons in the new color
  $('#color').on('input', function() {
    var colorVal = $('#color').delay(16).val();
    if (colorVal) {
      color = colorVal;
    }
    drawButtonIcons();
  });

  // when focus is taken off color text input, add new color to hint list if
  // it is not already there (avoids adding every keystroke to list)
  $('#color').blur(function() {
    if ($('#colorlist').find('option[value="' + color + '"]').length === 0) {
      $('#colorlist').append('<option value="' + color + '">');
    }
  });

  $('#clear').click(function(e) {
    e.preventDefault();
    if (confirm('Clear the canvas?')) {
      clearCanvas.call(ctx);
    }
  });
});
