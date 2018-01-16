// *********
// * brush *
// *********

var brush = {
  cursorSize: 12,
  type: 'tri',
  color: 'rgba(0, 102, 204, .7)',
  tipDown: false,
  // drawShape functions -must be called by a canvas' context
  drawTriangle(x, y, size, filled) {
    var halfsize = size / 2;
    this.beginPath();
    this.moveTo(x, y-halfsize);
    this.lineTo(x+halfsize, y+halfsize);
    this.lineTo(x-halfsize, y+halfsize);
    this.closePath();
    filled ? this.fill() : this.stroke();
  },
  drawSquare(x, y, size, filled) {
    var halfsize = size / 2;
    filled ? this.fillRect(x - halfsize, y - halfsize, size, size)
      : this.strokeRect(x - halfsize, y - halfsize, size, size);
  },
  drawCircle(x, y, size, filled) {
    var halfsize = size / 2;
    this.beginPath();
    this.arc(x, y, halfsize, 0, 2 * Math.PI);
    filled ? this.fill() : this.stroke();
  },
  erase(x, y, size) {
    var halfsize = size / 2;
    this.clearRect(x - halfsize, y - halfsize, size, size);
  },
  paint(ctx, e) {
    var x = e.pageX - ctx.canvas.offsetLeft;
    var y = e.pageY - ctx.canvas.offsetTop;
    ctx.strokeStyle = brush.color;
    ctx.fillStyle = brush.color;

    switch (brush.type) {
    case 'tri':
      brush.drawTriangle.call(ctx, x, y, brush.cursorSize);
      break;
    case 'sq':
      brush.drawSquare.call(ctx, x, y, brush.cursorSize);
      break;
    case 'cir':
      brush.drawCircle.call(ctx, x, y, brush.cursorSize);
      break;
    case 'triSld':
      brush.drawTriangle.call(ctx, x, y, brush.cursorSize, true);
      break;
    case 'sqSld':
      brush.drawSquare.call(ctx, x, y, brush.cursorSize, true);
      break;
    case 'cirSld':
      brush.drawCircle.call(ctx, x, y, brush.cursorSize, true);
      break;
    default:
      brush.erase.call(ctx, x, y, brush.cursorSize);
    }
  },
};

// ******
// * ui *
// ******

var ui = {
  init() {
    this.resizeBrushButtons();
    this.drawBrushIcons();
    this.loadEraserIcon();
    this.setCursor();
  },
  resizeBrushButtons() {
    $('.brushbuttons canvas').each(function() {ui.changeButtonSize(this);});
    this.changeButtonSize('#eraser img');
  },
  drawBrushIcons() {
    this.drawIcon('#tri', brush.drawTriangle);
    this.drawIcon('#sq', brush.drawSquare);
    this.drawIcon('#cir', brush.drawCircle);
    this.drawIcon('#triSld', brush.drawTriangle, true);
    this.drawIcon('#sqSld', brush.drawSquare, true);
    this.drawIcon('#cirSld', brush.drawCircle, true);
  },
  drawIcon(id, drawFunction, filled) {
    // gets `button #id`'s canvas element, clears it, then draws the shape specified by
    // the drawFunction callback argument with the current brush color and size as arguments
    var btnCanvas = $(id +' canvas').get(0);
    var btnCtx = btnCanvas.getContext('2d');
    var x = brush.cursorSize / 2;
    var y = brush.cursorSize / 2;
    btnCtx.strokeStyle = brush.color;
    btnCtx.fillStyle = brush.color;
    app.clearCanvas.call(btnCtx);
    drawFunction.call(btnCtx, x, y, brush.cursorSize, filled);
  },
  eraserIcon: document.createElement('img'),
  loadEraserIcon() {
    // since eraser icon is an image jQuery has draw it to canvas
    // for the first time after its `load` event fires
    this.eraserIcon.src = 'images/remove.png';
    this.eraserIcon.onload = function() {
      ui.drawEraserIcon();
    };
  },
  drawEraserIcon() {
    var eraserCtx = $('#eraser canvas').get(0).getContext('2d');
    app.clearCanvas.call(eraserCtx);
    eraserCtx.drawImage(ui.eraserIcon, 0, 0, brush.cursorSize, brush.cursorSize);
  },
  setCursor() {
    var cursor = document.querySelector('.pure-button-active canvas').toDataURL('png');
    var midpoint = brush.cursorSize / 2;
    $('#maincanvas').css('cursor', 'url(' + cursor + ')' + midpoint + ' ' + midpoint + ', crosshair');
  },
  changeButtonSize() {
    $('button canvas').attr('width', brush.cursorSize);
    $('button canvas').attr('height', brush.cursorSize);
  },
};

