var GAME_STATE = {
	WON: 1,
	LOST: 2,
	PLAYING: 3
};

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

var currentAngleY = 0;
var currentAngleX = 0;

// These Arrays hold all the shapes on the screen
var bacteria = [];

//this holds the center disk
var backgroundPlanets = [];

// this holds the explosion effect circles
var explosionEffect = [];

// this holds the indicator for remainder health
var healthCircles = [];

// this holds how many bacteria have passed the threshold
var numOfBacteriaPassedThreshold = 0;

// this saves the state of the game. playing, lost or won
// the game will keep continuing if the state is playing
var gameState = GAME_STATE.PLAYING;

// this is used when the game is lost, the earth explodes. This flag is used to make sure that only happens once.
var earthExploded = false;

// hard coded radius of the health indicators
var healthCircleRadius = 0.08;

// flag that saves that the center bacteria has to be deleted on the next time the view is drawn
var deleteCenterBacteriaOnNextDraw = false;
// this keeps track of if rotation has occured with the mouse. This is used to distingish mouse rotation and click
var rotationOccured = false;

// These are all of the settings. These change based on difficulty

// radius of the disk
var radiusOfCenterCircle;
// the thickness of the bacteria
var thicknessOfBacteria;
// maximum number of bacteria present on disk concurrently
var maximumBacteria;
// the growth rate of bacteria
var bacteriaGrowthRate;
// the chance of getting a new bacteria
var chanceOfNewBacteria;
// number of bacteria already present when starting the game
var bacteriaCountAtStart;
// if any bacteria reaches this angle, the game wins a point or one health is lost
var thresholdAngle;
// initial health count or the number of bacteria passing the threshold that would cause losing the game
var maxNumOfBacteriaPassedThreshold;

var easySettings = function () {
	radiusOfCenterCircle = 0.5;
	thicknessOfBacteria = 0.01;
	maximumBacteria = 7;
	bacteriaGrowthRate = 0.03;
	chanceOfNewBacteria = 0.005;
	bacteriaCountAtStart = 3;
	thresholdAngle = 62;
	maxNumOfBacteriaPassedThreshold = 6;
}

var normalSettings = function () {
	radiusOfCenterCircle = 0.5;
	thicknessOfBacteria = 0.01;
	maximumBacteria = 8;
	bacteriaGrowthRate = 0.04;
	chanceOfNewBacteria = 0.006;
	bacteriaCountAtStart = 3;
	thresholdAngle = 58;
	maxNumOfBacteriaPassedThreshold = 5;
}

var hardSettings = function () {
	radiusOfCenterCircle = 0.5;
	thicknessOfBacteria = 0.01;
	maximumBacteria = 9;
	bacteriaGrowthRate = 0.05;
	chanceOfNewBacteria = 0.007
	bacteriaCountAtStart = 3;
	thresholdAngle = 54;
	maxNumOfBacteriaPassedThreshold = 4;
}

var veryHardSettings = function () {
	radiusOfCenterCircle = 0.5;
	thicknessOfBacteria = 0.01;
	maximumBacteria = 10;
	bacteriaGrowthRate = 0.06;
	chanceOfNewBacteria = 0.01;
	bacteriaCountAtStart = 4;
	thresholdAngle = 50;
	maxNumOfBacteriaPassedThreshold = 3;
}

// this sets up the settings based on what the user selected
switch (localStorage.DifficultyLevel) {
	case "0": // 0 is easy
		easySettings();
		break;
	case "2": // 2 is hard
		hardSettings();
		break;
	case "3": // 3 is very hard
		veryHardSettings();
		break;
	case "1": // 1 is normal
	default: // Normal is the default case. So if the user hasnt selected the dificulty and it is undefined, it will go to the default case
		normalSettings();
		break;
}

