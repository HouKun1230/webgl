var vertexShaderText = [
'precision mediump float;',
'',
'attribute vec2 vertPosition;',
'attribute vec4 customColour;',
'varying vec4 customFragColour;',
'',
'void main()',
'{',
'  customFragColour = customColour;',
'  gl_Position = vec4(vertPosition, 0.0, 1.0);',
'}'
].join('\n');

var fragmentShaderText = [
'precision mediump float;',
'',
'varying vec4 customFragColour;',
'void main()',
'{',
'  gl_FragColor = vec4(customFragColour);',
'}'
].join('\n');

var GAME_STATE = {
    WON: 1,
    LOST: 2,
    PLAYING: 3
};

// This is a flag for the main run loop. It makes sure iniitialize game is only called once, all other times would only be a render.
// Only run application is called to get everything going.
var firstTime = true;

var createPoisonRandomly = false;

// webgl stuff
var canvas;
var gl;
var program;
var vertexBuffer;
var fragmentBuffer;

// These Arrays hold all the shapes on the screen
var bacteria = [];
var poisons = [];

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

// These are all of the settings. These change based on difficulty

// radius of the disk
var radiusOfCenterCircle;
// radius of the bacteria
var radiusOfBacteria;
// the thickness of the bacteria
var thicknessOfBacteria;
// radius of the poison
var radiusOfPoison;
// thickness of the poison
var thicknessOfPoison;
// maximum number of bacteria present on disk concurrently
var maximumBacteria;
// the growth rate of bacteria
var bacteriaGrowthRate;
// growth rate of poison
var poisonGrowthRate;
// the chance of getting a new bacteria
var chanceOfNewBacteria;
//  the change of getting a new poison
var chanceOfNewPoison;
// number of bacteria already present when starting the game
var bacteriaCountAtStart;
// if any bacteria reaches this angle, the game wins a point or one health is lost
var thresholdAngle;
// initial health count or the number of bacteria passing the threshold that would cause losing the game
var maxNumOfBacteriaPassedThreshold;

var easySettings = function () {
    radiusOfCenterCircle = 0.5;
    radiusOfBacteria = radiusOfCenterCircle;
    thicknessOfBacteria = 0.041;
    radiusOfPoison = radiusOfCenterCircle;
    thicknessOfPoison = 0.01;

    maximumBacteria = 7;
    bacteriaGrowthRate = 0.07;
    poisonGrowthRate = bacteriaGrowthRate / 2;


    chanceOfNewBacteria = 0.012;
    chanceOfNewPoison = chanceOfNewBacteria / 2;

    bacteriaCountAtStart = 4;

    thresholdAngle = 38;
    maxNumOfBacteriaPassedThreshold = 6;
}

var normalSettings = function () {
    radiusOfCenterCircle = 0.5;
    radiusOfBacteria = radiusOfCenterCircle;
    thicknessOfBacteria = 0.039;
    radiusOfPoison = radiusOfCenterCircle;
    thicknessOfPoison = 0.01;

    maximumBacteria = 8;
    bacteriaGrowthRate = 0.08;
    poisonGrowthRate = bacteriaGrowthRate / 2;

    chanceOfNewBacteria = 0.014;
    chanceOfNewPoison = chanceOfNewBacteria / 2;

    bacteriaCountAtStart = 4;

    thresholdAngle = 37;
    maxNumOfBacteriaPassedThreshold = 5;
}

var hardSettings = function () {
    radiusOfCenterCircle = 0.5;
    radiusOfBacteria = radiusOfCenterCircle;
    thicknessOfBacteria = 0.037;
    radiusOfPoison = radiusOfCenterCircle;
    thicknessOfPoison = 0.01;

    maximumBacteria = 9;
    bacteriaGrowthRate = 0.09;
    poisonGrowthRate = bacteriaGrowthRate / 2;

    chanceOfNewBacteria = 0.016;
    chanceOfNewPoison = chanceOfNewBacteria / 2;

    bacteriaCountAtStart = 4;

    thresholdAngle = 36;
    maxNumOfBacteriaPassedThreshold = 4;
}

