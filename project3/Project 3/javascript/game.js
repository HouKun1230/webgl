// This is a flag for the main run loop. It makes sure iniitialize game is only called once, all other times would only be a render.
// Only run application is called to get everything going.
var firstTime = true;

// webgl stuff
var canvas;
var gl;
var program;

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var moonRotationMatrix = mat4.create();
mat4.identity(moonRotationMatrix);

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var lightingPostionX = 0;
var lightingPostionY = -1;

var randomColours = true;

var currentAngleY = 0;
var currentAngleX = 0;

var ZoomLevel = 45;

var OffsetPositionX = 0;
var OffsetPositionY = 0;

var clickListener = function (event) {
	mouseDown = false;
}

var handleMouseDown = function (event) {
	mouseDown = true;

	// get the rectangle of the canvas
	var rect = canvas.getBoundingClientRect();

	// the x, y coordinates of the click are for inside the webpage and not the canvas.
	// the extra space above and on the left of the canvas must be removed
	var xWithinCanvas = (event.clientX - rect.left);
	var yWithinCanvas = (event.clientY - rect.top);

	lastMouseX = (2 * xWithinCanvas) / canvas.width - 1;
	lastMouseY = (2 * (canvas.height + (-1 * yWithinCanvas))) / canvas.height - 1;
}

var handleMouseUp = function (event) {
	mouseDown = false;
}

var mouseLeftCanvas = function (event) {
	mouseDown = false;
}

var handleMouseMove = function (event) {
	// get the rectangle of the canvas
	var rect = canvas.getBoundingClientRect();

	// the x, y coordinates of the click are for inside the webpage and not the canvas.
	// the extra space above and on the left of the canvas must be removed
	var xWithinCanvas = (event.clientX - rect.left);
	var yWithinCanvas = (event.clientY - rect.top);

	var newX = (2 * xWithinCanvas) / canvas.width - 1;
	var newY = (2 * (canvas.height + (-1 * yWithinCanvas))) / canvas.height - 1;

	lightingPostionX = -newX;
	lightingPostionY = -newY;

	if (mouseDown) {
		var deltaX = newX - lastMouseX
		var newRotationMatrix = mat4.create();
		mat4.identity(newRotationMatrix);
		mat4.rotate(newRotationMatrix, degToRad(deltaX * 100), [0, 1, 0]);

		var deltaY = newY - lastMouseY;
		mat4.rotate(newRotationMatrix, -degToRad(deltaY * 100), [1, 0, 0]);

		mat4.multiply(newRotationMatrix, moonRotationMatrix, moonRotationMatrix);

		currentAngleX += deltaX * 100;
		currentAngleY += deltaY * 100;

		currentAngleX = currentAngleX % 180;
		currentAngleY = currentAngleY % 360;

		lastMouseX = newX;
		lastMouseY = newY;
	}
}

var xplus = false;
var xminus = false;
var yplus = false;
var yminus = false;

var posxplus = false;
var posxminus = false;
var posyplus = false;
var posyminus = false;
var zoomIn = false;
var zoomOut = false;

function keyDownListener(e) {
	e = e || window.event;

	if (e.keyCode == '38') {
		// up arrow
		yplus = true;
	} else if (e.keyCode == '40') {
		// down arrow
		yminus = true;
	} else if (e.keyCode == '37') {
		// left arrow
		xminus = true;
	} else if (e.keyCode == '39') {
		// right arrow
		xplus = true;
	} else if (e.keyCode == '87') { // w
		posyplus = true;
	} else if (e.keyCode == '83') { // s
		posyminus = true;
	} else if (e.keyCode == '65') { // a
		posxplus = true;
	} else if (e.keyCode == '68') { // d
		posxminus = true;
	} else if (e.keyCode == '81') { // q
		zoomIn = true;
	} else if (e.keyCode == '69') { // r
		zoomOut = true;
	}
}

function keyUpListener(e) {
	e = e || window.event;

	if (e.keyCode == '38') {
		// up arrow
		yplus = false;
	} else if (e.keyCode == '40') {
		// down arrow
		yminus = false;
	} else if (e.keyCode == '37') {
		// left arrow
		xminus = false;
	} else if (e.keyCode == '39') {
		// right arrow
		xplus = false;
	} else if (e.keyCode == '87') { // w
		posyplus = false;
	} else if (e.keyCode == '83') { // s
		posyminus = false;
	} else if (e.keyCode == '65') { // a
		posxplus = false;
	} else if (e.keyCode == '68') { // d
		posxminus = false;
	} else if (e.keyCode == '81') { // q
		zoomIn = false;
	} else if (e.keyCode == '69') { // e
		zoomOut = false;
	}
}