// this is the method definition of the click listener. There is code later to add the listener. Currently, this is just a function.
var clickListener = function (event) {
	// if the game is not playing, then dont listen to any clicks
	if (gameState != GAME_STATE.PLAYING || rotationOccured) {
		rotationOccured = false;
		return;
	}

	deleteCenterBacteriaOnNextDraw = true;
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

		if (Math.abs(deltaX) + Math.abs(deltaY) > 0.001) {
			rotationOccured = true;
		}

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

function keyDownListener(e) {
	e = e || window.event;

	if (e.keyCode == '38' || e.keyCode == '87') {
		// up arrow
		yplus = true;
	} else if (e.keyCode == '40' || e.keyCode == '83') {
		// down arrow
		yminus = true;
	} else if (e.keyCode == '37' || e.keyCode == '65') {
		// left arrow
		xminus = true;
	} else if (e.keyCode == '39' || e.keyCode == '68') {
		// right arrow
		xplus = true;
	} else if (e.keyCode == '32') { // space bar to delete bacteria
		if (gameState == GAME_STATE.PLAYING) {
			deleteCenterBacteriaOnNextDraw = true;
		}
	}
}

function keyUpListener(e) {
	e = e || window.event;

	if (e.keyCode == '38' || e.keyCode == '87') {
		// up arrow
		yplus = false;
	} else if (e.keyCode == '40' || e.keyCode == '83') {
		// down arrow
		yminus = false;
	} else if (e.keyCode == '37' || e.keyCode == '65') {
		// left arrow
		xminus = false;
	} else if (e.keyCode == '39' || e.keyCode == '68') {
		// right arrow
		xplus = false;
	}
}

var initializeGame = function () {
	console.log("Game initialize started");

	canvas = document.getElementById('game-surface');
	gl = canvas.getContext('webgl');
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;

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

	// create the center disk
	var centerCircle = new Circle();
	centerCircle.samples = 200;
	centerCircle.radius = radiusOfCenterCircle;
	backgroundPlanets.push(centerCircle);

	// create all of the health circles
	for (var i = 0; i < maxNumOfBacteriaPassedThreshold; i++) {
		var health = new Circle();
		health.samples = 2 + i;
		health.originY = 10 - healthCircleRadius * 2;
		health.originX = healthCircleRadius * 30 * (i + 0.5 - maxNumOfBacteriaPassedThreshold / 2);
		health.radius = healthCircleRadius;
		healthCircles.push(health);
	}

	// create the bacteria
	for (var i = 0; i < bacteriaCountAtStart; i++) {
		createNewBacteria();
	}

	drawScene();

	canvas.addEventListener('click', clickListener);
	canvas.addEventListener('mouseup', handleMouseUp);
	canvas.addEventListener('mousedown', handleMouseDown);
	canvas.addEventListener('mousemove', handleMouseMove);
	canvas.addEventListener('mouseout', mouseLeftCanvas);
	document.onkeydown = keyDownListener;
	document.onkeyup = keyUpListener;

	var music = new Audio('../audio/game_music.wav');
	music.loop = true;
	music.play();
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
	shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
	shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
	shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
}

// helper method to create a new bacteria, this has the correct size for bacteria
var newBacteria = function () {
	var bacterium = new Circle();
	bacterium.wave = 1;
	bacterium.radius = radiusOfCenterCircle + thicknessOfBacteria;
	bacterium.angle = 10;
	return bacterium;
}

// a getter method since other classes cant access the property directly
var getGLContext = function () {
	return gl;
}

// this will resize the canvas, there should be no effect from calling this method is the size hasn't changed.
var resizeCanvas = function () {
	var height = window.innerHeight - 85;
	var width = window.innerWidth;

	var canvas2 = gl.canvas;
	if (width > height) {
		canvas.width = height;
		canvas.height = height;

		canvas2.width = height;
		canvas2.height = height;
	} else {
		canvas.width = width;
		canvas.height = width;

		canvas2.width = width;
		canvas2.height = width;
	}
	gl.viewport(0, 0, canvas.width, canvas.height);
	mat4.perspective(45, canvas.width / canvas.height, 0.1, 10000.0, pMatrix);
};

// This will update the data that is available and push the changes into the buffer
var calculateAllPoints = function () {
	triangleVertices = [];

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

	mat4.identity(newRotationMatrix);
	mat4.rotate(newRotationMatrix, degToRad(deltaX * 100), [0, 1, 0]);
	mat4.rotate(newRotationMatrix, -degToRad(deltaY * 100), [1, 0, 0]);
	mat4.multiply(newRotationMatrix, moonRotationMatrix, moonRotationMatrix);
	currentAngleX += deltaX * 100;
	currentAngleY += deltaY * 100;
	currentAngleX = currentAngleX % 180;
	currentAngleY = currentAngleY % 360;
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0, 0, -2.47]);
	mat4.multiply(mvMatrix, moonRotationMatrix);

	var deleteCycle = deleteCenterBacteriaOnNextDraw;

	for (var i in bacteria) {
		if (bacteria[i].doNotDraw) {
			bacteria.splice(i, 1);
		}
	}

	// if the game is playing then dray the bacteria, disk and health
	if (gameState == GAME_STATE.PLAYING) {
		for (var i in bacteria) {
			mvPushMatrix();
			var newRotationMatrix = mat4.create();
			mat4.identity(newRotationMatrix);
			mat4.rotate(newRotationMatrix, degToRad(bacteria[i].centerAngleX), [0, 1, 0]);
			mat4.rotate(newRotationMatrix, degToRad(bacteria[i].centerAngleY), [1, 0, 0]);
			mat4.multiply(mvMatrix, newRotationMatrix);
			bacteria[i].generatePointsCheckIfCenter(pMatrix, mvMatrix);

			if (deleteCycle) {
				if (bacteria[i].isInCenter) {
					bacteria[i].poisoned = true;

					var explosion = new Explosion();
					explosion.originX = bacteria[i].originXBacteria;
					explosion.originY = bacteria[i].originYBacteria;
					explosion.originZ = bacteria[i].originZBacteria;
					explosionEffect.push(explosion);
				}
			}

			setMatrixUniforms();
			drawShape(bacteria[i]);
			mvPopMatrix();
		}
		if (deleteCycle) {
			deleteCenterBacteriaOnNextDraw = false;
		}
		for (var i in backgroundPlanets) {
			backgroundPlanets[i].generatePoints();
		}
		for (var i = 0; i < maxNumOfBacteriaPassedThreshold - numOfBacteriaPassedThreshold; i++) {
			healthCircles[i].generatePoints();
		}
	}
	for (var i in explosionEffect) {
		explosionEffect[i].generatePoints();
	}
};