var veryHardSettings = function () {
    radiusOfCenterCircle = 0.5;
    radiusOfBacteria = radiusOfCenterCircle;
    thicknessOfBacteria = 0.03;
    radiusOfPoison = radiusOfCenterCircle;
    thicknessOfPoison = 0.01;

    maximumBacteria = 10;
    bacteriaGrowthRate = 0.1;
    poisonGrowthRate = bacteriaGrowthRate / 2;

    chanceOfNewBacteria = 0.018;
    chanceOfNewPoison = chanceOfNewBacteria / 2;

    bacteriaCountAtStart = 5;

    thresholdAngle = 35;
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
    if (gameState != GAME_STATE.PLAYING) {
        return;
    }

    // get the rectangle of the canvas
    var rect = canvas.getBoundingClientRect();

    // the x, y coordinates of the click are for inside the webpage and not the canvas.
    // the extra space above and on the left of the canvas must be removed
    var xWithinCanvas = (event.clientX - rect.left);
    var yWithinCanvas = (event.clientY - rect.top);

    // now the x coordinates have to be converted to a scale of -1 to 1
    // Click coordinates:   0   ----    Canvas Width
    // 1. Have to divide by the canvas width to change the scale from 0 to 1
    //
    // Click coordinates:   0   ----    1
    // 2. have to multiply by 2 since the range of x is 2 (from -1 to 1)
    // 
    // Click coordinates:   0   ----    2
    // 2. have to subtract 1 since the range is from -1 to 1
    // 
    // Click coordinates:   -1   ----    1
    mouse_X = (2 * xWithinCanvas) / canvas.width - 1;

    // now the y coordinates have to be converted to a scale of 1 to -1
    // Click coordinates:   0   ----    Canvas Height
    // 1. have to multiply by -1 since teh scale goes from positive to negative
    //
    // Click coordinates:   0   ----    -Canvas Height
    // 2. Have to add Canvas Height to make the scale start with 1 and not -1
    //
    // Click coordinates:   Canvas Height   ----    0
    // 3. Have to divide by the Canvas Height to change the scale from 1 to 0
    //
    // Click coordinates:   1   ----    0
    // 4. have to multiply by 2 since the range of y is 2 (from 1 to -1)
    // 
    // Click coordinates:   2   ----    0
    // 5. have to subtract 1 since the range is from 1 to -1
    //
    // Click coordinates:   1   ----    -1
    mouse_Y = (2 * (canvas.height + (-1 * yWithinCanvas))) / canvas.height - 1;

    // use trignomatry math to find the radius and angle of click.
    radius = Math.sqrt(mouse_X * mouse_X + mouse_Y * mouse_Y);
    angle = Math.atan(mouse_X / mouse_Y);

    // check in which qaurdrant the click occured
    // find which quardrant the click occured to convert the angle from pi radians to degrees 
    if (mouse_Y >= 0) {
        angle = Math.abs(angle - Math.PI / 2) * 180 / Math.PI;
    } else {
        angle = Math.abs(angle - Math.PI / 2) * 180 / Math.PI + 180;
    }

    // check the click occured within the bacteria range. Only if it is not in the bacteria range, then check the angle.
    if (radius - radiusOfBacteria > 0 && radius - radiusOfBacteria < thicknessOfBacteria) {
        // go through each bacteria
        for (var i in bacteria) {
            // calcualte the start and end of the bacteria
            var minAngle = bacteria[i].centerAngle - bacteria[i].angle / 2;
            var maxAngle = bacteria[i].centerAngle + bacteria[i].angle / 2;
            // make sure the angle is within 360 degrees
            // only have to check the low range of min and high range of max since min is subtracted and max is added.
            if (minAngle < 0) {
                minAngle += 360;
            }
            if (maxAngle > 360) {
                maxAngle -= 360;
            }

            // this flag is used to mark the current bacteria as deleted
            var deleteBacteria = false;

            // there are two conditions. 
            // if the bacteria the bacteria origin is 0 and the end end is 10 and teh start angle is 350. Angle 0 would be within the bacteria.
            if (maxAngle < minAngle) { // 350 is bigger than 10
                if (angle > minAngle) { // 0 is not bigger than 350
                    deleteBacteria = true;
                } else if (angle > 0 && angle < maxAngle) { // 0 is smaller than 10
                    deleteBacteria = true;
                }
            } else { // this is the normal case. EG. bacteria with origin 40 and the start is 30 and end is 50. The click has to be within this range.
                if (angle > minAngle && angle < maxAngle) {
                    deleteBacteria = true;
                }
            }

            if (deleteBacteria) { // if the above condition finds that the bacteria has to be deleted,
                bacteria.splice(i, 1); // splice removes the element at index i

                var explosion = new Explosion(); // create an explosion at the coordinates of the click
                explosion.originX = mouse_X;
                explosion.originY = mouse_Y;
                explosionEffect.push(explosion);

                var poison = newPoison();
                poison.centerAngle = angle;
                poisons.push(poison);

                if (bacteria.length == 0) { //  if there are no more bacteria, then remove all poison.
                    poisons = [];
                }

                return;
            }
        }
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

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }

    // create the center disk
    var centerCircle = new Circle();
    centerCircle.circleType = gl.TRIANGLE_FAN;
    centerCircle.samples = 200;
    centerCircle.radius = radiusOfCenterCircle;
    backgroundPlanets.push(centerCircle);

    // create all of the health circles
    for (var i = 0; i < maxNumOfBacteriaPassedThreshold; i++) {
        var health = new Circle();
        health.circleType = gl.TRIANGLE_FAN;
        health.samples = 3 + i;
        health.originY = 1 - healthCircleRadius * 2;
        health.originX = -1 + healthCircleRadius * 3 * (i + 1);
        health.radius = healthCircleRadius;
        healthCircles.push(health);
    }

    gl.useProgram(program);

    // create the bacteria
    for (var i = 0; i < bacteriaCountAtStart; i++) {
        createNewBacteria();
    }

    drawScene();

    canvas.addEventListener('click', clickListener);

    var music = new Audio('../audio/game_music.wav');
    music.loop = true;
    music.play();
};