// *******
// * app *
// *******

var app = {
  init() {
    // create handlebars function for gallery figure template, set the canvas and context attributes
    var galleryHtml =  $('#gallery_image_template').html();
    this.canvas = document.getElementById('maincanvas');
    this.ctx = this.canvas.getContext('2d');
    this.makeGalleryFig =  Handlebars.compile(galleryHtml),
    this.renderGallery();
    this.loadCustomColors();
  },
  gallery: [],
  renderGallery() {
    // if present, render saved images to gallery div
    var galleryJSON = localStorage.getItem('gallery');
    if (galleryJSON !== null && galleryJSON !== 'null' && galleryJSON !== '[]') {
      this.gallery = JSON.parse(galleryJSON);
      $('p i').text('Right click thumbnail and select "Save image as..." to save');
      var galleryHtml = this.makeGalleryFig({images: this.gallery});
      $('.gallery').append(galleryHtml);
    }
  },
  storedStates: [],
  redoStates: [],
  customColors: [],
  loadCustomColors() {
    var colorsJSON = localStorage.getItem('customColors');
    if (colorsJSON !== null && colorsJSON !== 'null') {
      this.customColors = JSON.parse(colorsJSON);
      this.customColors.forEach(function(color) {
        var option = document.createElement('option');
        $(option).attr('value', color);
        $('datalist').append(option);
      });
    }
  },
  clearCanvas() {
    var canvas = this.canvas;
    this.clearRect(0, 0, canvas.width, canvas.height);
  },
  saveToGallery() {
    // if nothing yet in gallery updates hint text, converts canvas to image data URL,
    // feeds URL to HandlebaHrs template function, appends reslting HTML to the
    // gallery div, adds data URL to app's gallery array
    if ($('.gallery figure').length === 0) {
      $('p i').text('Right click thumbnail and select "Save image as..." to save');
    }
    var img_src = this.canvas.toDataURL('png');
    var galleryHtml = app.makeGalleryFig({images: [img_src]});
    $('.gallery').append(galleryHtml);
    app.gallery.push(img_src);
  },
  updateLocalStorage() {
    var gallery = JSON.stringify(app.gallery);
    var customColors = JSON.stringify(app.customColors);
    localStorage.setItem('gallery', gallery);
    localStorage.setItem('customColors', customColors);
  },
  loadOnTop(el) {
    this.registerCanvasChange();
    var img  = $(el).parents('figure').find('img').get(0);
    this.ctx.drawImage(img, 0, 0);
  },
  loadToGallery(el) {
    this.clearCanvas.call(this.ctx);
    this.loadOnTop(el);
  },
  delete(el) {
    // identifies containing figure element and finds its index within
    // its sibling group, removes figure from page, uses index to splice out of app gallery array
    if ($('.gallery figure').length === 1) {
      $('p i').text('Nothing here...');
    }
    var $figure = $(el).parents('figure');
    var index = $('.gallery figure').index($figure);
    $figure.remove();
    this.gallery.splice(index, 1);
  },
  registerCanvasChange() {
    this.storeState();
    this.redoStates = [];
    $('#redo').addClass('pure-button-disabled');
  },
  storeState() {
    if (this.storedStates.length === 0) {
      $('#undo').removeClass('pure-button-disabled');
    }
    var previousState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.storedStates.push(previousState);
  },
  undo() {
    var storedCount = this.storedStates.length;
    var redoCount = this.redoStates.length;
    if (storedCount !== 0) {
      if (storedCount === 1) {
        $('#undo').addClass('pure-button-disabled');
      }
      var stateToRestore = this.storedStates.pop();
      var redoState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      if (redoCount === 0) {
        $('#redo').removeClass('pure-button-disabled')
      }
      this.ctx.putImageData(stateToRestore, 0, 0);
      this.redoStates.push(redoState);
    }
  },
  redo() {
    var stateCount = this.redoStates.length;
    if (stateCount !== 0) {
      if (this.redoStates.length === 1) {
        $('#redo').addClass('pure-button-disabled');
      }
      var stateToRestore = this.redoStates.pop();
      this.storeState();
      this.ctx.putImageData(stateToRestore, 0, 0);
    }
  },
};

