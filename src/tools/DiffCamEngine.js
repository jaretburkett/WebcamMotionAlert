var stream;					// stream obtained from webcam
var coords;					// stream obtained from webcam
var video;					// shows stream
var captureCanvas;			// internal canvas for capturing full images from video
var captureContext;			// context for capture canvas
var diffCanvas;				// internal canvas for diffing downscaled captures
var diffContext;			// context for diff canvas
var motionCanvas;			// receives processed diff images
var motionContext;			// context for motion canvas

var initSuccessCallback;	// called when init succeeds
var initErrorCallback;		// called when init fails
var startCompleteCallback;	// called when start is complete
var captureCallback;		// called when an image has been captured and diffed

var captureInterval;		// interval for continuous captures
var captureIntervalTime;	// time between captures, in ms
var captureWidth;			// full captured image width
var captureHeight;			// full captured image height
var diffWidth;				// downscaled width for diff/motion
var diffHeight;				// downscaled height for diff/motion
var isReadyToDiff;			// has a previous capture been made to diff against?
var pixelDiffThreshold;		// min for a pixel to be considered significant
var scoreThreshold;			// min for an image to be considered significant
var includeMotionBox;		// flag to calculate and draw motion bounding box
var includeMotionPixels;	// flag to create object denoting pixels with motion

// module.exports = function () {
export function init(options) {
    // sanity check
    if (!options) {
        throw 'No options object provided';
    }

    // incoming options with defaults
    video = options.video || document.createElement('video');
    motionCanvas = options.motionCanvas || document.createElement('canvas');
    captureIntervalTime = options.captureIntervalTime || 100;
    captureWidth = options.captureWidth || 640;
    captureHeight = options.captureHeight || 480;
    diffWidth = options.diffWidth || 64;
    diffHeight = options.diffHeight || 48;
    pixelDiffThreshold = options.pixelDiffThreshold || 32;
    scoreThreshold = options.scoreThreshold || 16;
    includeMotionBox = options.includeMotionBox || false;
    includeMotionPixels = options.includeMotionPixels || false;

    // callbacks
    initSuccessCallback = options.initSuccessCallback || function () {
        };
    initErrorCallback = options.initErrorCallback || function () {
        };
    startCompleteCallback = options.startCompleteCallback || function () {
        };
    captureCallback = options.captureCallback || function () {
        };

    // non-configurable
    captureCanvas = document.createElement('canvas');
    diffCanvas = document.createElement('canvas');
    isReadyToDiff = false;

    // prep video
    video.autoplay = true;

    // prep capture canvas
    captureCanvas.width = captureWidth;
    captureCanvas.height = captureHeight;
    captureContext = captureCanvas.getContext('2d');

    // prep diff canvas
    diffCanvas.width = diffWidth;
    diffCanvas.height = diffHeight;
    diffContext = diffCanvas.getContext('2d');

    // prep motion canvas
    motionCanvas.width = diffWidth;
    motionCanvas.height = diffHeight;
    motionContext = motionCanvas.getContext('2d');

    requestWebcam();
}

