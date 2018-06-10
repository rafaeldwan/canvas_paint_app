const log = (x) => console.log(x);

const INITIAL_BRANCH_ANGLE_RANGES = [[150, 90], [90, 30]],
  TRUNK_SCALE = 7, // multiplied by brush size for trunk length
  TRUNK_TO_FIRST_BRANCH_SCALE = 0.6;

const INITIAL_BRUSH_COLOR = 'rgba(0, 102, 204, .7)';

const Tree = {
  currentBranchId: 0,
  create() {
    let newTree = Object.create(Tree);
    newTree.branchNodes = [];
    newTree.leftAngleRange = INITIAL_BRANCH_ANGLE_RANGES[0].slice();
    newTree.rightAngleRange = INITIAL_BRANCH_ANGLE_RANGES[1].slice();

    newTree.lineWidth = brush.cursorSize; //random.int(TREE_WIDTH_RANGE[0], TREE_WIDTH_RANGE[1]);
    newTree.trunkLength = brush.cursorSize * TRUNK_SCALE; // random.int(TREE_TRUNK_RANGE[0], TREE_TRUNK_RANGE[1]);
    newTree.branchLength = newTree.trunkLength * TRUNK_TO_FIRST_BRANCH_SCALE;
    return newTree;
  },

  draw(x, y, ctx) {
    let tree = Tree.create();

    ctx.lineWidth = tree.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';

    tree.drawTrunk(x, y, ctx);
    tree.drawBranches(ctx);
    // ctx.closePath()
    // ctx.stroke()
    // console.log(tree.branchNodes)
  },
  drawTrunk(x, y, ctx) {


    ctx.beginPath();
    ctx.moveTo(x, y);

    let currentNode = BNode.createInitial(x, y - this.trunkLength);
    ctx.lineTo(currentNode.x, currentNode.y);
    console.log(ctx.strokeStyle);
    ctx.stroke();
    ctx.closePath();
    this.branchNodes.push(currentNode);
  },
  drawBranches(ctx) {

    let currentId = 0;
    this.lineWidth--;

    // debugger;
    while (this.lineWidth > 0) {
      // debugger
      // lode current node if exists, otherwise load trunk ending node, generate random angle
      let currentNode = this.branchNodes.find(node => node.id === currentId) || this.branchNodes[this.branchNodes.length - 1],
        x = currentNode.x,
        y = currentNode.y,
        angle = this.generateNextAngle(currentNode.children.length),
        newNode = BNode.create(x, y, this.branchLength, angle);
      currentNode.children.push(newNode.id);
      this.branchNodes.push(newNode);

      this.drawBranch(currentNode, newNode, ctx);
      // debugger;
      if (this.decreaseLineSize()) {
        this.lineWidth = Math.floor(this.lineWidth * 0.9);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineWidth = this.lineWidth;
      }
      if (random.rollDice() >= 5) {
        if (this.lineWidth > 2) { this.branchLength *= random.lengthModifier();
        } else { this.branchLength = this.branchLength * 0.9 * random.lengthModifier(); }
      }
      if (currentNode.children.length > 2) {
        currentId += 1;
        // this.changeAngleRange()
      }
    }

  },

  decreaseLineSize() {
    return ((random.rollDice() === 6 && this.lineWidth > 2) || (this.lineWidth <= 2 && random.int(0, 50) === 50)) ? true : false;
  },
  changeAngleRange() {
    this.leftAngleRange[0] -= 5;
    this.rightAngleRange[1] += 5;
  },

  generateNextAngle(childCount) {
    if (childCount % 2 !== 0) {
      return random.angle(this.leftAngleRange);
    } else {
      return random.angle(this.rightAngleRange);
    }
  },

  drawBranch(currentNode, newNode, ctx) {
    let yModifier = this.branchLength / 3,
      xModifier = this.branchLength / 20;
    ctx.beginPath();
    ctx.moveTo(currentNode.x, currentNode.y);
    if (newNode.x < this.branchNodes[0].x) {
      ctx.bezierCurveTo(currentNode.x + xModifier, currentNode.y - yModifier, currentNode.x + xModifier, newNode.y + yModifier, newNode.x, newNode.y);
    } else {
      ctx.bezierCurveTo(currentNode.x - xModifier, currentNode.y - yModifier, currentNode.x - xModifier, newNode.y + yModifier, newNode.x, newNode.y);
    }
    // ctx.lineTo(newNode.x, newNode.y)
    ctx.stroke();
    ctx.closePath();

  },
};