// **********
// * jQuery *
// **********

$(function() {
  app.init();
  ui.init();

  $(app.canvas).mousedown(function(e) {
    app.registerCanvasChange();
    brush.tipDown = true;
    brush.paint(app.ctx, e);
  });

  $(app.canvas).mousemove(function(e) {
    if (brush.tipDown) {
      brush.paint(app.ctx, e);
    }
  });

  $(window).mouseup(function() {
    if (brush.tipDown) {
      brush.tipDown = false;
    }
  });

  $('#undo').click(function() {
    app.undo();
  });

  $('#redo').click('#redo', function() {
    app.redo();
  });

  $('.brushbuttons').on('click', 'button', function() {
    $('.pure-button-active').removeClass('pure-button-active');
    $(this).addClass('pure-button-active');
    brush.type = this.id;
    ui.setCursor();
  });

  // when color text input changes, update brush.color and redraw the button icons in the new color, update cursor
  $('#color').on('input', function() {
    var colorVal = $('#color').delay(100).val();
    if (colorVal) {
      brush.color = colorVal;
    }
    ui.drawBrushIcons();
    ui.setCursor();
  });

  // when focus is taken off color text input, add new color to hint list if
  // it is not already there (avoids adding every keystroke to list)
  $('#color').blur(function() {
    if ($('#colorlist').find('option[value="' + brush.color + '"]').length === 0) {
      $('#colorlist').append('<option value="' + brush.color + '">');
      app.customColors.push(brush.color);
    }
  });

  $('#brushsize').on('input', function() {
    brush.cursorSize = +$(this).val();
    ui.resizeBrushButtons();
    ui.drawBrushIcons();
    ui.drawEraserIcon();
    ui.setCursor();
  });

  $('.gallery').on('mouseenter', 'figure', function() {
    $(this).find('figcaption').show();
  });

  $('.gallery').on('mouseleave', 'figure', function() {
    $(this).find('figcaption').hide();
  });

  $('#save').click(function() {
    app.saveToGallery();
  });

  $('#clear').click(function(e) {
    e.preventDefault();
    if (confirm('Clear the canvas?')) {
      app.registerCanvasChange();
      app.clearCanvas.call(app.ctx);
    }
  });

  $('.gallery').on('click', '.load-on-top', function(e) {
    e.preventDefault();
    app.loadOnTop(this);
  });

  $('.gallery').on('click', '.load', function(e) {
    e.preventDefault();
    app.loadToGallery(this);
  });

  $('.gallery').on('click', '.delete', function(e) {
    e.preventDefault();
    if (confirm('Permanently delete this image?')) {
      app.delete(this);
    }
  });

  $(window).keydown(function(e) {
    // binds Ctrl/Cmd-Z to Undo, Ctrl/Cmd Y and Ctrl/Cmd+Shift+Z to Redo
    if (e.ctrlKey || e.metaKey) {
      if (e.which === 90) {
        if (e.shiftKey) {
          app.redo();
        } else {
          app.undo();
        }
      } else if (e.which === 89) {
        app.redo();
      }
    }
  });

  // when window closes or reloads updates localStorage gallery
  $(window).on('unload', function() {
    app.updateLocalStorage();
  });
});
