/*
    Copyright 2008, 
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @fileoverview The geometry object Line is defined in this file. Line stores all
 * style and functional properties that are required to draw and move a line on
 * a board.
 * @author graphjs
 * @version 0.1
 */

/**
 * Constructs a new Line object.
 * @class This is the Line class. 
 * It is derived from @see GeometryElement.
 * It stores all properties required
 * to move, draw a line.
 * @constructor
 * @param {String,Board} board The board the new line is drawn on.
 * @param {Point} p1 Startpoint of the line.
 * @param {Point} p2 Endpoint of the line.
 * @param {String} id Unique identifier for this object. If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} name Not necessarily unique name. If null or an
 * empty string is given, an unique name will be generated.
 * @see Board#generateName
 */
JXG.Line = function (board, p1, p2, id, name) {
    /* Call the constructor of GeometryElement */
    this.constructor();
    
    this.init(board, id, name);

    /**
     * Sets type of GeometryElement, value is OBJECT_TYPE_LINE.
     * @final
     * @type int
     */
    this.type = JXG.OBJECT_TYPE_LINE;
    
    /**
     * Class of element, value is OBJECT_CLASS_LINE;
     */
    this.elementClass = JXG.OBJECT_CLASS_LINE;

    /**
     * Startpoint of the line.
     * @type Point
     */
    this.point1 = JXG.GetReferenceFromParameter(this.board, p1);
    
    /**
     * Endpoint of the line.
     * @type Point
     */    
    this.point2 = JXG.GetReferenceFromParameter(this.board, p2);

    /**
     * Image bound to this line
     * @type Image
     */    
    this.image = null;
    this.imageTransformMatrix = [[1,0,0],[0,1,0],[0,0,1]];
    
    /**
     * This is just for the hasPoint() method.
     * @type int
     */
    this.r = 3;

    this.visProp['fillColor'] = 'none';
    this.visProp['highlightFillColor'] = 'none';
    this.visProp['strokeColor'] = '#0000ff';
    this.visProp['strokeWidth'] = 1;
    
    /**
     * Determines if a line is drawn on over the firstpoint.
     * @type bool
     * @see #straightLast
     */ 
    this.visProp['straightFirst'] = true;
    /**
     * Determines if a line is drawn on over the lastpoint.
     * @type bool
     * @see #straightFirst
     */     
    this.visProp['straightLast'] = true;

    /**
     * True when the object is visible, false otherwise.
     * @type bool
     */
    this.visProp['visible'] = true;
    
    /**
     * Array of Coords storing the coordinates of all ticks.
     * @type Array
     * @see Coords
     */
    this.ticks = [];
    
    /**
     * Has this line ticks?
     * @type bool
     */
    this.withTicks = false;
    
    /**
     * The distance between two ticks.
     * @type float
     */
    this.ticksDelta = 1;
        
    /**
    * If the line is the border of a polygon, the polygone object is stored, otherwise null.
    * @type Polygon
    */
    this.parentPolygon = null;
    
    /* Register line at board */
    this.id = this.board.addLine(this);

    /* Add arrow as child to defining points */
    this.point1.addChild(this);
    this.point2.addChild(this);
};

JXG.Line.prototype = new JXG.GeometryElement;

