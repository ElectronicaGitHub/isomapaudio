//three.js - Isometric Projection using an Orthographic Camera

var mesh, renderer, scene, camera, controls, meshes = [];
$(function () {
	init();
	render();	
})

function init() {

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	$('body').append( renderer.domElement );

	// scene
	scene = new THREE.Scene();

	// camera
	var aspect = window.innerWidth / window.innerHeight;
	var d = 20;
	camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );

	// method 1 - use lookAt
	camera.position.set( 20, 20, 20 );
	camera.lookAt( scene.position );

	// geometry
	var geometry = new THREE.BoxGeometry( 2, 0.5, 2 );

	// material
	var material = new THREE.MeshNormalMaterial();

	// mesh
	for (var i= 0; i < 5; i++) {
		for (var j = 0; j < 5; j++) {
			mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = i * mesh.geometry.parameters.width;
			mesh.position.z = j * mesh.geometry.parameters.depth;
			mesh.position.y = 1;
			meshes.push(mesh);
			scene.add( mesh );
		}
	}

}

var n = 1, c = 0, m = 200;

setInterval(function() {
	c++;
	if (c > m) {
		n = n - 0.05;
	} else {
		n = n + 0.05;
	}
	for (var i in meshes) {
		var m = meshes[i];
		m.scale.y = n;
		m.position.y = n * m.geometry.parameters.height/2;
	}
	render();

}, 30);

function render() {
	renderer.render( scene, camera );

}