var initializeGame = function () {
	console.log("Game initialize started");

	canvas = document.getElementById('game-surface');
	gl = canvas.getContext('webgl');

	if (!gl) {
		console.log('Webgl not supported, falling back to experimental.');
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Webgl is not supported.');
	}

	initShaders();

	// Resize canvas does the sizing stuff. Maybe we aren't technically resizing here since there is nothing on the screen yet.
	// Or we are resizing from a size of nothing.
	resizeCanvas();

	gl.clearColor(0, 0, 0, 0.1);

	// Enable depth testing
	gl.enable(gl.DEPTH_TEST);
	// Near things obscure far things
	gl.depthFunc(gl.LEQUAL);
	// Clear the color as well as the depth buffer.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	tick();

	canvas.addEventListener('click', clickListener);
	canvas.addEventListener('mouseup', handleMouseUp);
	canvas.addEventListener('mousedown', handleMouseDown);
	canvas.addEventListener('mousemove', handleMouseMove);
	canvas.addEventListener('mouseout', mouseLeftCanvas);
	document.onkeydown = keyDownListener;
	document.onkeyup = keyUpListener;

	var music = new Audio('../audio/game_music.mp4');
	music.loop = true;
	//	music.play();
};

var shaderProgram;

function initShaders() {
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
	}

	gl.validateProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(shaderProgram));
		return;
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.customColour = gl.getUniformLocation(shaderProgram, "customColour");
	shaderProgram.offset = gl.getUniformLocation(shaderProgram, "offset");
	shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
	shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
	shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
}
// a getter method since other classes cant access the property directly
var getGLContext = function () {
	return gl;
}

// this will resize the canvas, there should be no effect from calling this method is the size hasn't changed.
var resizeCanvas = function () {
	var height = window.innerHeight - 90;
	var width = window.innerWidth;

	var canvas2 = gl.canvas;

	canvas.width = width;
	canvas.height = height;
	canvas2.width = width;
	canvas2.height = height;

	gl.viewport(0, 0, canvas.width, canvas.height);

	if (zoomIn) {
		ZoomLevel -= 1;
	}

	if (zoomOut) {
		ZoomLevel += 1;
	}

	mat4.perspective(ZoomLevel, canvas.width / canvas.height, 0.1, 10000.0, pMatrix);
};

var redraw = function () {
	/* The first step is get all of the vertices, or coordinates*/
	var newRotationMatrix = mat4.create();
	var deltaX = 0;
	var deltaY = 0;
	var rate = 0.01;

	if (xplus) {
		deltaX += rate;
	}

	if (xminus) {
		deltaX -= rate;
	}

	if (yplus) {
		deltaY += rate;
	}

	if (yminus) {
		deltaY -= rate;
	}

	if (posxplus) {
		OffsetPositionX += rate;
	}

	if (posxminus) {
		OffsetPositionX -= rate;
	}

	if (posyplus) {
		OffsetPositionY += rate;
	}

	if (posyminus) {
		OffsetPositionY -= rate;
	}

	mat4.identity(newRotationMatrix);
	mat4.rotate(newRotationMatrix, degToRad(deltaX * 100), [0, 1, 0]);
	mat4.rotate(newRotationMatrix, -degToRad(deltaY * 100), [1, 0, 0]);
	mat4.multiply(newRotationMatrix, moonRotationMatrix, moonRotationMatrix);
	currentAngleX += deltaX * 100;
	currentAngleY += deltaY * 100;
	currentAngleX = currentAngleX % 180;
	currentAngleY = currentAngleY % 360;
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0, 0, -4]);
	mat4.multiply(mvMatrix, moonRotationMatrix);

	setMatrixUniforms();
	updateLighting();

	gl.uniform3f(
		shaderProgram.offset,
		OffsetPositionX,
		OffsetPositionY,
		0
	);

	if (moonVertexNormalBufferArray.length == 0) {
		moonVertexNormalBufferArray = [];
		moonVertexPositionBufferArray = [];

		var branchCount = getCustomBranchCount();
		var branchLenght = getCustomBranchLength() / 20;

		if (isBranchCountRandom() == "true") {
			branchCount = Math.ceil(Math.random() * 7 + 3);
		}

		if (isBranchLengthRandom() == "true") {	
			branchLenght = (Math.random() * 3 + 1) / 20;
		}
		
		var d = 1.5;

		drawFractalBranch(20, branchLenght, 0, -1, 0, 0, 0, branchCount, 0, 0, 0, false);
		drawFractalBranch(20, branchLenght, d, -1, -d, 0, 0, branchCount, 0, 0, 0, false);
		drawFractalBranch(20, branchLenght, -d, -1, -d, 0, 0, branchCount, 0, 0, 0, false);
		drawFractalBranch(20, branchLenght, -d, -1, d, 0, 0, branchCount, 0, 0, 0, false);
		drawFractalBranch(20, branchLenght, d, -1, d, 0, 0, branchCount, 0, 0, 0, false);
		
	} else {
		var arrayLength = moonVertexNormalBufferArray.length;
		for (var i = 0; i < arrayLength; i++) {
			if (randomColours) {
				gl.uniform3f(
					shaderProgram.customColour,
					Math.random() * 0.8,
					Math.random() * 0.8,
					Math.random() * 0.8
				);
			} else {
				gl.uniform3f(
					shaderProgram.customColour,
					r,
					g,
					b
				);
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBufferArray[i]);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBufferArray[i].itemSize, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBufferArray[i]);
			gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, moonVertexNormalBufferArray[i].itemSize, gl.FLOAT, false, 0, 0);
			gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
		arrayLength = moonVertexNormalBufferArray2.length;
		for (var i = 0; i < arrayLength; i++) {
			gl.uniform3f(
				shaderProgram.customColour,
				Math.random() * 0.8,
				Math.random() * 0.8,
				Math.random() * 0.8
			);
			gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBufferArray2[i]);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBufferArray2[i].itemSize, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBufferArray2[i]);
			gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, moonVertexNormalBufferArray2[i].itemSize, gl.FLOAT, false, 0, 0);
			gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	}
}