/**
 * Checks whether (x,y) is near the line.
 * @param {int} x Coordinate in x direction, screen coordinates.
 * @param {int} y Coordinate in y direction, screen coordinates.
 * @return {bool} True if (x,y) is near the line, False otherwise.
 */
 JXG.Line.prototype.hasPoint = function (x, y) {
    var p1Scr = this.point1.coords.scrCoords;
    var p2Scr = this.point2.coords.scrCoords;
    var coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this.board);

    var has = false;
    var i;

    var slope = this.getSlope();
    var rise = this.getRise();
    
    if(this.visProp['straightFirst'] && this.visProp['straightLast']) {
        if(slope != "INF") {
            for(i = -this.r; i < this.r; i++) {
                   has = has | (Math.abs(y - (slope*(x+i) + rise)) < this.r); 
               }
        }
        else { // senkrechte Gerade
            has = (Math.abs(x-p1Scr[1]) < this.r);
        }
    }
    else { 
        if(slope != "INF") {
            for(i = -this.r; i < this.r; i++) {
                   has = has | (Math.abs(y - (slope*(x+i) + rise)) < this.r); 
               }
               if(has) {
                   var distP1P = coords.distance(JXG.COORDS_BY_SCREEN, this.point1.coords);
                   var distP2P = coords.distance(JXG.COORDS_BY_SCREEN, this.point2.coords);
                   var distP1P2 = this.point1.coords.distance(JXG.COORDS_BY_SCREEN, this.point2.coords);
                   if((distP1P > distP1P2) || (distP2P > distP1P2)) { // P(x|y) liegt nicht zwischen P1 und P2
                       if(distP1P < distP2P) { // P liegt auf der Seite von P1
                           if(!this.visProp['straightFirst']) {
                               has = false;
                           }
                       }
                       else { // P liegt auf der Seite von P2
                           if(!this.visProp['straightLast']) {
                               has = false;
                           }                          
                       }
                   }
               }
        }
        else { // senkrechte Gerade
            has = (Math.abs(x-p1Scr[1]) < this.r);
            if(has) { // sonst muss nicht weiter geprueft werden
                if(!this.visProp['straightFirst']) {
                    if(p1Scr[2] < p2Scr[2]) {
                        if(y < p1Scr[2]) {
                           has = false;
                        }
                    }
                    else if(p1Scr[2] > p2Scr[2]) {
                        if(y > p1Scr[2]) {
                           has = false;
                        }
                    }
                }
                if(!this.visProp['straightLast']) {
                    if(p1Scr[2] < p2Scr[2]) {
                        if(y > p2Scr[2]) {
                           has = false;
                        }
                    }
                    else if(p1Scr[2] > p2Scr[2]) {
                        if(y < p2Scr[2]) {
                           has = false;
                        }
                    }
                }                
            }
        }    
    }

    return has;
};


JXG.Line.prototype.update = function() {    
    if (this.needsUpdate) {
        if (!this.board.geonextCompatibilityMode) {
            this.updateStdform();
        }
        if(this.withTicks)
            this.updateTickCoordinates();
    }
};

JXG.Line.prototype.updateStdform = function() {    
    var nx = -(this.point2.coords.usrCoords[2]-this.point1.coords.usrCoords[2]);
    var ny =  this.point2.coords.usrCoords[1]-this.point1.coords.usrCoords[1];
    var c = -(nx*this.point1.coords.usrCoords[1]+ny*this.point1.coords.usrCoords[2]);

    this.stdform[0] = c;
    this.stdform[1] = nx;
    this.stdform[2] = ny;
    this.stdform[3] = 0;

    this.normalize();
};

/**
 * Updates the coordinates of the lines ticks. Calls the renderer to delete old ticks
 * or create more ticks if required.
 * @param {bool} first Optional parameter, only used in constructor.
 */