// helper method to create a new bacteria, this has the correct size for bacteria
var newBacteria = function () {
    var bacterium = new Circle();
    bacterium.circleType = gl.TRIANGLE_STRIP;
    bacterium.radius = radiusOfBacteria;
    bacterium.lineThickness = thicknessOfBacteria;
    bacterium.angle = 0;
    bacterium.centerAngle = 0;
    bacterium.samples = 1440;
    return bacterium;
}

// helper method to create a new poison, this has the correct size for posion
var newPoison = function () {
    var poison = new Circle();
    poison.circleType = gl.TRIANGLE_STRIP;
    poison.radius = radiusOfPoison;
    poison.lineThickness = thicknessOfPoison;
    poison.angle = 0;
    poison.samples = 360;
    return poison;
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
};

// This will update the data that is available and push the changes into the buffer
var calculateAllPoints = function () {
    triangleVertices = [];

    /* The first step is get all of the vertices, or coordinates*/

    // if the game is playing then dray the bacteria, poison, disk and health
    if (gameState == GAME_STATE.PLAYING) {
        for (var i in bacteria) {
            //for each shape, calculate all the points again.
            // this will get rid of all the points incase anything changed
            bacteria[i].generatePoints();
            // concatenate the result into the triangleVertices
            // EG [a, b, c].concat([d, e]) = [a, b, c, d, e]
            // The triangleVertices has the same order as the bacteria array.
            triangleVertices = triangleVertices.concat(bacteria[i].points);
        }
        for (var i in poisons) {
            poisons[i].generatePoints();
            triangleVertices = triangleVertices.concat(poisons[i].points);
        }
        for (var i in backgroundPlanets) {
            backgroundPlanets[i].generatePoints();
            triangleVertices = triangleVertices.concat(backgroundPlanets[i].points);
        }
        for (var i = 0; i < maxNumOfBacteriaPassedThreshold - numOfBacteriaPassedThreshold; i++) {
            healthCircles[i].generatePoints();
            triangleVertices = triangleVertices.concat(healthCircles[i].points);
        }
    }
    for (var i in explosionEffect) {
        explosionEffect[i].generatePoints();
        triangleVertices = triangleVertices.concat(explosionEffect[i].points);
    }

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
    // create a buffer for the vertPosition
    var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    gl.vertexAttribPointer(
        positionAttribLocation, //Attribute location
        2, //Number of elements per attribute
        gl.FLOAT, //Type of elements
        gl.FALSE,
        2 * Float32Array.BYTES_PER_ELEMENT, //Size of an individual vertex
        0 //Offset from the beginning of a single vertex to this attribute
    );

    /* The second step is get all of the colour verticies */
    colorsVertices = [];
    // if the game is playing then dray the bacteria, poison, disk and health
    if (gameState == GAME_STATE.PLAYING) {
        for (var i in bacteria) {
            colorsVertices = colorsVertices.concat(bacteria[i].getColourArray());
        }
        for (var i in poisons) {
            colorsVertices = colorsVertices.concat(poisons[i].getColourArray());
        }
        for (var i in backgroundPlanets) {
            colorsVertices = colorsVertices.concat(backgroundPlanets[i].getColourArray());
        }
        for (var i in healthCircles) {
            colorsVertices = colorsVertices.concat(healthCircles[i].getColourArray());
        }
    }
    for (var i in explosionEffect) {
        colorsVertices = colorsVertices.concat(explosionEffect[i].getColourArray());
    }

    fragmentBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fragmentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsVertices), gl.DYNAMIC_DRAW);
    // create the buffer and link it to teh custom colour.
    // this is linked to vertexShader and customColour must be an attribute in the vertexShader
    // inside the vertex shader program customColour is passed into customFragColour varying property
    var colourArray = gl.getAttribLocation(program, 'customColour');
    gl.vertexAttribPointer(
        colourArray, //Attribute location
        4, //Number of elements per attribute
        gl.FLOAT, //Type of elements
        gl.FALSE,
        4 * Float32Array.BYTES_PER_ELEMENT, //Size of an individual vertex
        0 //Offset from the beginning of a single vertex to this attribute
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colourArray);
};