var moonVertexNormalBuffer;
var moonVertexPositionBuffer;
var moonVertexIndexBuffer;

var moonVertexNormalBufferArray = [];
var moonVertexPositionBufferArray = [];

var moonVertexNormalBufferArray2 = [];
var moonVertexPositionBufferArray2 = [];

var r = Math.random();
var g = Math.random();
var b = Math.random();

var drawFractalBranch = function (angle, radius, originX, originY, originZ, angleX, angleY, branchLength, offsetX, offsetY, offsetZ, final) {
	var latitudeBands = 10;
	var longitudeBands = 10;

	var vertexPositionData = [];
	var normalData = [];

	var theta;
	var sinTheta;
	var cosTheta;

	var phi;
	var sinPhi;
	var cosPhi;

	var x;
	var y;
	var z;

	var tempR;
	var dif;

	var tempX;
	var tempY;
	var tempZ;

	var branchX = 0;
	var branchY = 0;
	var branchZ = 0;

	var count = 0;

	var drawn = false;

	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		if (angle != 360 && (latNumber / latitudeBands > angle / 360)) {
			for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
				vertexPositionData.push(originX);
				vertexPositionData.push(originY);
				vertexPositionData.push(originZ);

				normalData.push(x);
				normalData.push(y);
				normalData.push(z);
			}
		} else {
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

				normalData.push(x + (Math.random() - 0.5) / 10);
				normalData.push(y + (Math.random() - 0.5) / 10);
				normalData.push(z + (Math.random() - 0.5) / 10);

				if (longNumber > 1 && longitudeBands - longNumber > 1) {
					if (final) {
						tempX = radius * (x) + (Math.random() - 0.5) / 50 + originX + offsetX;
						tempY = radius * (y) + (Math.random() - 0.5) / 50 + originY + offsetY;
						tempZ = radius * (z) + (Math.random() - 0.5) / 50 + originZ + offsetZ;
					} else {
						tempX = radius * (x) + (Math.random() - 0.5) / 30 + originX + offsetX;
						tempY = radius * (y) + (Math.random() - 0.5) / 30 + originY + offsetY;
						tempZ = radius * (z) + (Math.random() - 0.5) / 30 + originZ + offsetZ;
					}
				} else {
					tempX = radius * (x) + originX + offsetX;
					tempY = radius * (y) + originY + offsetY;
					tempZ = radius * (z) + originZ + offsetZ;
				}

				branchX += tempX;
				branchY += tempY;
				branchZ += tempZ;
				count++;

				if (drawn == false && final == false && branchLength > 0) {
					drawn = true;
					branchLength = branchLength - 1;

					var direction = getBranchDirection();

					if (direction == "Left") {
						var changeX = branchLength * Math.random() / 15;
						var changeY = branchLength * (Math.random()) / 15;
						var changeZ = branchLength * Math.random() / 15;

						changeX = -Math.abs(changeX);
						changeZ = -Math.abs(changeZ);

						if (changeX < 0.1) {
							changeX += 0.05;
						} else if (changeX > -0.1) {
							changeX -= 0.05;
						}

						if (changeZ < 0.1) {
							changeZ += 0.05;
						} else if (changeZ > -0.1) {
							changeZ -= 0.05;
						}

						var atleastOneCreated = Math.random();

						if (atleastOneCreated < 1 / 5 || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX, offsetY / 10 + changeY, offsetZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 2 / 5 && atleastOneCreated >= 1 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + changeX, offsetY / 10 + changeY, offsetZ / 10 + changeZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 3 / 5 && atleastOneCreated >= 2 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + (Math.random() + 0.5) * changeX, offsetY / 10 + changeY, offsetZ / 10 + (Math.random() + 0.5) * changeZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 4 / 5 && atleastOneCreated >= 3 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + (Math.random() + 0.5) * changeX, offsetY / 10 + changeY, offsetZ / 10 + changeZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 5 / 5 && atleastOneCreated >= 4 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + changeX, offsetY / 10 + changeY, offsetZ / 10 + (Math.random() + 0.5) * changeZ, false);
						}
					} else if (direction == "Right") {
						var changeX = branchLength * (Math.random()) / 15;
						var changeY = branchLength * (Math.random()) / 15;
						var changeZ = branchLength * (Math.random()) / 15;

						changeX = Math.abs(changeX);
						changeZ = Math.abs(changeZ);

						if (changeX < 0.1) {
							changeX += 0.05;
						} else if (changeX > -0.1) {
							changeX -= 0.05;
						}

						if (changeZ < 0.1) {
							changeZ += 0.05;
						} else if (changeZ > -0.1) {
							changeZ -= 0.05;
						}

						var atleastOneCreated = Math.random();

						if (atleastOneCreated < 1 / 5 || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX, offsetY / 10 + changeY, offsetZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 2 / 5 && atleastOneCreated >= 1 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + changeX, offsetY / 10 + changeY, offsetZ / 10 + changeZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 3 / 5 && atleastOneCreated >= 2 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + (Math.random() + 0.5) * changeX, offsetY / 10 + changeY, offsetZ / 10 + (Math.random() + 0.5) * changeZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 4 / 5 && atleastOneCreated >= 3 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + (Math.random() + 0.5) * changeX, offsetY / 10 + changeY, offsetZ / 10 + changeZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 5 / 5 && atleastOneCreated >= 4 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + changeX, offsetY / 10 + changeY, offsetZ / 10 + (Math.random() + 0.5) * changeZ, false);
						}
					} else if (direction == "Random") {
						var changeX = branchLength * (Math.random() - 0.5) / 8;
						var changeY = branchLength * (Math.random()) / 15;
						var changeZ = branchLength * (Math.random() - 0.5) / 8;

						if (changeX < 0.1) {
							changeX += 0.05;
						} else if (changeX > -0.1) {
							changeX -= 0.05;
						}

						if (changeZ < 0.1) {
							changeZ += 0.05;
						} else if (changeZ > -0.1) {
							changeZ -= 0.05;
						}

						var atleastOneCreated = Math.random();

						if (atleastOneCreated < 1 / 5 || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX, offsetY / 10 + changeY, offsetZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 2 / 5 && atleastOneCreated >= 1 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + changeX, offsetY / 10 + changeY, offsetZ / 10 + changeZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 3 / 5 && atleastOneCreated >= 2 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 - changeX, offsetY / 10 + changeY, offsetZ / 10 - changeZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 4 / 5 && atleastOneCreated >= 3 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 - changeX, offsetY / 10 + changeY, offsetZ / 10 + changeZ, false);
							atleastOneCreated = 0;
						}

						if ((atleastOneCreated < 5 / 5 && atleastOneCreated >= 4 / 5) || Math.random() < 0.25) {
							drawFractalBranch(angle, radius * 0.8, tempX, tempY, tempZ, angleX, angleY, branchLength, offsetX / 10 + changeX, offsetY / 10 + changeY, offsetZ / 10 - changeZ, false);
						}
					}
				}

				vertexPositionData.push(tempX);
				vertexPositionData.push(tempY);
				vertexPositionData.push(tempZ);
			}
		}
	}

	var gl = getGLContext();

	moonVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
	moonVertexNormalBuffer.itemSize = 3;
	moonVertexNormalBuffer.numItems = normalData.length / 3;

	moonVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
	moonVertexPositionBuffer.itemSize = 3;
	moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;

	if (moonVertexIndexBuffer == undefined) {
		var first;
		var second;

		indexData = [];
		for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
			for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
				first = (latNumber * (longitudeBands + 1)) + longNumber;
				second = first + longitudeBands + 1;
				indexData.push(first);
				indexData.push(second);
				indexData.push(first + 1);

				indexData.push(second);
				indexData.push(second + 1);
				indexData.push(first + 1);
			}
		}

		moonVertexIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
		moonVertexIndexBuffer.itemSize = 1;
		moonVertexIndexBuffer.numItems = indexData.length;
	}

	if (final) {
		gl.uniform3f(
			shaderProgram.customColour,
			Math.random(),
			Math.random(),
			Math.random()
		);
	} else {
		gl.uniform3f(
			shaderProgram.customColour,
			r,
			g,
			b
		);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, moonVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	if (final) {
		moonVertexNormalBufferArray2.push(moonVertexNormalBuffer);
		moonVertexPositionBufferArray2.push(moonVertexPositionBuffer);
	} else {
		moonVertexNormalBufferArray.push(moonVertexNormalBuffer);
		moonVertexPositionBufferArray.push(moonVertexPositionBuffer);
	}

	if (!final && branchLength == 0) {
		offsetZ = 0;
		offsetY = 0;
		offsetX = 0;
		var changeX = (Math.random() - 0.5) / 20;
		var changeY = (Math.random() - 0.5) / 20;
		var changeZ = (Math.random() - 0.5) / 20;

		angle = 360;
		radius = 0.01;
		drawFractalBranch(angle, radius * (Math.random() + 0.5), tempX, tempY, tempZ, angleX, angleY, 0, offsetX / 10 + changeX, offsetY / 10 + changeY, offsetZ / 10 + changeZ, true);

		drawFractalBranch(angle, radius * (Math.random() + 0.5), tempX, tempY, tempZ, angleX, angleY, 0, offsetX / 10 - changeX, offsetY / 10 + changeY, offsetZ / 10 - changeZ, true);

		drawFractalBranch(angle, radius * (Math.random() + 0.5), tempX, tempY, tempZ, angleX, angleY, 0, offsetX / 10 - changeX, offsetY / 10 + changeY, offsetZ / 10 + changeZ, true);

		drawFractalBranch(angle, radius * (Math.random() + 0.5), tempX, tempY, tempZ, angleX, angleY, 0, offsetX / 10 + changeX, offsetY / 10 + changeY, offsetZ / 10 - changeZ, true);
	}
}