// This will clear the canvas and redraw the data that is available
var drawCanvas = function () {
	//	setMatrixUniforms();
	//	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	updateLighting();

	mat4.identity(mvMatrix);

	mat4.translate(mvMatrix, [0, 0, -2.47]);

	mat4.multiply(mvMatrix, moonRotationMatrix);

	// create an index to keep track of how many verticies are already drawn
	var index = 0;
	if (gameState == GAME_STATE.PLAYING) {
		for (var i in bacteria) {
			mvPushMatrix();
			var newRotationMatrix = mat4.create();
			mat4.identity(newRotationMatrix);
			mat4.rotate(newRotationMatrix, degToRad(bacteria[i].centerAngleX), [0, 1, 0]);
			mat4.rotate(newRotationMatrix, degToRad(bacteria[i].centerAngleY), [1, 0, 0]);

			mat4.multiply(mvMatrix, newRotationMatrix);

			setMatrixUniforms();
			drawShape(bacteria[i]);
			mvPopMatrix();
		}
		for (var i in backgroundPlanets) {
			drawShape(backgroundPlanets[i]);
		}
		for (var i = 0; i < maxNumOfBacteriaPassedThreshold - numOfBacteriaPassedThreshold; i++) {

			var lightingDirection = [parseFloat(lightingPostionX), parseFloat(lightingPostionY / 5), parseFloat(-0.4)];

			var adjustedLD = vec3.create();
			vec3.normalize(lightingDirection, adjustedLD);
			vec3.scale(adjustedLD, -0.8);
			gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

			gl.uniform3f(
				shaderProgram.directionalColorUniform,
				parseFloat(0.6),
				parseFloat(0.6),
				parseFloat(0.6)
			);

			mvPushMatrix();
			mat4.identity(mvMatrix);
			mat4.translate(mvMatrix, [0, 0, -2.30]);
			mat4.multiply(mvMatrix, mat4.identity(mat4.create()));
			setMatrixUniforms();
			drawShape(healthCircles[i]);
			mvPopMatrix();
		}
	}

	mvPushMatrix();
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0, 0, -1.0]);
	mat4.multiply(mvMatrix, mat4.identity(mat4.create()));

	for (var i in explosionEffect) { // explision effect is an edge case cause its composed of 8 circles
		for (var j in explosionEffect[i].circles) { // increase size of poison
			drawShape(explosionEffect[i].circles[j])
		}
	}

	setMatrixUniforms();
	mvPopMatrix();
};

