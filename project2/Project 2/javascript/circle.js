function Circle() {
	// Origin
	this.originX = 0;
	this.originY = 0;
	this.originZ = 0;

	this.rgb = [Math.random(), Math.random(), Math.random(), 1];

	//Radius
	this.radius = 0.5;

	this.wave = -1;
	this.waveSpeed = 6;

	this.skipped = 0;
	this.shrinkedSize = 0;

	this.passedThreshold = false;
	this.poisoned = false;
	this.doNotDraw = false;
	
	this.isInCenter = false;

	// this controls the circular angle of the shape. It can be used to create a semi-circle
	// angle is the degrees
	this.angle = 360;
	this.centerAngleX = 0;
	this.centerAngleY = 0;

	// number of points of granularity
	this.samples = 360;

	//used for drawing, this should not be set directly. Generate points will create this based on the data provided above
	this.vertexPositionData = [];
	this.normalData = [];
	this.indexData = [];

	this.moonVertexNormalBuffer;
	this.moonVertexPositionBuffer;
	this.moonVertexIndexBuffer;
	
	this.originXBacteria = 0;
	this.originYBacteria = 0;
	this.originZBacteria = 0;
}

/* This method is used to recreate the points for the circle, only call thsi if one of the datasets have changed. 
    If nothing has changed, the previously created data is still valid.
*/
Circle.prototype.generatePoints = function () {
	var latitudeBands = this.samples;
	var longitudeBands = 30;

	if (this.vertexPositionData.length > 0 && this.angle == 360 || this.skipped++ % 15 != 0) {
		return;
	}
	// todo: move this logic into game.js so settings can decide how quickly the bacteria disappears
	if (this.poisoned) {
		this.shrinkedSize = this.shrinkedSize + 3;
		if (this.shrinkedSize > this.angle) {
			this.doNotDraw = true;
		}
	}

	if (this.wave != -1) {
		if (this.wave + this.waveSpeed > this.angle) {
			this.waveSpeed = -this.waveSpeed;
		} else if (this.wave < 0) {
			this.waveSpeed = -this.waveSpeed;
		}
		this.wave = this.wave + this.waveSpeed;
	}

	this.vertexPositionData = [];
	this.normalData = [];

	var theta;
	var sinTheta;
	var cosTheta;

	var phi;
	var sinPhi;
	var cosPhi;

	var x;
	var y;
	var z;
	var u;
	var v;

	var tempR;
	var dif;
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		theta = latNumber * Math.PI / latitudeBands;
		sinTheta = Math.sin(theta);
		cosTheta = Math.cos(theta);

		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
			phi = longNumber * 2 * Math.PI / longitudeBands;
			sinPhi = Math.sin(phi);
			cosPhi = Math.cos(phi);

			x = cosPhi * sinTheta;
			y = cosTheta;
			z = sinPhi * sinTheta;
			u = 1 - (longNumber / longitudeBands);
			v = 1 - (latNumber / latitudeBands);

			this.normalData.push(x + (Math.random() - 0.5) / 10);
			this.normalData.push(y + (Math.random() - 0.5) / 10);
			this.normalData.push(z + (Math.random() - 0.5) / 10);

			if (this.angle != 360 && (latNumber / this.samples > this.angle / 360 || latNumber < this.shrinkedSize)) {
				this.vertexPositionData.push(this.radius * this.originX);
				this.vertexPositionData.push(this.radius * this.originY);
				this.vertexPositionData.push(this.radius * this.originZ);
			} else if (this.angle == 360) {
				if (longNumber > 1 && longitudeBands - longNumber > 1) {
					this.vertexPositionData.push(this.radius * (x + this.originX) + (Math.random() - 0.5) / 200);
					this.vertexPositionData.push(this.radius * (y + this.originY) + (Math.random() - 0.5) / 300);
					this.vertexPositionData.push(this.radius * (z + this.originZ) + (Math.random() - 0.5) / 100);
				} else {
					this.vertexPositionData.push(this.radius * (x + this.originX));
					this.vertexPositionData.push(this.radius * (y + this.originY));
					this.vertexPositionData.push(this.radius * (z + this.originZ));
				}
			} else {
				tempR = this.radius;
				dif = Math.abs(latNumber / this.samples - this.wave / 360);
				if (this.wave != -1 && dif < 0.03) {
					this.radius = this.radius + dif;
				}

				if (longNumber > 1 && longitudeBands - longNumber > 1) {
					this.vertexPositionData.push(this.radius * (x + this.originX) + (Math.random() - 0.5) / 100);
					this.vertexPositionData.push(this.radius * (y + this.originY) + (Math.random() - 0.5) / 100);
					this.vertexPositionData.push(this.radius * (z + this.originZ) + (Math.random() - 0.5) / 100);
				} else {
					this.vertexPositionData.push(this.radius * (x + this.originX));
					this.vertexPositionData.push(this.radius * (y + this.originY));
					this.vertexPositionData.push(this.radius * (z + this.originZ));
				}

				this.radius = tempR;
			}
		}
	}

	var first;
	var second;

	this.indexData = [];
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
		for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
			first = (latNumber * (longitudeBands + 1)) + longNumber;
			second = first + longitudeBands + 1;
			this.indexData.push(first);
			this.indexData.push(second);
			this.indexData.push(first + 1);

			this.indexData.push(second);
			this.indexData.push(second + 1);
			this.indexData.push(first + 1);
		}
	}

	var gl = getGLContext();

	this.moonVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.moonVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalData), gl.STATIC_DRAW);
	this.moonVertexNormalBuffer.itemSize = 3;
	this.moonVertexNormalBuffer.numItems = this.normalData.length / 3;

	this.moonVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.moonVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexPositionData), gl.STATIC_DRAW);
	this.moonVertexPositionBuffer.itemSize = 3;
	this.moonVertexPositionBuffer.numItems = this.vertexPositionData.length / 3;

	this.moonVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.moonVertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);
	this.moonVertexIndexBuffer.itemSize = 1;
	this.moonVertexIndexBuffer.numItems = this.indexData.length;
};