JXG.Line.prototype.updateTickCoordinates = function (first) {
    if(typeof first == 'undefined') {
        first = false;
    }
    
    if(!this.withTicks)
        return;
        
    // calculate start (c1) and end (c2) points
    var c1 = new JXG.Coords(JXG.COORDS_BY_USER, [this.point1.coords.usrCoords[1], this.point1.coords.usrCoords[2]], this.board);
    var c2 = new JXG.Coords(JXG.COORDS_BY_USER, [this.point2.coords.usrCoords[1], this.point2.coords.usrCoords[2]], this.board);
    this.board.renderer.calcStraight(this, c1, c2);
    var p1 = this.point1.coords;

    var oldTicksCount = this.ticks.length;
    this.ticks = new Array();

    // calculate ticks
    // between start point (c1) and this.point1

    // distance between start and end points
    var dx = p1.usrCoords[1]-c1.usrCoords[1]; // delta x
    var dy = p1.usrCoords[2]-c1.usrCoords[2]; // delta y
    
    var total_length = Math.sqrt(dx*dx + dy*dy);
    var deltaX = (this.ticksDelta * dx) / (total_length);
    var deltaY = (this.ticksDelta * dy) / (total_length);
    
    var x = p1.usrCoords[1];
    var y = p1.usrCoords[2];
    
    // add tick at p1 
    this.ticks[0] = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);

    var countTicks = Math.floor(total_length/this.ticksDelta);

    for(var i=0; i<countTicks; i++) {
        x = x - deltaX;
        y = y - deltaY;

        this.ticks[i+1] = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);
    }
    var offset = countTicks;

    // between end point (ce) and this.point1

    // distance between start and end points
    dx = p1.usrCoords[1]-c2.usrCoords[1]; // delta x
    dy = p1.usrCoords[2]-c2.usrCoords[2]; // delta y
    
    total_length = Math.sqrt(dx*dx + dy*dy);
    deltaX = (this.ticksDelta * dx) / (total_length);
    deltaY = (this.ticksDelta * dy) / (total_length);
    
    // reset start coordinates
    x = p1.usrCoords[1];
    y = p1.usrCoords[2];
    
    var countTicks = Math.floor(total_length/this.ticksDelta);

    for(var i=0; i<countTicks; i++) {
        x = x - deltaX;
        y = y - deltaY;

        this.ticks[offset+i+1] = new JXG.Coords(JXG.COORDS_BY_USER, [x,y], this.board);
    }

    if(!first) {
        this.board.renderer.updateAxisTicks(this, oldTicksCount);
    }
    
    this.board.renderer.updateAxisTicksInnerLoop(this, 0);
};

/**
 * Uses the boards renderer to update the arrow.
 */
 JXG.Line.prototype.updateRenderer = function () {
    if (this.needsUpdate && this.visProp['visible']) {
        var wasReal = this.isReal;
        this.isReal = (isNaN(this.point1.coords.usrCoords[1]+this.point1.coords.usrCoords[2]+this.point2.coords.usrCoords[1]+this.point2.coords.usrCoords[2]))?false:true;
        if (this.isReal) {
            if (wasReal!=this.isReal) { 
                this.board.renderer.show(this); 
                //if(this.label.show) this.board.renderer.show(this.label); 
            }
            this.board.renderer.updateLine(this);
        } else {
            if (wasReal!=this.isReal) { 
                this.board.renderer.hide(this); 
                //if(this.label.show) this.board.renderer.hide(this.label); 
            }
        }
        
        //this.board.renderer.updateLine(this);
        this.needsUpdate = false;
    }
};

JXG.Line.prototype.enableTicks = function() {
    if(this.withTicks)
        return;
        
    this.withTicks = true;
    
    this.updateTickCoordinates();
};

JXG.Line.prototype.disableTicks = function() {
    if(!this.withTicks)
        return;
        
    this.withTicks = false;
    this.board.renderer.removeAxisTicks(this);
    this.ticks = new Array();
};

/**
 * Calculates the rise of the line (Achsenabschnitt)
 * @type float
 * @return The rise of the line
 */
JXG.Line.prototype.getRise = function () {
    var p1Scr = this.point1.coords.scrCoords; 
    var p2Scr = this.point2.coords.scrCoords;     
                                       
    return Math.round((p1Scr[2] - (p1Scr[1]*(p2Scr[2]-p1Scr[2]))/(p2Scr[1]-p1Scr[1])));
};

/**
 * Calculates the slope of the line described by the arrow. (Steigung)
 * @type float
 * @return The slope of the line or INF if the line is parallel to the y-axis.
 */
JXG.Line.prototype.getSlope = function () {
    var p1scr = this.point1.coords.scrCoords; 
    var p2scr = this.point2.coords.scrCoords;  
    
    if(Math.abs(p2scr[1]-p1scr[1]) >= 10e-5) {
       return ((p2scr[2]-p1scr[2])/(p2scr[1]-p1scr[1]));
    }
    else {
       return "INF";
    }
};

