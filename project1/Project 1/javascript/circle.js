function Circle() {
    // Origin
    this.originX = 0;
    this.originY = 0;

    this.rgb = [Math.random(), Math.random(), Math.random(), 1];

    //Radius
    this.radius = 0.5;

    this.passedThreshold = false;

    // this controls the circular angle of the shape. It can be used to create a semi-circle
    // angle is the degrees
    this.angle = 360;
    this.centerAngle = 0;

    // number of points of granularity
    this.samples = 720;

    // used only for hollow circles
    this.lineThickness = 0.01;

    //used for drawing, this should not be set directly. Generate points will create this based on the data provided above
    this.pointCount = 0;
    this.points = [];
}

function prepend(value, array) {
    var newArray = array.slice(0);
    newArray.unshift(value);
    return newArray;
}

/* This method is used to recreate the points for the circle, only call thsi if one of the datasets have changed. 
    If nothing has changed, the previously created data is still valid.
*/
Circle.prototype.generatePoints = function () {
    switch (this.circleType) {
        case gl.TRIANGLE_STRIP:
            this.points = generateHollowCircleUsingTriangleStrip(this.originX, this.originY, this.radius, this.samples, this.centerAngle, this.angle, this.lineThickness);
            break;
        case gl.TRIANGLE_FAN:
            this.points = generateCircleUsingTriangleFan(this.originX, this.originY, this.radius, this.samples, this.centerAngle, this.angle);
            break;
        default:
            this.pointCount = 0;
            this.points = [];
    }
    // divide by two since each point has x and y coordinates (two integers for each point)
    this.pointCount = this.points.length / 2;
};

Circle.prototype.getColourArray = function () {
    var colourArray = [];
    // have to create an array of colours
    // the size has to be the same as the number of points or verticies
    for (var i = 0; i < this.pointCount; i++) {
        colourArray = colourArray.concat(this.rgb);
    }
    return colourArray;
};

// There is a flag for the type of circle, this method translates the type of cirle to GL mode.
Circle.prototype.getMode = function () {
    return this.circleType;
};

var generateHollowCircleUsingTriangleStrip = function (cx, cy, r, num_segments, centerAngle, angle, thickness) {
    // Pre calculate some values
    var theta = 2 * 3.1415926 / num_segments;
    var c = Math.cos(theta); //precalculate the sine and cosine
    var s = Math.sin(theta);

    // size = 180 degrees
    // number of segments = 100

    // num of segments to draw half circle = (180 / 360) * 100 = 50

    // this is used rotating the line
    var t1;
    var x1 = r; //we start at angle = 0 
    var y1 = 0;

    // [0 1]    [1 5]
    // [4 3] x  [1 4] , two x = something, y = something

    // a second one is required for the outer circle
    var t2;
    // increase x by thickess
    var x2 = x1 + thickness; //we start at angle = 0 
    var y2 = 0;

    // example
    // center = 0, angle = 100, number of segments = 100
    // start of arc =  (- 50 / 360) * 100 = some negative number = -40

    // angles -10 degrees = 350 degrees

    // calculate the number of points to get to the desired angle
    var arcSizeInSegmentCount = Math.round(((angle) / 360.0) * num_segments);

    // calculate how many segments have to be skipped to get to the desired start angle
    // Since I am looking for the start but I receive the middle, have to add half of the angle
    // It is add since the circle is drawn in a anti-clockwise pattern. So to go to the start of the bacteria, have to go clockwise.
    var startOffsetInSegmentCount = Math.round((centerAngle / 360.0) * num_segments - arcSizeInSegmentCount / 2);

    //the angle may go negative, this problem is fixes by adding num_segments
    // num_segments is the total points to draw a circle
    // adding num_segments is the same effect as spinning 360 degrees
    while (startOffsetInSegmentCount < 0) {
        startOffsetInSegmentCount += num_segments;
    }

    // check for an array being passed in, if nothing is passed, then create a new one
    var arr = [];

    var ii;
    // this loop will skip the uneeded points. This is calculating the points until it gets to the desired start angle.
    for (ii = 0; ii < startOffsetInSegmentCount; ii++) {
        //apply the rotation matrix
        t1 = x1;
        x1 = c * x1 - s * y1;
        y1 = s * t1 + c * y1;

        t2 = x2;
        x2 = c * x2 - s * y2;
        y2 = s * t2 + c * y2;
    }

    // now we have already reached the desired angle
    for (ii = 0; ii <= arcSizeInSegmentCount; ii++) {
        //apply the rotation matrix
        t1 = x1;
        x1 = c * x1 - s * y1;
        y1 = s * t1 + c * y1;

        t2 = x2;
        x2 = c * x2 - s * y2;
        y2 = s * t2 + c * y2;


        // in the first case, we dont have 4 sets of coordinates yet. We can save this number for the last case
        if (ii == 0) { // First case
            firstX1 = x1;
            firstY1 = y1;
            firstX2 = x2;
            firstY2 = y2;
        }

        arr.push(x1 + cx);
        arr.push(y1 + cy);
        arr.push(x2 + cx);
        arr.push(y2 + cy);

        if (ii == arcSizeInSegmentCount - 1 && angle == 360) { // First case
            arr.push(firstX1 + cx);
            arr.push(firstY1 + cy);
            arr.push(firstX2 + cx);
            arr.push(firstY2 + cy);
        }
    }

    return arr;
};

var generateCircleUsingTriangleFan = function (cx, cy, r, num_segments, centerAngle, angle) {
    var theta = 2 * 3.1415926 / num_segments;
    var c = Math.cos(theta); //precalculate the sine and cosine
    var s = Math.sin(theta);
    var t;

    var x = r; //we start at angle = 0 
    var y = 0;

    var startOffset = Math.ceil((centerAngle / 360) * num_segments);
    var endOffset = Math.ceil(((360 - angle) / 360) * num_segments);
    var arr = [];

    var ii;
    for (ii = startOffset; ii < num_segments - endOffset; ii++) {
        //apply the rotation matrix
        t = x;
        x = c * x - s * y;
        y = s * t + c * y;

        arr.push(x + cx);
        arr.push(y + cy);
    }

    return arr;
};