var updateLighting = function () {
	if (localStorage.Lighting == undefined || localStorage.Lighting == "false") {
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
		parseFloat(0.6),
		parseFloat(0.6),
		parseFloat(0.6)
	);
}

function drawShape(shape) {
	gl.uniform3f(
		shaderProgram.customColour,
		shape.rgb[0],
		shape.rgb[1],
		shape.rgb[2]
	);
	gl.bindBuffer(gl.ARRAY_BUFFER, shape.moonVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, shape.moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, shape.moonVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, shape.moonVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.moonVertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, shape.moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
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

/* This is used to draw all the data that is available. Outside of this method, only modification of data is required. Webgl starts here. */
function drawScene() {
	calculateAllPoints();
	resizeCanvas();
	drawCanvas();
}

/* This is used to keep track of time. The bacteria growth will be controlled. Tick like a clock. */
function tick() {
	if (gameState == GAME_STATE.PLAYING) { // if the game is playing, then check if the player has won or lost
		if (bacteria.length == 0) { // if there are no bacteria left, then the player has won
			gameState = GAME_STATE.WON;
		} else {
			var fullCircleBacteria = false; // this flag is used to save if tehre is any bacteria which is a ful circle
			for (var i in bacteria) { // go through all bacteria
				if (bacteria[i].angle > thresholdAngle && !bacteria[i].passedThreshold) { // if any bacteria has passed the threshold
					numOfBacteriaPassedThreshold++; // increase the count of bacteria passing the threshold
					bacteria[i].passedThreshold = true; // set a flag so the same bacteria is not counted twice.
				}
				if (bacteria[i].angle >= 360) { // if a bacteria is already a full circle, then the game is lost
					fullCircleBacteria = true;
				}
			}
			// if the maximum bacteria threshold is passed or if there is a full size bacteria, the game is lost
			if (numOfBacteriaPassedThreshold >= maxNumOfBacteriaPassedThreshold || fullCircleBacteria) {
				gameState = GAME_STATE.LOST;
			}
		}
	}


	if (gameState == GAME_STATE.PLAYING) { // if the game is playing
		// find all the bacteria in shapes and make them grow
		for (var i in bacteria) { // increase size of bacteria
			bacteria[i].angle += bacteriaGrowthRate;
		}
		// if the maximum bacteria is not passed, then check if a new bacteria should be added
		if (bacteria.length < maximumBacteria && Math.random() < chanceOfNewBacteria) {
			createNewBacteria();
		}

		// check if any bacteria should be merged
		mergeOverlappingBacteria();
	} else if (gameState == GAME_STATE.WON) {
		if (Math.random() < 0.1) { // randombly create explosions
			document.getElementById('UserMessage').innerHTML = 'You Won The Game!';
			var explosion = new Explosion();
			explosion.originX = 100 * Math.random() - 50;
			explosion.originY = 100 * Math.random() - 50;
			explosion.originZ = 100 * Math.random() - 50;
			explosionEffect.push(explosion);
		}
	} else if (gameState == GAME_STATE.LOST) {
		setLargerExplosionSize(); // increase the size of the explosions

		if (!earthExploded) { // only explode the earth once
			document.getElementById('UserMessage').innerHTML = 'You Have Lost!';
			earthExploded = true;
			numOfBacteriaPassedThreshold = maxNumOfBacteriaPassedThreshold;
			var explosion = new Explosion();
			explosion.originX = 0;
			explosion.originY = 0;
			explosionEffect.push(explosion);
		}
	}

	// the bacteria has already grown above, now draw it on the screen
	calculateAllPoints();
	drawScene();

	// ask weggl to call tick again
	requestAnimFrame(tick);
}

var createNewBacteria = function () {
	var yDegrees;
	var xDegrees;

	// randomly search for a bacteria
	do {
		// find a random angle
		yDegrees = Math.random() * 360;
		xDegrees = Math.random() * 360;
	} while (bacteriaExistsAtAngle(xDegrees, yDegrees) != -1) // only break out of loop if a bacteria exists at location

	var bacterium = newBacteria();
	//	bacterium.originX = 10;
	bacterium.centerAngleX = xDegrees;
	bacterium.centerAngleY = yDegrees;
	bacteria.push(bacterium);
}

function angleForDistance(distance) {
	var angle = 0;
	if (distance < 0.177) {
		angle = 10 * distance / 0.177;
	} else if (distance < 0.312) {
		angle = 20 * distance / 0.312;
	} else if (distance < 0.595) {
		angle = 30 * distance / 0.595;
	} else if (distance < 0.855) {
		angle = 40 * distance / 0.855;
	} else if (distance < 1.153) {
		angle = 50 * distance / 1.153;
	} else if (distance < 1.149) {
		angle = 60 * distance / 1.149;
	} else if (distance < 1.845) {
		angle = 70 * distance / 1.845;
	} else if (distance < 2.223) {
		angle = 80 * distance / 2.223;
	} else if (distance < 2.613) {
		angle = 90 * distance / 2.613;
	} else if (distance < 3) {
		angle = 100 * distance / 3;
	} else if (distance < 3.37) {
		angle = 110 * distance / 3.37;
	} else if (distance < 3.72) {
		angle = 120 * distance / 3.72;
	} else if (distance < 4.04) {
		angle = 130 * distance / 4.04;
	} else if (distance < 4.31) {
		angle = 140 * distance / 4.31;
	} else if (distance < 4.53) {
		angle = 150 * distance / 4.53;
	} else if (distance < 4.7) {
		angle = 160 * distance / 4.7;
	} else if (distance < 4.795) {
		angle = 170 * distance / 4.795;
	} else if (distance < 4.82) {
		angle = 180 * distance / 4.82;
	}
	return angle;
}

var bacteriaExistsAtAngle = function (posX, posY) {
	for (var i in bacteria) {
		var x1 = posX % 360;
		var x2 = bacteria[i].centerAngleX % 360;
		var y1 = posY % 360;
		var y2 = bacteria[i].centerAngleY % 360;

		var dx1 = Math.abs(x1 - x2);
		var dx2;
		if (x1 > x2) {
			dx2 = 360 - x1 + x2;
		} else {
			dx2 = 360 - x2 + x1;
		}

		var dy1 = Math.abs(y1 - y2);
		var dy2;
		if (y1 > y2) {
			dy2 = 360 - y1 + y2;
		} else {
			dy2 = 360 - y2 + y1;
		}

		var dy, dx;

		if (dx1 > dx2) {
			dx = dx2;
		} else {
			dx = dx1;
		}

		if (dy1 > dy2) {

			dy = dy2;
		} else {
			dy = dy1;

		}

		var a1 = dy * dy + dx * dx;

		if (Math.sqrt(a1) < (bacteria[i].angle) / 2) {
			return i;
		}
	}
	return -1;
}

var mergeOverlappingBacteria = function () {
	var arrayLength = bacteria.length;
	for (var i = 0; i < arrayLength; i++) {
		for (var j = i + 1; j < arrayLength; j++) {
			var d = getDistance(bacteria[i].originXBacteria, bacteria[i].originYBacteria, bacteria[i].originZBacteria, bacteria[j].originXBacteria, bacteria[j].originYBacteria, bacteria[j].originZBacteria);
			console.log(d);

			if (angleForDistance(d) - bacteria[i].angle / 2 - bacteria[j].angle / 2 < 10) {
				if (bacteria[i].angle > bacteria[j].angle) {
					bacteria[i].angle = bacteria[i].angle + Math.sqrt(bacteria[j].angle);
					bacteria[j].doNotDraw = true;
					bacteria[i].passedThreshold = false;
				} else {
					bacteria[j].angle = bacteria[j].angle + Math.sqrt(bacteria[i].angle);
					bacteria[i].doNotDraw = true;
					bacteria[j].passedThreshold = false;
				}
			}
		}
	}
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

function getDistance(x1, y1, z1, x2, y2, z2) {
	return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2));
}