const BNode = {
  createInitial(x, y) {
    this.id = 0;
    let newNode = Object.create(BNode);
    newNode.children = [];
    newNode.x = x;
    newNode.y = y;
    newNode.id = this.id;

    return newNode;
  },
  create(x, y, length, deg) {
    // debugger

    let newNode = Object.create(BNode);
    newNode.children = [];
    newNode.id = this.id++;
    [newNode.x, newNode.y] = this.newNodeCoord(x, y, length, deg);
    return newNode;
  },
  newNodeCoord(x, y, length, deg) {
    let rads = this.toRad(deg);
    let newX = x + parseInt(length * Math.cos(rads));
    let newY = y - parseInt(length * Math.sin(rads));
    // console.log(newX, newY, deg, rads);

    return [newX, newY];
  },
  toRad(deg) {
    return deg * (Math.PI / 180);
  },
};

const random = {
  int(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
  angle(range) {
    return random.int(range[0], range[1]);
  },
  lengthModifier() {
    return random.int(9, 11) / 10;
  },
  rollDice() {
    return random.int(1, 6);
  }
};

// *********
// * brush *
// *********

var brush = {
  cursorSize: 12,
  type: 'tri',
  color: INITIAL_BRUSH_COLOR,
  tipDown: false,
  // drawShape functions -must be called by a canvas' context

  drawTree(x, y) {
    Tree.draw(x, y, this);
  },

  drawTriangle(x, y, size, filled) {
    var halfsize = size / 2;
    this.beginPath();
    this.moveTo(x, y - halfsize);
    this.lineTo(x + halfsize, y + halfsize);
    this.lineTo(x - halfsize, y + halfsize);
    this.closePath();
    filled ? this.fill() : this.stroke();
  },
  drawSquare(x, y, size, filled) {
    var halfsize = size / 2;
    filled ? this.fillRect(x - halfsize, y - halfsize, size, size) :
      this.strokeRect(x - halfsize, y - halfsize, size, size);
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
    var x = e.offsetX;
    var y = e.offsetY;
    this.applyShadow(ctx);
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
    case 'tree':
      brush.drawTree.call(ctx, x, y);
      break;
    default:
      brush.erase.call(ctx, x, y, brush.cursorSize);
    }
  },
  applyShadow(ctx) {
    ctx.shadowColor = 'rgba(0,0,0,0.6)';


    if ($('#shadow').prop('checked')) {
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = +$('#shadow-blur').val();
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
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
    this.loadPngIcons();
    this.setCursor();
  },
  resizeBrushButtons() {
    $('.brushbuttons canvas').each(function () {
      ui.changeButtonSize(this);
    });
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
    var btnCanvas = $(id + ' canvas').get(0);
    var btnCtx = btnCanvas.getContext('2d');
    var x = brush.cursorSize / 2;
    var y = brush.cursorSize / 2;
    btnCtx.strokeStyle = brush.color;
    btnCtx.fillStyle = brush.color;
    app.clearCanvas.call(btnCtx);
    drawFunction.call(btnCtx, x, y, brush.cursorSize, filled);
  },
  eraserIcon: document.createElement('img'),
  treeIcon: document.createElement('img'),
  loadPngIcons() {
    this.loadEraserIcon();
    this.loadTreeIcon();
  },
  drawPngIcons() {
    this.drawEraserIcon();
    this.drawTreeIcon();
  },
  loadEraserIcon() {
    // since eraser and tree icons are an image jQuery has draw it to canvas
    // for the first time after its `load` event fires
    this.eraserIcon.src = 'images/remove.png';
    this.eraserIcon.onload = function () {
      ui.drawEraserIcon();
    };
  },
  drawEraserIcon() {
    var eraserCtx = $('#eraser canvas').get(0).getContext('2d');
    app.clearCanvas.call(eraserCtx);
    eraserCtx.drawImage(ui.eraserIcon, 0, 0, brush.cursorSize, brush.cursorSize);
  },
  loadTreeIcon() {
    this.treeIcon.src = 'images/tree.png';
    this.treeIcon.onload = function () {
      ui.drawTreeIcon();
    };
  },
  drawTreeIcon() {
    $('#tree').css('color', brush.color);
    var iconCtx = $('#tree canvas').get(0).getContext('2d');
    app.clearCanvas.call(iconCtx);
    iconCtx.drawImage(ui.treeIcon, 0, 0, brush.cursorSize, brush.cursorSize);
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
  update(colorInfo) {
    ui.drawBrushIcons();
    ui.drawTreeIcon();
    ui.setCursor();
    ui.setColorControls(colorInfo);
  },
  setColorControls(colorInfo) {
    $('#colorPicker').val(colorInfo[0]);
    $('#color').val(brush.color);
    $('#opacity').val(colorInfo[1]);
  },
};

// *******
// * app *
// *******

var app = {
  init() {
    // create handlebars function for gallery figure template, set the canvas and context attributes
    var galleryHtml = $('#gallery_image_template').html();
    this.canvas = document.getElementById('maincanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.strokeStyle = INITIAL_BRUSH_COLOR;
    this.ctx.fillStyle = INITIAL_BRUSH_COLOR;
    this.makeGalleryFig = Handlebars.compile(galleryHtml),
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
      var galleryHtml = this.makeGalleryFig({
        images: this.gallery
      });
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
      this.customColors.forEach(function (color) {
        var option = document.createElement('option');
        $(option).attr('value', color);
        $('datalist').append(option);
      });
    }
  },



  setPrimaryColor(colorVal) {
    if (colorVal) {
      brush.color = colorVal;
    }

    this.ctx.strokeStyle = brush.color;
    this.ctx.fillStyle = brush.color;
    let colorInfo = this.getColorInfo(this.ctx.strokeStyle);
    console.log(colorInfo);
    ui.update(colorInfo);
  },
  getColorInfo(string) {
    return string[0] === '#' ? [string, 10] : this.infoFromRgba(string); // transform value to hex
  },
  infoFromRgba(string) {

    let values = string.match(/0?\.?\d+/g).map((numString, i) => {
      return i !== 3 ? parseInt(numString).toString(16).replace(/^0/, '00') : parseInt(parseFloat(numString) * 10).toString();
    });
    return[['#' + [values[0], values[1], values[2]].join('')], [values[3]]];
  },
  changeOpacity(val) {
    this.ctx.strokeStyle = brush.color;
    let colorString = this.ctx.strokeStyle;
    if (colorString[0] === '#') {
      console.log('hit');
      colorString = this.rgbaVal(colorString, val);
    } else {
      colorString = colorString.replace(/\d?\.?\d+\)/, `${(val / 10).toFixed(1)})`);
    }
    this.setPrimaryColor(colorString);
  },
  rgbaVal(colorString, val) {
    return `rgba(${colorString.match(/[0-9a-f]{2}/gi).map(val => parseInt(val, 16).toString()).join(',')},${(val / 10).toFixed(1)})`;
  },
  clearCanvas() {
    var canvas = this.canvas;
    this.clearRect(0, 0, canvas.width, canvas.height);
  },
  imageToGrayscale() {
    var imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    var dataArray = imageData.data;
    var grayData = dataArray.slice(0);
    for (var i = 0; i < dataArray.length; i += 4) {
      var red = dataArray[i];
      var green = dataArray[i + 1];
      var blue = dataArray[i + 2];
      var normalized = (red * .3086 + green * .6094 + blue * .0820);
      grayData[i] = grayData[i + 1] = grayData[i + 2] = normalized;
    }
    imageData.data.set(grayData);
    this.registerCanvasChange();
    this.ctx.putImageData(imageData, 0, 0);
  },
  invertColors() {
    var imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    var dataArray = imageData.data;
    var invertData = dataArray.map(function (rgb, i) {
      if ((i + 1) % 4 === 0) {
        return rgb;
      } else {
        return 255 - rgb;
      }
    });
    imageData.data.set(invertData);
    this.registerCanvasChange();
    this.ctx.putImageData(imageData, 0, 0);
  },
  saveToGallery() {
    // if nothing yet in gallery updates hint text, converts canvas to image data URL,
    // feeds URL to HandlebaHrs template function, appends reslting HTML to the
    // gallery div, adds data URL to app's gallery array
    if ($('.gallery figure').length === 0) {
      $('p i').text('Right click thumbnail and select "Save image as..." to save');
    }
    var img_src = this.canvas.toDataURL('png');
    var galleryHtml = app.makeGalleryFig({
      images: [img_src]
    });
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
    var img = $(el).parents('figure').find('img').get(0);
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
    var stateToRestore;
    var redoState;
    if (storedCount !== 0) {
      if (storedCount === 1) {
        $('#undo').addClass('pure-button-disabled');
      }
      stateToRestore = this.storedStates.pop();
      redoState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      if (redoCount === 0) {
        $('#redo').removeClass('pure-button-disabled');
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

$(function () {
  app.init();
  ui.init();

  $(app.canvas).mousedown(function (e) {
    app.registerCanvasChange();
    brush.tipDown = true;
    brush.paint(app.ctx, e);
  });

  $(app.canvas).mousemove(function (e) {
    if (brush.tipDown) {
      brush.paint(app.ctx, e);
    }
  });

  $(window).mouseup(function () {
    if (brush.tipDown) {
      brush.tipDown = false;
    }
  });

  $('#undo').click(function () {
    app.undo();
  });

  $('#redo').click('#redo', function () {
    app.redo();
  });

  $('.brushbuttons').on('click', 'button', function () {
    $('.pure-button-active').removeClass('pure-button-active');
    $(this).addClass('pure-button-active');
    brush.type = this.id;
    brush.type === 'tree' ? $('.tree-options').slideDown() : $('.tree-options').slideUp();
    ui.setCursor();
  });

  $('#shadow').click(() => {
    let $shadowBlur = $('#shadow-blur');
    let $blurLabel = $('label[for=shadow-blur]');
    if ($shadowBlur.attr('disabled')) {
      $shadowBlur.removeAttr('disabled');
      $blurLabel.removeClass('disabled');
    } else {
      $shadowBlur.attr('disabled', 'disabled');
      $blurLabel.addClass('disabled');
    }
  });

  // when color text input changes, update brush.color and redraw the button icons in the new color, update cursor
  $('#color').on('change', function (e) {
    var colorVal = $(e.target).delay(100).val();
    app.setPrimaryColor(colorVal);
  });
  $('#colorPicker').on('change', (e) => {
    var colorVal = $(e.target).val();
    console.log(colorVal);
    app.setPrimaryColor(colorVal);
  });

  $('#opacity').on('input',(e) =>  {
    app.changeOpacity($(e.target).val());
  });

  // when focus is taken off color text input, add new color to hint list if
  // it is not already there (avoids adding every keystroke to list)
  $('#color').blur(function () {
    if ($('#colorlist').find('option[value="' + brush.color + '"]').length === 0) {
      $('#colorlist').append('<option value="' + brush.color + '">');
      app.customColors.push(brush.color);
    }
  });

  $('#brushsize').on('input', function () {
    brush.cursorSize = +$(this).val();
    ui.resizeBrushButtons();
    ui.drawBrushIcons();
    ui.drawPngIcons();
    ui.setCursor();
  });

  $('.gallery').on('mouseenter', 'figure', function () {
    $(this).find('figcaption').show();
  });

  $('.gallery').on('mouseleave', 'figure', function () {
    $(this).find('figcaption').hide();
  });

  $('#grayscale').click(function () {
    app.imageToGrayscale();
  });

  $('#invert').click(function () {
    app.invertColors();
  });

  $('#clear').click(function () {
    if (confirm('Clear the canvas?')) {
      app.registerCanvasChange();
      app.clearCanvas.call(app.ctx);
    }
  });

  $('#save').click(function () {
    app.saveToGallery();
  });
  $('.gallery').on('click', '.load-on-top', function (e) {
    e.preventDefault();
    app.loadOnTop(this);
  });

  $('.gallery').on('click', '.load', function (e) {
    e.preventDefault();
    app.loadToGallery(this);
  });

  $('.gallery').on('click', '.delete', function (e) {
    e.preventDefault();
    if (confirm('Permanently delete this image?')) {
      app.delete(this);
    }
  });

  $(window).keydown(function (e) {
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
  $(window).on('unload', function () {
    app.updateLocalStorage();
  });

  // experimental

  $(app.canvas).on('touchstart', function(e) {processTouchstart(e.originalEvent)});
  $(app.canvas).on('touchmove', function(e) {processTouchmove(e.originalEvent);});
  $(app.canvas).on('touchcancel', function(e) {processTouchcancel(e.originalEvent);});
  $(app.canvas).on('touchend', function(e) {processTouchend(e.originalEvent);});

// app.canvas.addEventListener('touchstart', process_touchstart, false);
// app.canvas.addEventListener('touchmove', process_touchmove, false);
// app.canvas.addEventListener('touchcancel', process_touchcancel, false);
// app.canvas.addEventListener('touchend', process_touchend, false);

  function processTouchstart(e) {
    // debugger;
    app.registerCanvasChange();
    e = setTouchEventOffset(e);

    brush.tipDown = true;
    brush.paint(app.ctx, e);
    log('touchstart');
  }

  function processTouchmove(e) {
    e.preventDefault();
    e = setTouchEventOffset(e);
    if (brush.tipDown) {
      brush.paint(app.ctx, e);
    }
    log(`touchmove: ${e.changedTouches[0].pageX}, ${e.changedTouches[0].pageY}`);
  }

  function processTouchcancel(e) {
    log(`touchcancel: ${Object.entries(e.touches)}`);
  }

  function processTouchend(e) {
    if (brush.tipDown) {
      brush.tipDown = false;
    }
    log(`touchend: ${Object.entries(e.touches)}`);
  }
});

const setTouchEventOffset = (touchEvent) => {
  touchEvent.offsetX = touchEvent.touches[0].pageX - $(app.canvas).offset().left;
  touchEvent.offsetY = touchEvent.touches[0].pageY - $(app.canvas).offset().top;
  return touchEvent;
};