var updateLighting = function () {
	if (getLighting() == "false") {
		gl.uniform1i(shaderProgram.useLightingUniform, false);
	} else {
		gl.uniform1i(shaderProgram.useLightingUniform, true);
	}

	gl.uniform3f(
		shaderProgram.ambientColorUniform,
		parseFloat(0.5),
		parseFloat(0.5),
		parseFloat(0.5)
	);

	var lightingDirection = [
		parseFloat(lightingPostionX),
		parseFloat(lightingPostionY),
		parseFloat(-0.4)
	];
	var adjustedLD = vec3.create();
	vec3.normalize(lightingDirection, adjustedLD);
	vec3.scale(adjustedLD, -0.8);
	gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

	gl.uniform3f(
		shaderProgram.directionalColorUniform,
		parseFloat(1),
		parseFloat(1),
		parseFloat(1)
	);
}

/* Start of time for the game. This will be the method which would initialize everything */
// This is called once by game.html in the on load method.
function runApplication() {
	// This condition is required to make sure that the initialize game is only called once.
	if (firstTime) {
		initializeGame();
		firstTime = false;
	}

	// Start the game.
	tick();
}

/* This is used to keep track of time. The bacteria growth will be controlled. Tick like a clock. */
function tick() {
	resizeCanvas();
	redraw();
	requestAnimFrame(tick);
}

// Rotation Helper
function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

	var normalMatrix = mat3.create();
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

// Helper methods
function getShader(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

function radToDeg(radians) {
	return radians * 180 / Math.PI;
}