// This will clear the canvas and redraw the data that is available
var drawCanvas = function () {
    // all the data is already inside the buffers, we just have to draw the canvas now
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things
    gl.depthFunc(gl.LEQUAL);
    // Clear the color as well as the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // create an index to keep track of how many verticies are already drawn
    var index = 0;
    if (gameState == GAME_STATE.PLAYING) {
        for (var i in bacteria) {
            //        index is the start point in teh buffer array
            //        for the vertex shader to start drawing
            gl.drawArrays(bacteria[i].getMode(), index, bacteria[i].pointCount);
            index = index + bacteria[i].pointCount;
        }
        for (var i in poisons) {
            gl.drawArrays(poisons[i].getMode(), index, poisons[i].pointCount);
            index = index + poisons[i].pointCount;
        }
        for (var i in backgroundPlanets) {
            gl.drawArrays(backgroundPlanets[i].getMode(), index, backgroundPlanets[i].pointCount);
            index = index + backgroundPlanets[i].pointCount;
        }
        for (var i = 0; i < maxNumOfBacteriaPassedThreshold - numOfBacteriaPassedThreshold; i++) {
            gl.drawArrays(healthCircles[i].getMode(), index, healthCircles[i].pointCount);
            index = index + healthCircles[i].pointCount;
        }
    }
    for (var i in explosionEffect) { // explision effect is an edge case cause its composed of 8 circles
        for (var j = 0; j < 8; j++) {
            gl.drawArrays(explosionEffect[i].getMode(), index, explosionEffect[i].pointCount / 8);
            index = index + explosionEffect[i].pointCount / 8;
        }
    }
};

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

        for (var i in poisons) { // increase size of poison
            poisons[i].angle += poisonGrowthRate;
        }

        // if the maximum bacteria is not passed, then check if a new bacteria should be added
        if (bacteria.length < maximumBacteria && Math.random() < chanceOfNewBacteria) {
            createNewBacteria();
        }

        if (createPoisonRandomly) {
            // if there is a bacteria, then check if a new poison should be added
            if (bacteria.length != 0 && Math.random() < chanceOfNewPoison) {
                createNewPoison();
            }
        }

        // check if any bacteria should be merged
        mergeOverlappingBacteria();
    } else if (gameState == GAME_STATE.WON) {
        if (Math.random() < 0.2) { // randombly create explosions
            document.getElementById('UserMessage').innerHTML = 'You Won The Game!';
            var explosion = new Explosion();
            explosion.originX = 2 * Math.random() - 1;
            explosion.originY = 2 * Math.random() - 1;
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
    drawScene();

    // ask weggl to call tick again
    requestAnimFrame(tick);
}

var createNewBacteria = function () {
    var centerAngle = Math.random() * 360;
    var bacteriaExistsAtLocation = bacteriaExistsAtAngle(centerAngle);

    // add the new bacteria if the bacteria doesnt already exist at a location
    if (!bacteriaExistsAtLocation) {
        var bacterium = newBacteria();
        bacterium.centerAngle = centerAngle;
        bacteria.push(bacterium);
    }
}

var createNewPoison = function () {
    var centerAngle;

    // randomly search for a bacteria
    do {
        // find a random angle
        var centerAngle = Math.random() * 360;
    } while (!bacteriaExistsAtAngle(centerAngle)) // only break out of loop if a bacteria exists at location

    var poison = newPoison();
    poison.centerAngle = centerAngle;
    poisons.push(poison);
}

var bacteriaExistsAtAngle = function (centerAngle) { // this is the same logic as the click
    var bacteriaExistsAtLocation = false;
    for (var i in bacteria) {
        var minAngle = bacteria[i].centerAngle - bacteria[i].angle / 2;
        var maxAngle = bacteria[i].centerAngle + bacteria[i].angle / 2;
        if (minAngle < 0) {
            minAngle += 360;
        }
        if (maxAngle > 360) {
            maxAngle -= 360;
        }


        if (maxAngle < minAngle) {
            if (centerAngle > minAngle) {
                bacteriaExistsAtLocation = true;
            } else if (centerAngle > 0 && centerAngle < maxAngle) {
                bacteriaExistsAtLocation = true;
            }
        } else {
            if (centerAngle > minAngle && centerAngle < maxAngle) {
                bacteriaExistsAtLocation = true;
            }
        }
    }
    return bacteriaExistsAtLocation;
}

var mergeOverlappingBacteria = function () {

    // this is a nested for look. For each bacteria, check if it overlaps with any other bacteria
    for (var i in bacteria) {
        // get the start and end of the current bacteria
        var minAngleInnerLoop = bacteria[i].centerAngle - bacteria[i].angle / 2;
        var maxAngleInnerLoop = bacteria[i].centerAngle + bacteria[i].angle / 2;

        if (minAngleInnerLoop < 0) {
            minAngleInnerLoop += 360;
        }
        if (maxAngleInnerLoop > 360) {
            maxAngleInnerLoop -= 360;
        }

        // check if teh current bacteria overlaps with any other bacteria
        for (var j in bacteria) {
            // go through all other bacteria and get there min and max angle
            var minAngleOuterLoop = bacteria[j].centerAngle - bacteria[j].angle / 2;
            var maxAngleOuterLoop = bacteria[j].centerAngle + bacteria[j].angle / 2;

            if (minAngleOuterLoop < 0) {
                minAngleOuterLoop += 360;
            }
            if (maxAngleOuterLoop > 360) {
                maxAngleOuterLoop -= 360;
            }

            // if the min angle or max angle is equal, then its the same bacteria. Should skip this case.
            if (minAngleInnerLoop == minAngleOuterLoop) {
                continue;
            }

            // to overlay, one of teh opposite edes have to connect. So min angle of the current bactera and max angle of other bacteria or max angle of current bacteria and min angle of the other bacteria.

            // there are four cases for the merge.
            // the current bacteria is on the left or right
            // the current bacteria is bigger or other bacteria is bigger

            // the main differences between the conditions is
            // 1. which bacteria is deleted
            // 2. how the center of the bacteria is shifted. Should the center be increased or decreased

            if (Math.abs(minAngleInnerLoop - maxAngleOuterLoop) < bacteriaGrowthRate) {
                if (bacteria[i].angle > bacteria[j].angle) {
                    console.log("1");
                    bacteria[i].centerAngle = bacteria[i].centerAngle - bacteria[j].angle / 2;

                    if (bacteria[i].centerAngle < 0) {
                        bacteria[i].centerAngle += 360;
                    }
                    if (bacteria[i].centerAngle > 360) {
                        bacteria[i].centerAngle -= 360;
                    }

                    bacteria[i].angle = bacteria[i].angle + bacteria[j].angle;
                    bacteria[i].passedThreshold = false;
                    bacteria.splice(j, 1);
                } else {
                    console.log("2");
                    bacteria[j].centerAngle = bacteria[j].centerAngle + bacteria[i].angle / 2;

                    if (bacteria[j].centerAngle < 0) {
                        bacteria[j].centerAngle += 360;
                    }
                    if (bacteria[j].centerAngle > 360) {
                        bacteria[j].centerAngle -= 360;
                    }

                    bacteria[j].angle = bacteria[j].angle + bacteria[i].angle;
                    bacteria[j].passedThreshold = false;
                    bacteria.splice(i, 1);
                }
            } else if (Math.abs(maxAngleInnerLoop - minAngleOuterLoop) < bacteriaGrowthRate) {
                if (bacteria[i].angle > bacteria[j].angle) {

                    console.log("3");
                    bacteria[i].centerAngle = bacteria[i].centerAngle + bacteria[j].angle / 2;

                    if (bacteria[i].centerAngle < 0) {
                        bacteria[i].centerAngle += 360;
                    }
                    if (bacteria[i].centerAngle > 360) {
                        bacteria[i].centerAngle -= 360;
                    }

                    bacteria[i].angle = bacteria[i].angle + bacteria[j].angle;
                    bacteria[i].passedThreshold = false;
                    bacteria.splice(j, 1);
                } else {
                    console.log("4");
                    bacteria[j].centerAngle = bacteria[j].centerAngle - bacteria[i].angle / 2;

                    if (bacteria[j].centerAngle < 0) {
                        bacteria[j].centerAngle += 360;
                    }
                    if (bacteria[j].centerAngle > 360) {
                        bacteria[j].centerAngle -= 360;
                    }

                    bacteria[j].angle = bacteria[j].angle + bacteria[i].angle;
                    bacteria[j].passedThreshold = false;
                    bacteria.splice(i, 1);
                }
            }
        }
    }
}
