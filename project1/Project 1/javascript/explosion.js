var samplesForEachCircleInExplosion = 20;
var sizeOfEachCircleInExplosion = 0.01;

var numOfDrawCylesToGrow = 1;
var growthSize = 0.005;
var spreadOfExplision = 2.0;
var totalGrowthLifecycle = 20;

function Explosion() {
    this.drawCycles = 0;
    this.numberOfTimesGrownInSize = 0;
    this.radiusOfExplision = 0;

    this.originX = 0;
    this.originY = 0;

    this.circles = [];

    var gl = getGLContext();

    if (sizeOfEachCircleInExplosion > 0.1) {
        this.GL_MODE = gl.TRIANGLE_FAN;
    } else {
        this.GL_MODE = gl.TRIANGLE_STRIP;
    }

    var circle = new Circle();
    circle.samples = samplesForEachCircleInExplosion;
    circle.radius = sizeOfEachCircleInExplosion;
    circle.circleType = this.GL_MODE;
    this.circles.push(circle);

    circle = new Circle();
    circle.samples = samplesForEachCircleInExplosion;
    circle.radius = sizeOfEachCircleInExplosion;
    circle.circleType = this.GL_MODE;
    this.circles.push(circle);

    circle = new Circle();
    circle.samples = samplesForEachCircleInExplosion;
    circle.radius = sizeOfEachCircleInExplosion;
    circle.circleType = this.GL_MODE;
    this.circles.push(circle);

    circle = new Circle();
    circle.samples = samplesForEachCircleInExplosion;
    circle.radius = sizeOfEachCircleInExplosion;
    circle.circleType = this.GL_MODE;
    this.circles.push(circle);

    circle = new Circle();
    circle.samples = samplesForEachCircleInExplosion;
    circle.radius = sizeOfEachCircleInExplosion;
    circle.circleType = this.GL_MODE;
    this.circles.push(circle);

    circle = new Circle();
    circle.samples = samplesForEachCircleInExplosion;
    circle.radius = sizeOfEachCircleInExplosion;
    circle.circleType = this.GL_MODE;
    this.circles.push(circle);

    circle = new Circle();
    circle.samples = samplesForEachCircleInExplosion;
    circle.radius = sizeOfEachCircleInExplosion;
    circle.circleType = this.GL_MODE;
    this.circles.push(circle);

    circle = new Circle();
    circle.samples = samplesForEachCircleInExplosion;
    circle.radius = sizeOfEachCircleInExplosion;
    circle.circleType = this.GL_MODE;
    this.circles.push(circle);

    //used for drawing, this should not be set directly. Generate points will create this based on the data provided above
    this.pointCount = 0;
    this.points = [];
}

Explosion.prototype.generatePoints = function () {
    this.drawCycles++;

    // every time the circle is drawn, the radius is increased
    if (this.drawCycles > numOfDrawCylesToGrow) {
        this.drawCycles = 0;
        this.radiusOfExplision = this.radiusOfExplision + growthSize;
        this.numberOfTimesGrownInSize++;
    }

    this.points = [];
    // after some number of draws, the circles are not drawn anymore
    if (this.numberOfTimesGrownInSize < totalGrowthLifecycle) {
        // go through each circle and position the circle and decrease teh size
        for (var i in this.circles) {
            // the size of teh circle is decresed as its being drawn
            this.circles[i].radius = sizeOfEachCircleInExplosion * (1 - this.numberOfTimesGrownInSize / totalGrowthLifecycle);
            switch (i) {
                case "0":
                    this.circles[i].originX = this.radiusOfExplision + this.originX;
                    this.circles[i].originY = this.radiusOfExplision + this.originY;
                    break;
                case "1":
                    this.circles[i].originX = -this.radiusOfExplision + this.originX;
                    this.circles[i].originY = this.radiusOfExplision + this.originY;
                    break;
                case "2":
                    this.circles[i].originX = this.radiusOfExplision + this.originX;
                    this.circles[i].originY = -this.radiusOfExplision + this.originY;
                    break;
                case "3":
                    this.circles[i].originX = -this.radiusOfExplision + this.originX;
                    this.circles[i].originY = -this.radiusOfExplision + this.originY;
                    break;
                case "4":
                    this.circles[i].originX = 0.5 * this.radiusOfExplision + this.originX;
                    this.circles[i].originY = this.originY;
                    break;
                case "5":
                    this.circles[i].originX = this.originX;
                    this.circles[i].originY = 0.5 * this.radiusOfExplision + this.originY;
                    break;
                case "6":
                    this.circles[i].originX = -0.5 * this.radiusOfExplision + this.originX;
                    this.circles[i].originY = this.originY;
                    break;
                case "7":
                    this.circles[i].originX = 0 + this.originX;
                    this.circles[i].originY = -0.5 * this.radiusOfExplision + this.originY;
                    break;
            }
            this.circles[i].generatePoints();
            this.points = this.points.concat(this.circles[i].points);
        }
    }
    // divide by two since each point has x and y coordinates (two integers for each point)
    this.pointCount = this.points.length / 2;
};

// There is a flag for the type of circle, this method translates the type of cirle to GL mode.
Explosion.prototype.getMode = function () {
    return this.GL_MODE;
};

Explosion.prototype.getColourArray = function () {
    var colourArray = [];

    if (this.numberOfTimesGrownInSize < totalGrowthLifecycle) {
        for (var i in this.circles) {
            colourArray = colourArray.concat(this.circles[i].getColourArray());
        }
    }

    return colourArray;
};

// larger explosion for failure. Earth explosing
var setLargerExplosionSize = function () {
    sizeOfEachCircleInExplosion = 0.3;
    totalGrowthLifecycle = 60;
    growthSize = 0.04;
}

// smalled explosion for success
var setSmallerExplosionSize = function () {
    sizeOfEachCircleInExplosion = 0.01;
    totalGrowthLifecycle = 20;
    growthSize = 0.005;
}
