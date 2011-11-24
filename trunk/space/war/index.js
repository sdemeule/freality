var time = new Date().getTime();

var test_hook = null;

window.onload = function() {
  if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    return;
  }
  if (test_hook == null) {
    // TODO(pablo): current sets a global since not sure how to wire
    // into angular.
    scene = initCanvas(document.getElementById('scene'), 0);
  } else {
    test_hook();
  }
}

function initCanvas(container, bgColor) {
  if (bgColor == null) {
    bgColor = 0xffffff;
  }
  var width = container.clientWidth;
  var height = container.clientHeight;
  if (width == 0 || height == 0) {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  renderer = new THREE.WebGLRenderer({ clearAlpha: 1, clearColor: bgColor });
  renderer.setSize(width, height);
  renderer.sortObjects = true;
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);
  var scene = new THREE.Scene(); // in shared.js
  var cameraAndControls = init(renderer, scene); // in scene.js
  animate(renderer, cameraAndControls[0], cameraAndControls[1], scene);
  return scene;
}

function init(renderer, scene) {
  // TODO(pablo): pass these as method args
  var near = 0.001;
  var far = 1e7 * 1000;
  var width = renderer.domElement.clientWidth;
  var height = renderer.domElement.clientHeight;
  // TODO(pablo): should not be global.
  camera = new THREE.PerspectiveCamera(0.1, width / height, near, far);
  camera.rotationAutoUpdate = true;

  var controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.2;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = false;
  controls.dynamicDampingFactor = 0.3;
  controls.minDistance = near;
  //controls.maxDistance = far;
  controls.keys = [ 65, 83, 68 ]; // [ rotateKey, zoomKey, panKey ]
  window.addEventListener('resize',
                          function() { onWindowResize(renderer, camera, controls); },
                          false);

  return [camera, controls];
}

function onWindowResize(renderer, camera, controls) {
  var width = window.innerWidth;
  var height = window.innerHeight;

  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  camera.radius = (width + height) / 4;

  controls.screen.width = width;
  controls.screen.height = height;
}

function animate(renderer, camera, controls, scene) {
  requestAnimationFrame(function() { animate(renderer, camera, controls, scene); } );
  render(renderer, camera, controls, scene);
}

var targetObj = null;
var targetObjLoc = new THREE.Matrix4;

function render(renderer, camera, controls, scene) {
  var t = new Date().getTime() * timeScale;
  var dt = t - time;
  var time = t;

  animateSystem(scene, time); // in animation.js

  if (controls) {
    controls.update();
  }

  if (targetObj) {
    targetObjLoc.identity();
    var curObj = targetObj;
    var objs = []; // TODO(pablo)
    while (curObj.parent != scene) {
      objs.push(curObj);
      curObj = curObj.parent;
    }
    for (var i = objs.length - 1; i >= 0; i--) {
      var o = objs[i];
      targetObjLoc.multiplySelf(o.matrix);
    }
    camera.lookAt(targetObjLoc.getPosition());
  }

  renderer.clear();
  renderer.render(scene, camera);
}

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

Detector = {

	canvas : !! window.CanvasRenderingContext2D,
	webgl : ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )(),
	workers : !! window.Worker,
	fileapi : window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage : function () {

		var domElement = document.createElement( 'div' );

		domElement.style.fontFamily = 'monospace';
		domElement.style.fontSize = '13px';
		domElement.style.textAlign = 'center';
		domElement.style.background = '#eee';
		domElement.style.color = '#000';
		domElement.style.padding = '1em';
		domElement.style.width = '475px';
		domElement.style.margin = '5em auto 0';

		if ( ! this.webgl ) {

			domElement.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
			].join( '\n' ) : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
			].join( '\n' );

		}

		return domElement;

	},

	addGetWebGLMessage : function ( parameters ) {

		var parent, id, domElement;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		domElement = Detector.getWebGLErrorMessage();
		domElement.id = id;

		parent.appendChild( domElement );

	}

};

/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */

if ( !window.requestAnimationFrame ) {

	window.requestAnimationFrame = ( function() {

		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {

			window.setTimeout( callback, 1000 / 60 );

		};

	} )();

};
