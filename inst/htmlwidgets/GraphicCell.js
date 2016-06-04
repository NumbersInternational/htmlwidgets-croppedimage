// Generated by CoffeeScript 1.8.0
var GraphicCell,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

GraphicCell = (function(_super) {
  __extends(GraphicCell, _super);

  function GraphicCell() {
    return GraphicCell.__super__.constructor.apply(this, arguments);
  }

  GraphicCell.prototype.setConfig = function(config) {
    var key, paddingBottom, paddingLeft, paddingRight, paddingTop, _ref, _ref1, _results;
    this.config = _.cloneDeep(config);
    if (this.config.variableImage == null) {
      throw new Error("Must specify 'variableImage'");
    }
    if (_.isString(this.config['proportion']) && this.config['proportion'].startsWith('=')) {
      this.config['proportion'] = eval(this.config['proportion'].substring(1));
    }
    this._verifyKeyIsFloat(this.config, 'proportion', 1, 'Must be number between 0 and 1');
    this._verifyKeyIsRatio(this.config, 'proportion');
    this._verifyKeyIsPositiveInt(this.config, 'numImages', 1);
    if (this.config['numRows'] != null) {
      this._verifyKeyIsPositiveInt(this.config, 'numRows', 1);
    }
    if (this.config['numCols'] != null) {
      this._verifyKeyIsPositiveInt(this.config, 'numCols', 1);
    }
    if ((this.config['numRows'] != null) && (this.config['numCols'] != null)) {
      throw new Error("Cannot specify both numRows and numCols. Choose one, and use numImages to control exact dimensions.");
    }
    if (this.config['direction'] == null) {
      this.config['direction'] = 'horizontal';
    }
    if ((_ref = this.config['direction']) !== 'horizontal' && _ref !== 'vertical' && _ref !== 'scale') {
      throw new Error("direction must be either (horizontal|vertical|scale)");
    }
    this._verifyKeyIsFloat(this.config, 'interColumnPadding', 0.05, 'Must be number between 0 and 1');
    this._verifyKeyIsRatio(this.config, 'interColumnPadding');
    this._verifyKeyIsFloat(this.config, 'interRowPadding', 0.05, 'Must be number between 0 and 1');
    this._verifyKeyIsRatio(this.config, 'interRowPadding');
    this._verifyKeyIsBoolean(this.config, 'fixedgrid', false);
    this._processTextConfig('text-header');
    this._processTextConfig('text-overlay');
    this._processTextConfig('text-footer');
    if (this.config.padding) {
      _ref1 = this.config.padding.split(" "), paddingTop = _ref1[0], paddingRight = _ref1[1], paddingBottom = _ref1[2], paddingLeft = _ref1[3];
      this.config.padding = {
        top: parseInt(paddingTop.replace(/(px|em)/, '')),
        right: parseInt(paddingRight.replace(/(px|em)/, '')),
        bottom: parseInt(paddingBottom.replace(/(px|em)/, '')),
        left: parseInt(paddingLeft.replace(/(px|em)/, ''))
      };
      _results = [];
      for (key in this.config.padding) {
        if (_.isNaN(this.config.padding[key])) {
          throw new Error("Invalid padding " + this.config.padding + ": " + key + " must be Integer");
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    } else {
      return this.config.padding = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    }
  };

  GraphicCell.prototype._processTextConfig = function(key) {
    var cssAttribute, textConfig, _i, _len, _ref;
    if (this.config[key] != null) {
      textConfig = _.isString(this.config[key]) ? {
        text: this.config[key]
      } : this.config[key];
      if (textConfig['text'] == null) {
        throw new Error("Invalid " + key + " config: must have text field");
      }
      if ((textConfig != null) && textConfig['text'].match(/^percentage$/)) {
        textConfig['text'] = "" + ((100 * this.config.proportion).toFixed(1)) + "%";
      }
      if ((textConfig != null) && textConfig['text'].match(/^proportion$/)) {
        textConfig['text'] = "" + (this.config.proportion.toFixed(3).replace(/0+$/, ''));
      }
      if (textConfig['font-size'] == null) {
        textConfig['font-size'] = BaseCell.getDefault('font-size');
      }
      _ref = ['font-family', 'font-size', 'font-weight', 'font-color'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cssAttribute = _ref[_i];
        if (textConfig[cssAttribute] != null) {
          this.setCss(key, cssAttribute, textConfig[cssAttribute]);
        }
      }
      return this.config[key] = textConfig;
    }
  };

  GraphicCell.prototype._draw = function() {
    var backgroundRect, d3Data, enteringLeafNodes, graphicContainer, gridLayout, imageHeight, imageWidth, x, y;
    this._computeDimensions();
    if (this.config['text-header'] != null) {
      x = this.dimensions.headerXOffset + this.dimensions.headerWidth / 2;
      y = this.dimensions.headerYOffset + this.dimensions.headerHeight / 2;
      this._addTextTo(this.parentSvg, this.config['text-header']['text'], 'text-header', x, y);
    }
    graphicContainer = this.parentSvg.append('g').attr('class', 'graphic-container').attr('transform', "translate(" + this.dimensions.graphicXOffset + "," + this.dimensions.graphicYOffset + ")");
    if (this.config['text-footer'] != null) {
      x = this.dimensions.footerXOffset + this.dimensions.footerWidth / 2;
      y = this.dimensions.footerYOffset + this.dimensions.footerHeight / 2;
      this._addTextTo(this.parentSvg, this.config['text-footer']['text'], 'text-footer', x, y);
    }
    d3Data = null;
    if (this.config.fixedgrid) {
      d3Data = this._generateFixedDataArray(this.config.proportion, this.config.numImages);
    } else {
      d3Data = this._generateDataArray(this.config.proportion, this.config.numImages);
    }
    gridLayout = d3.layout.grid().bands().size([this.dimensions.graphicWidth, this.dimensions.graphicHeight]).padding([this.config['interColumnPadding'], this.config['interRowPadding']]);
    if (this.config['numRows'] != null) {
      gridLayout.rows(this.config['numRows']);
    }
    if (this.config['numCols'] != null) {
      gridLayout.cols(this.config['numCols']);
    }
    enteringLeafNodes = graphicContainer.selectAll(".node").data(gridLayout(d3Data)).enter().append("g").attr("class", function(d) {
      var cssLocation;
      cssLocation = "node-index-" + d.i + " node-xy-" + d.row + "-" + d.col;
      return "node " + cssLocation;
    }).attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
    imageWidth = gridLayout.nodeSize()[0];
    imageHeight = gridLayout.nodeSize()[1];
    backgroundRect = enteringLeafNodes.append("svg:rect").attr('width', imageWidth).attr('height', imageHeight).attr('class', 'background-rect').attr('fill', this.config['background-color'] || 'none');
    if (this.config['debugBorder'] != null) {
      backgroundRect.attr('stroke', 'black').attr('stroke-width', '1');
    }
    if (this.config.baseImage != null) {
      enteringLeafNodes.each(_.partial(ImageFactory.addImageTo, this.config.baseImage, imageWidth, imageHeight));
    }
    enteringLeafNodes.each(_.partial(ImageFactory.addImageTo, this.config.variableImage, imageWidth, imageHeight));
    if (this.config['tooltip']) {
      enteringLeafNodes.append("svg:title").text(this.config['tooltip']);
    }
    if (this.config['text-overlay'] != null) {
      x = gridLayout.nodeSize()[0] / 2;
      y = gridLayout.nodeSize()[1] / 2;
      return this._addTextTo(enteringLeafNodes, this.config['text-overlay']['text'], 'text-overlay', x, y);
    }
  };

  GraphicCell.prototype._computeDimensions = function() {
    this.dimensions = {};
    this.dimensions.headerHeight = 0 + (this.config['text-header'] != null ? parseInt(this.config['text-header']['font-size'].replace(/(px|em)/, '')) : 0);
    this.dimensions.footerHeight = 0 + (this.config['text-footer'] != null ? parseInt(this.config['text-footer']['font-size'].replace(/(px|em)/, '')) : 0);
    this.dimensions.headerWidth = this.width - this.config.padding.left - this.config.padding.right;
    this.dimensions.headerXOffset = 0 + this.config.padding.left;
    this.dimensions.headerYOffset = 0 + this.config.padding.top;
    this.dimensions.graphicWidth = this.width - this.config.padding.left - this.config.padding.right;
    this.dimensions.graphicHeight = this.height - this.dimensions.headerHeight - this.dimensions.footerHeight - this.config.padding.top - this.config.padding.bottom;
    this.dimensions.graphicXOffset = 0 + this.config.padding.left;
    this.dimensions.graphicYOffset = 0 + this.dimensions.headerYOffset + this.dimensions.headerHeight;
    this.dimensions.footerWidth = this.width - this.config.padding.left - this.config.padding.right;
    this.dimensions.footerXOffset = 0 + this.config.padding.left;
    return this.dimensions.footerYOffset = 0 + this.dimensions.graphicYOffset + this.dimensions.graphicHeight;
  };

  GraphicCell.prototype._addTextTo = function(parent, text, myClass, x, y) {
    return parent.append('svg:text').attr('class', myClass).attr('x', x).attr('y', y).style('text-anchor', 'middle').style('alignment-baseline', 'central').style('dominant-baseline', 'central').text(text);
  };

  GraphicCell.prototype._generateDataArray = function(proportion, numImages) {
    var d3Data, num, totalArea, _i;
    d3Data = [];
    totalArea = proportion * numImages;
    for (num = _i = 1; 1 <= numImages ? _i <= numImages : _i >= numImages; num = 1 <= numImages ? ++_i : --_i) {
      proportion = Math.min(1, Math.max(0, 1 + totalArea - num));
      d3Data.push({
        proportion: proportion,
        i: num - 1
      });
    }
    return d3Data;
  };

  GraphicCell.prototype._generateFixedDataArray = function(proportion, numImages) {
    var d3Data, num, numFullImages, _i;
    d3Data = [];
    numFullImages = Math.ceil(proportion * numImages);
    for (num = _i = 1; 1 <= numImages ? _i <= numImages : _i >= numImages; num = 1 <= numImages ? ++_i : --_i) {
      proportion = num <= numFullImages ? 1 : 0;
      d3Data.push({
        proportion: proportion,
        i: num - 1
      });
    }
    return d3Data;
  };

  return GraphicCell;

})(BaseCell);