/**
 * Determines whether the line is drawn on over start and end point and updates the line.
 * @param {bool} straightFirst True if the Line shall be drawn on over the startpoint, false otherwise.
 * @param {bool} straightLast True if the Line shall be drawn on over the endpoint, false otherwise.
 * @see #straightFirst
 * @see #straightLast
 */
 JXG.Line.prototype.setStraight = function (straightFirst, straightLast) {
    this.visProp['straightFirst'] = straightFirst;
    this.visProp['straightLast'] = straightLast;
     
    this.board.renderer.updateLine(this);
};

/**
 * return TextAnchor
 */
JXG.Line.prototype.getTextAnchor = function() {
    return new JXG.Coords(JXG.COORDS_BY_USER, [0.5*(this.point2.X() - this.point1.X()),0.5*(this.point2.Y() - this.point1.Y())],this.board);
};

/**
 * Copy the element to the background.
 */
JXG.Line.prototype.cloneToBackground = function(addToTrace) {
    var copy = {};
    copy.id = this.id + 'T' + this.numTraces;
    this.numTraces++;
    copy.point1 = this.point1;
    copy.point2 = this.point2;
    
    copy.board = {};
    copy.board.unitX = this.board.unitX;
    copy.board.unitY = this.board.unitY;
    copy.board.zoomX = this.board.zoomX;
    copy.board.zoomY = this.board.zoomY;
    copy.board.origin = this.board.origin;
    copy.board.canvasHeight = this.board.canvasHeight;
    copy.board.canvasWidth = this.board.canvasWidth;
    copy.board.dimension = this.board.dimension;    
    
    copy.visProp = this.visProp;
    var s = this.getSlope();
    var r = this.getRise();
    copy.getSlope = function() { return s; };
    copy.getRise = function() { return r; };
    
    this.board.renderer.drawLine(copy);
    this.traces[copy.id] = $(copy.id);

    delete copy;
};

JXG.Line.prototype.addTransform = function (transform) {
    var list;
    if (JXG.IsArray(transform)) {
        list = transform;
    } else {
        list = [transform];
    }
    for (var i=0;i<list.length;i++) {
        this.point1.transformations.push(list[i]);
        this.point2.transformations.push(list[i]);
    }
};

JXG.Line.prototype.setPosition = function (method, x, y) {
    //var oldCoords = this.coords;
    //if(this.group.length != 0) {
    // AW: Do we need this for lines?
        // this.coords = new JXG.Coords(method, [x,y], this.board);
        // this.group[this.group.length-1].dX = this.coords.scrCoords[1] - oldCoords.scrCoords[1];
        // this.group[this.group.length-1].dY = this.coords.scrCoords[2] - oldCoords.scrCoords[2];
        // this.group[this.group.length-1].update(this);
    //} else {
        var t = this.board.createElement('transform',[x,y],{type:'translate'});
        if (this.point1.transformations.length>0 && this.point1.transformations[this.point1.transformations.length-1].isNumericMatrix) {
            this.point1.transformations[this.point1.transformations.length-1].melt(t);
        } else {
            this.point1.addTransform(this.point1,t);
        }
        if (this.point2.transformations.length>0 && this.point2.transformations[this.point2.transformations.length-1].isNumericMatrix) {
            this.point2.transformations[this.point2.transformations.length-1].melt(t);
        } else {
            this.point2.addTransform(this.point2,t);
        }
        //this.addTransform(t);
        //this.update();
    //}
};

JXG.createLine = function(board, parentArr, atts) {
    var el;
    
    if((parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT) && (parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT)) {
        var p1 =  JXG.GetReferenceFromParameter(board,parentArr[0]);
        var p2 =  JXG.GetReferenceFromParameter(board,parentArr[1]);
        el = new JXG.Line(board, p1.id, p2.id, atts['id'], atts['name']);
    } else
        throw ("Can't create line with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");
    return el;
};

JXG.JSXGraph.registerElement('line', JXG.createLine);