export function requestWebcam() {
    var constraints = {
        audio: false,
        video: {width: captureWidth, height: captureHeight}
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(initSuccess)
        .catch(initError);
}

export function initSuccess(requestedStream) {
    stream = requestedStream;
    initSuccessCallback();
}

export function initError(error) {
    console.log(error);
    initErrorCallback();
}

export function start() {
    if (!stream) {
        throw 'Cannot start after init fail';
    }

    // streaming takes a moment to start
    video.addEventListener('canplay', startComplete);
    video.srcObject = stream;
}

export function startComplete() {
    video.removeEventListener('canplay', startComplete);
    captureInterval = setInterval(capture, captureIntervalTime);
    startCompleteCallback();
}

export function stop() {
    clearInterval(captureInterval);
    video.src = '';
    motionContext.clearRect(0, 0, diffWidth, diffHeight);
    isReadyToDiff = false;
}

export function capture() {
    // save a full-sized copy of capture
    captureContext.drawImage(video, 0, 0, captureWidth, captureHeight);
    var captureImageData = captureContext.getImageData(0, 0, captureWidth, captureHeight);

    // diff current capture over previous capture, leftover from last time
    diffContext.globalCompositeOperation = 'difference';
    diffContext.drawImage(video, 0, 0, diffWidth, diffHeight);
    var diffImageData = diffContext.getImageData(0, 0, diffWidth, diffHeight);

    if (isReadyToDiff) {
        var diff = processDiff(diffImageData);

        motionContext.putImageData(diffImageData, 0, 0);
        if (diff.motionBox) {
            motionContext.strokeStyle = '#fff';
            motionContext.strokeRect(
                diff.motionBox.x.min + 0.5,
                diff.motionBox.y.min + 0.5,
                diff.motionBox.x.max - diff.motionBox.x.min,
                diff.motionBox.y.max - diff.motionBox.y.min
            );
        }
        captureCallback({
            imageData: captureImageData,
            score: diff.score,
            hasMotion: diff.score >= scoreThreshold,
            motionBox: diff.motionBox,
            motionPixels: diff.motionPixels,
            getURL: function () {
                return getCaptureUrl(this.imageData);
            },
            checkMotionPixel: function (x, y) {
                return checkMotionPixel(this.motionPixels, x, y)
            }
        });
    }

    // draw current capture normally over diff, ready for next time
    diffContext.globalCompositeOperation = 'source-over';
    diffContext.drawImage(video, 0, 0, diffWidth, diffHeight);
    isReadyToDiff = true;
}

function toColor(value) {
    //value from 0 to 100
    value = value / 2.55 * 0.01;
    var hue=((1-value)*120).toString(10);
    // return ["hsl(",hue,",100%,50%)"].join("");
    var h = hue;
    var s = 100;
    var l = 50;
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function processDiff(diffImageData) {
    var rgba = diffImageData.data;

    // pixel adjustments are done by reference directly on diffImageData
    var score = 0;
    var motionPixels = includeMotionPixels ? [] : undefined;
    var motionBox = undefined;
    for (var i = 0; i < rgba.length; i += 4) {
        var pixelDiff = rgba[i] * 0.3 + rgba[i + 1] * 0.6 + rgba[i + 2] * 0.1;
        var normalized = Math.min(255, pixelDiff * (255 / pixelDiffThreshold));
        // let rgbArr = toColor(normalized);
        rgba[i] = normalized;                // red
        rgba[i + 1] = normalized;            // green
        rgba[i + 2] = normalized;   // blue
        // rgba[i] = rgbArr[0];           // red
        // rgba[i + 1] = rgbArr[1];       // green
        // rgba[i + 2] = rgbArr[2];       // blue
        rgba[i + 3] = normalized /2.55;      // alpha

        if (pixelDiff >= pixelDiffThreshold) {
            score++;
            coords = calculateCoordinates(i / 4);

            if (includeMotionBox) {
                motionBox = calculateMotionBox(motionBox, coords.x, coords.y);
            }

            if (includeMotionPixels) {
                motionPixels = calculateMotionPixels(motionPixels, coords.x, coords.y, pixelDiff);
            }

        }
    }

    return {
        score: score,
        motionBox: score > scoreThreshold ? motionBox : undefined,
        motionPixels: motionPixels
    };
}

export function calculateCoordinates(pixelIndex) {
    return {
        x: pixelIndex % diffWidth,
        y: Math.floor(pixelIndex / diffWidth)
    };
}

export function calculateMotionBox(currentMotionBox, x, y) {
    // init motion box on demand
    var motionBox = currentMotionBox || {
            x: {min: coords.x, max: x},
            y: {min: coords.y, max: y}
        };

    motionBox.x.min = Math.min(motionBox.x.min, x);
    motionBox.x.max = Math.max(motionBox.x.max, x);
    motionBox.y.min = Math.min(motionBox.y.min, y);
    motionBox.y.max = Math.max(motionBox.y.max, y);

    return motionBox;
}

export function calculateMotionPixels(motionPixels, x, y, pixelDiff) {
    motionPixels[x] = motionPixels[x] || [];
    motionPixels[x][y] = true;

    return motionPixels;
}

export function getCaptureUrl(captureImageData) {
    // may as well borrow captureCanvas
    captureContext.putImageData(captureImageData, 0, 0);
    return captureCanvas.toDataURL();
}

export function checkMotionPixel(motionPixels, x, y) {
    return motionPixels && motionPixels[x] && motionPixels[x][y];
}

export function getPixelDiffThreshold() {
    return pixelDiffThreshold;
}

export function setPixelDiffThreshold(val) {
    pixelDiffThreshold = val;
}

export function getScoreThreshold() {
    return scoreThreshold;
}

export function setScoreThreshold(val) {
    scoreThreshold = val;
}
//
// return {
//     // public getters/setters
//     getPixelDiffThreshold: getPixelDiffThreshold,
//     setPixelDiffThreshold: setPixelDiffThreshold,
//     getScoreThreshold: getScoreThreshold,
//     setScoreThreshold: setScoreThreshold,
//
//     // public functions
//     init: init,
//     start: start,
//     stop: stop
// };
// }