Circle.prototype.generatePointsCheckIfCenter = function (uPMatrix, uMVMatrix) {
	var latitudeBands = this.samples;
	var longitudeBands = 30;

	if (this.vertexPositionData.length > 0 && this.angle == 360 || this.skipped++ % 15 != 0) {
		return;
	}
	// todo: move this logic into game.js so settings can decide how quickly the bacteria disappears
	if (this.poisoned) {
		this.shrinkedSize = this.shrinkedSize + 3;
		if (this.shrinkedSize > this.angle) {
			this.doNotDraw = true;
		}
	}

	if (this.wave != -1) {
		if (this.wave + this.waveSpeed > this.angle) {
			this.waveSpeed = -this.waveSpeed;
		} else if (this.wave < 0) {
			this.waveSpeed = -this.waveSpeed;
		}
		this.wave = this.wave + this.waveSpeed;
	}

	this.vertexPositionData = [];
	this.normalData = [];

	var theta;
	var sinTheta;
	var cosTheta;

	var phi;
	var sinPhi;
	var cosPhi;

	var x;
	var y;
	var z;
	var u;
	var v;

	var tempR;
	var dif;
	
	var coordX;
	var coordY;
	var coordZ;
	
	var coordXRotated;
	var coordYRotated;
	var coordZRotated;
	
	var randX;
	var randY;
	var randZ;
	
	this.isInCenter = false;
	
	var rotMat = mat4.create();
	mat4.multiply(uPMatrix, uMVMatrix, rotMat); 

	this.originXBacteria = rotMat[4];// + rotMat[12];
	this.originYBacteria = rotMat[5];// + rotMat[13];
	this.originZBacteria = rotMat[6];// + rotMat[14];
	
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		theta = latNumber * Math.PI / latitudeBands;
		sinTheta = Math.sin(theta);
		cosTheta = Math.cos(theta);

		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
			phi = longNumber * 2 * Math.PI / longitudeBands;
			sinPhi = Math.sin(phi);
			cosPhi = Math.cos(phi);

			x = cosPhi * sinTheta;
			y = cosTheta;
			z = sinPhi * sinTheta;
			u = 1 - (longNumber / longitudeBands);
			v = 1 - (latNumber / latitudeBands);

			randX = Math.random();
			randY = Math.random();
			randZ = Math.random();
			
			if (this.angle != 360 && (latNumber / this.samples > this.angle / 360 || latNumber < this.shrinkedSize)) {
				this.vertexPositionData.push(this.radius * this.originX);
				this.vertexPositionData.push(this.radius * this.originY);
				this.vertexPositionData.push(this.radius * this.originZ);
			} else if (this.angle == 360) {
				if (longNumber > 1 && longitudeBands - longNumber > 1) {
					this.vertexPositionData.push(this.radius * (x + this.originX) + (randX - 0.5) / 200);
					this.vertexPositionData.push(this.radius * (y + this.originY) + (randY - 0.5) / 300);
					this.vertexPositionData.push(this.radius * (z + this.originZ) + (randZ - 0.5) / 100);
				} else {
					this.vertexPositionData.push(this.radius * (x + this.originX));
					this.vertexPositionData.push(this.radius * (y + this.originY));
					this.vertexPositionData.push(this.radius * (z + this.originZ));
				}
				randX = randX/10;
				randY = randY/10;
				randZ = randZ/10;
			} else {
				tempR = this.radius;
				dif = Math.abs(latNumber / this.samples - this.wave / 360);
				if (this.wave != -1 && dif < 0.02) {
					this.radius = this.radius + dif;
					randX = randX/2;
					randY = randY/2;
					randZ = randZ/2;
				}else{
					randX = randX/10;
					randY = randY/10;
					randZ = randZ/10;
				}

				if (longNumber > 1 && longitudeBands - longNumber > 1) {
					coordX = this.radius * (x + this.originX) + (randX - 0.5) / 100;
					coordY = this.radius * (y + this.originY) + (randY - 0.5) / 100;
					coordZ = this.radius * (z + this.originZ) + (randZ - 0.5) / 100;
				} else {
					coordX = this.radius * (x + this.originX);
					coordY = this.radius * (y + this.originY);
					coordZ = this.radius * (z + this.originZ);
				}
				
 				coordXRotated = coordX*rotMat[0] + coordY*rotMat[4] + coordZ*rotMat[8] + rotMat[12];
	 			coordYRotated = coordX*rotMat[1] + coordY*rotMat[5] + coordZ*rotMat[9] + rotMat[13];
	 			coordZRotated = coordX*rotMat[2] + coordY*rotMat[6] + coordZ*rotMat[10] + rotMat[14];
				
				if (coordZRotated < 2.5 && Math.abs(coordXRotated) < 0.1 && Math.abs(coordYRotated) < 0.1){
					this.isInCenter = true;
				}
				
				this.vertexPositionData.push(coordX);
				this.vertexPositionData.push(coordY);
				this.vertexPositionData.push(coordZ);
				
				this.radius = tempR;
			}
			
			this.normalData.push(x + (randX - 0.5));
			this.normalData.push(y + (randY - 0.5));
			this.normalData.push(z + (randZ - 0.5));
		}
	}

	var first;
	var second;

	this.indexData = [];
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
		for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
			first = (latNumber * (longitudeBands + 1)) + longNumber;
			second = first + longitudeBands + 1;
			this.indexData.push(first);
			this.indexData.push(second);
			this.indexData.push(first + 1);

			this.indexData.push(second);
			this.indexData.push(second + 1);
			this.indexData.push(first + 1);
		}
	}

	var gl = getGLContext();

	this.moonVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.moonVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalData), gl.STATIC_DRAW);
	this.moonVertexNormalBuffer.itemSize = 3;
	this.moonVertexNormalBuffer.numItems = this.normalData.length / 3;

	this.moonVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.moonVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexPositionData), gl.STATIC_DRAW);
	this.moonVertexPositionBuffer.itemSize = 3;
	this.moonVertexPositionBuffer.numItems = this.vertexPositionData.length / 3;

	this.moonVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.moonVertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);
	this.moonVertexIndexBuffer.itemSize = 1;
	this.moonVertexIndexBuffer.numItems = this.indexData.length;
};