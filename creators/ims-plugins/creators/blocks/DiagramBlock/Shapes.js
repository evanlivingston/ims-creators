export default function (mx) {
  // UmlActorShape
  function UmlActorShape() {
    mx.mxShape.call(this);
  }
  mx.mxUtils.extend(UmlActorShape, mx.mxShape);
  UmlActorShape.prototype.paintBackground = function (c, x, y, w, h) {
    c.translate(x, y);

    // Head
    c.ellipse(w / 4, 0, w / 2, h / 4);
    c.fillAndStroke();

    c.begin();
    c.moveTo(w / 2, h / 4);
    c.lineTo(w / 2, (2 * h) / 3);

    // Arms
    c.moveTo(w / 2, h / 3);
    c.lineTo(0, h / 3);
    c.moveTo(w / 2, h / 3);
    c.lineTo(w, h / 3);

    // Legs
    c.moveTo(w / 2, (2 * h) / 3);
    c.lineTo(0, h);
    c.moveTo(w / 2, (2 * h) / 3);
    c.lineTo(w, h);
    c.end();

    c.stroke();
  };

  // Replaces existing actor shape
  mx.mxCellRenderer.registerShape('umlActor', UmlActorShape);

  // PartialRectangleShape
  function PartialRectangleShape() {
    mx.mxEllipse.call(this);
  }
  mx.mxUtils.extend(PartialRectangleShape, mx.mxEllipse);
  PartialRectangleShape.prototype.paintVertexShape = function (c, x, y, w, h) {
    if (!this.outline) {
      c.setStrokeColor(null);
    }

    if (this.style != null) {
      var pointerEvents = c.pointerEvents;
      var events =
        mx.mxUtils.getValue(
          this.style,
          mx.mxConstants.STYLE_POINTER_EVENTS,
          '1',
        ) == '1';

      if (!events && (this.fill == null || this.fill == mx.mxConstants.NONE)) {
        c.pointerEvents = false;
      }

      c.rect(x, y, w, h);
      c.fill();

      c.pointerEvents = pointerEvents;
      c.setStrokeColor(this.stroke);
      c.begin();
      c.moveTo(x, y);

      if (this.outline || mx.mxUtils.getValue(this.style, 'top', '1') == '1') {
        c.lineTo(x + w, y);
      } else {
        c.moveTo(x + w, y);
      }

      if (
        this.outline ||
        mx.mxUtils.getValue(this.style, 'right', '1') == '1'
      ) {
        c.lineTo(x + w, y + h);
      } else {
        c.moveTo(x + w, y + h);
      }

      if (
        this.outline ||
        mx.mxUtils.getValue(this.style, 'bottom', '1') == '1'
      ) {
        c.lineTo(x, y + h);
      } else {
        c.moveTo(x, y + h);
      }

      if (this.outline || mx.mxUtils.getValue(this.style, 'left', '1') == '1') {
        c.lineTo(x, y);
      }

      c.end();
      c.stroke();
    }
  };

  mx.mxCellRenderer.registerShape('partialRectangle', PartialRectangleShape);

  // Table Shape
  function TableShape() {
    mx.mxSwimlane.call(this);
  }

  mx.mxUtils.extend(TableShape, mx.mxSwimlane);

  TableShape.prototype.getLabelBounds = function () {
    var start = this.getTitleSize();

    if (start == 0) {
      return mx.mxShape.prototype.getLabelBounds.apply(this, arguments);
    } else {
      return mx.mxSwimlane.prototype.getLabelBounds.apply(this, arguments);
    }
  };

  TableShape.prototype.paintVertexShape = function (c, x, y, w, h) {
    var start = this.getTitleSize();

    if (start == 0) {
      mx.mxRectangleShape.prototype.paintBackground.apply(this, arguments);
    } else {
      mx.mxSwimlane.prototype.paintVertexShape.apply(this, arguments);
      c.translate(-x, -y);
    }

    this.paintForeground(c, x, y, w, h);
  };

  TableShape.prototype.paintForeground = function (c, x, y, w, h) {
    if (this.state != null) {
      var flipH = this.flipH;
      var flipV = this.flipV;

      if (
        this.direction == mx.mxConstants.DIRECTION_NORTH ||
        this.direction == mx.mxConstants.DIRECTION_SOUTH
      ) {
        var tmp = flipH;
        flipH = flipV;
        flipV = tmp;
      }

      // Negative transform to avoid save/restore
      c.rotate(-this.getShapeRotation(), flipH, flipV, x + w / 2, y + h / 2);

      let s = this.scale;
      x = this.bounds.x / s;
      y = this.bounds.y / s;
      w = this.bounds.width / s;
      h = this.bounds.height / s;
      this.paintTableForeground(c, x, y, w, h);
    }
  };

  TableShape.prototype.paintTableForeground = function (c, x, y, w, h) {
    var graph = this.state.view.graph;
    var start = graph.getActualStartSize(this.state.cell);
    var rows = graph.model.getChildCells(this.state.cell, true);

    if (rows.length > 0) {
      var rowLines =
        mx.mxUtils.getValue(this.state.style, 'rowLines', '1') != '0';
      var columnLines =
        mx.mxUtils.getValue(this.state.style, 'columnLines', '1') != '0';

      // Paints row lines
      if (rowLines) {
        for (var i = 1; i < rows.length; i++) {
          var geo = graph.getCellGeometry(rows[i]);

          if (geo != null) {
            c.begin();
            c.moveTo(x + start.x, y + geo.y);
            c.lineTo(x + w - start.width, y + geo.y);
            c.end();
            c.stroke();
          }
        }
      }

      if (columnLines) {
        var cols = graph.model.getChildCells(rows[0], true);

        // Paints column lines
        for (let i = 1; i < cols.length; i++) {
          const geo = graph.getCellGeometry(cols[i]);

          if (geo != null) {
            c.begin();
            c.moveTo(x + geo.x + start.x, y + start.y);
            c.lineTo(x + geo.x + start.x, y + h - start.height);
            c.end();
            c.stroke();
          }
        }
      }
    }
  };

  mx.mxCellRenderer.registerShape('table', TableShape);

  // State Shapes derives from double ellipse
  function StateShape() {
    mx.mxDoubleEllipse.call(this);
  }
  mx.mxUtils.extend(StateShape, mx.mxDoubleEllipse);
  StateShape.prototype.outerStroke = true;
  StateShape.prototype.paintVertexShape = function (c, x, y, w, h) {
    var inset = Math.min(4, Math.min(w / 5, h / 5));

    if (w > 0 && h > 0) {
      c.ellipse(x + inset, y + inset, w - 2 * inset, h - 2 * inset);
      c.fillAndStroke();
    }

    c.setShadow(false);

    if (this.outerStroke) {
      c.ellipse(x, y, w, h);
      c.stroke();
    }
  };

  mx.mxCellRenderer.registerShape('endState', StateShape);

  function StartStateShape() {
    StateShape.call(this);
  }
  mx.mxUtils.extend(StartStateShape, StateShape);
  StartStateShape.prototype.outerStroke = false;

  mx.mxCellRenderer.registerShape('startState', StartStateShape);
}
