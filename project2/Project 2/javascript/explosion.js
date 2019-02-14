var samplesForEachCircleInExplosion = 5;
var sizeOfEachCircleInExplosion = 0.01;

var numOfDrawCylesToGrow = 1;
var growthSize = 0.1;
var spreadOfExplision = 2.5;
var totalGrowthLifecycle = 40;

function Explosion() {
	this.drawCycles = 0;
	this.numberOfTimesGrownInSize = 0;
	this.radiusOfExplision = 0;

	this.originX = 0;
	this.originY = 0;
	this.originZ = 0;

	this.circles = [];

	for (var i = 0; i < 24; i++) {
		var circle = new Circle();
		circle.samples = samplesForEachCircleInExplosion;
		circle.radius = sizeOfEachCircleInExplosion;
		this.circles.push(circle);
	}
}

Explosion.prototype.generatePoints = function () {
	this.drawCycles++;

	// every time the circle is drawn, the radius is increased
	if (this.drawCycles > numOfDrawCylesToGrow) {
		this.drawCycles = 0;
		this.radiusOfExplision = this.radiusOfExplision + growthSize;
		this.numberOfTimesGrownInSize++;
	}

	// after some number of draws, the circles are not drawn anymore
	if (this.numberOfTimesGrownInSize < totalGrowthLifecycle) {
		// go through each circle and position the circle and decrease teh size
		for (var i in this.circles) {
			// the size of teh circle is decresed as its being drawn
			this.circles[i].angle = 360 * (1 - this.numberOfTimesGrownInSize / totalGrowthLifecycle);
			switch (i) {
				case "0":
					this.circles[i].originX = this.radiusOfExplision + this.originX;
					this.circles[i].originZ = this.originZ;
					this.circles[i].originY = this.radiusOfExplision + this.originY;
					break;
				case "1":
					this.circles[i].originX = -this.radiusOfExplision + this.originX;
					this.circles[i].originY = this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.originZ;
					break;
				case "2":
					this.circles[i].originX = this.radiusOfExplision + this.originX;
					this.circles[i].originZ = this.originZ;
					this.circles[i].originY = -this.radiusOfExplision + this.originY;
					break;
				case "3":
					this.circles[i].originX = -this.radiusOfExplision + this.originX;
					this.circles[i].originY = -this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.originZ;
					break;
				case "4":
					this.circles[i].originX = this.radiusOfExplision + this.originX;
					this.circles[i].originY = this.originY;
					this.circles[i].originZ = this.originZ;
					break;
				case "5":
					this.circles[i].originX = this.originX;
					this.circles[i].originY = 0.5 * this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.originZ;
					break;
				case "6":
					this.circles[i].originX = -0.5 * this.radiusOfExplision + this.originX;
					this.circles[i].originY = this.originY;
					this.circles[i].originZ = this.originZ;
					break;
				case "7":
					this.circles[i].originX = 0 + this.originX;
					this.circles[i].originY = this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.originZ;
					break;
				case "8":
					this.circles[i].originX = this.radiusOfExplision + this.originX;
					this.circles[i].originY = this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.radiusOfExplision + this.originZ;
					break;
				case "9":
					this.circles[i].originX = -this.radiusOfExplision + this.originX;
					this.circles[i].originY = this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.radiusOfExplision + this.originZ;
					break;
				case "10":
					this.circles[i].originX = this.radiusOfExplision + this.originX;
					this.circles[i].originY = -this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.radiusOfExplision + this.originZ;
					break;
				case "11":
					this.circles[i].originX = -this.radiusOfExplision + this.originX;
					this.circles[i].originY = -this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.radiusOfExplision + this.originZ;
					break;
				case "12":
					this.circles[i].originX = this.radiusOfExplision + this.originX;
					this.circles[i].originY = this.originY;
					this.circles[i].originZ = this.radiusOfExplision + this.originZ;
					break;
				case "13":
					this.circles[i].originX = this.originX;
					this.circles[i].originY = 0.5 * this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.radiusOfExplision + this.originZ;
					break;
				case "14":
					this.circles[i].originX = this.radiusOfExplision + this.originX;
					this.circles[i].originY = this.originY;
					this.circles[i].originZ = this.radiusOfExplision + this.originZ;
					break;
				case "15":
					this.circles[i].originX = 0 + this.originX;
					this.circles[i].originY = -0.5 * this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.radiusOfExplision + this.originZ;
					break;
				case "16":
					this.circles[i].originX = this.radiusOfExplision + this.originX;
					this.circles[i].originY = this.radiusOfExplision + this.originY;
					this.circles[i].originZ = this.radiusOfExplision + this.originZ;
					this.circles[i].originZ = -this.radiusOfExplision + this.originZ;
					break;
				case "17":
					this.circles[i].originX = -this.radiusOfExplision + this.originX;
					this.circles[i].originY = this.radiusOfExplision + this.originY;
					this.circles[i].originZ = -this.radiusOfExplision + this.originZ;
					break;
				case "18":
					this.circles[i].originX = this.radiusOfExplision + this.originX;
					this.circles[i].originY = -this.radiusOfExplision + this.originY;
					this.circles[i].originZ = -this.radiusOfExplision + this.originZ;
					break;
				case "19":
					this.circles[i].originX = -this.radiusOfExplision + this.originX;
					this.circles[i].originY = -this.radiusOfExplision + this.originY;
					this.circles[i].originZ = -this.radiusOfExplision + this.originZ;
					break;
				case "20":
					this.circles[i].originX = 0.5 * this.radiusOfExplision + this.originX;
					this.circles[i].originZ = -this.radiusOfExplision + this.originZ;
					this.circles[i].originY = this.originY;
					break;
				case "21":
					this.circles[i].originX = this.originX;
					this.circles[i].originY = 0.5 * this.radiusOfExplision + this.originY;
					this.circles[i].originZ = -this.radiusOfExplision + this.originZ;
					break;
				case "22":
					this.circles[i].originX = -0.5 * this.radiusOfExplision + this.originX;
					this.circles[i].originZ = -this.radiusOfExplision + this.originZ;
					this.circles[i].originY = this.originY;
					break;
				case "23":
					this.circles[i].originX = 0 + this.originX;
					this.circles[i].originY = -0.5 * this.radiusOfExplision + this.originY;
					this.circles[i].originZ = -this.radiusOfExplision + this.originZ;
					break;
			}
			this.circles[i].generatePoints();
		}
	} else {
		this.circles = [];
	}
};

// larger explosion for failure. Earth explosing
var setLargerExplosionSize = function () {
	sizeOfEachCircleInExplosion = 0.1;
	totalGrowthLifecycle = 60;
	growthSize = 0.1;
}

// smalled explosion for success
var setSmallerExplosionSize = function () {
	sizeOfEachCircleInExplosion = 0.01;
	totalGrowthLifecycle = 20;
	growthSize = 0.1;
}
