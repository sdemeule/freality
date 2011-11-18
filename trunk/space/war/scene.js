var
  atmosScale = 1.005,
  maxOrbit = 5869660000.0, // in km, pluto orbit's semi-major axis
  orbitScale = 1,
  starScale = maxOrbit * 1000.0; // arbitrary big multiplier to push them far out

var globe;
var starImage, starGlowMaterial;

/**
 * News a cube of 10k random stars around the origin.
 *
 * TODO(pablo): load from dataset.
 */
function newStars(stars) {
  var orbitPlane = new THREE.Object3D;
  var orbitPosition = new THREE.Object3D;
  orbitPlane.add(orbitPosition);

  var starImage = pathTexture('star_glow', '.png');
  var starGlowMaterial =
    new THREE.ParticleBasicMaterial({ color: 0xffffff,
                                      size: stars.radius,
                                      map: starImage,
                                      sizeAttenuation: true,
                                      blending: THREE.AdditiveBlending,
                                      depthTest: false,
                                      transparent: false });

  var starMiniMaterial =
    new THREE.ParticleBasicMaterial({ color: 0xffffff,
                                      size: 4,
                                      map: starImage,
                                      sizeAttenuation: false,
                                      blending: THREE.AdditiveBlending,
                                      depthTest: true,
                                      transparent: true });

  var starsGeometry = new THREE.Geometry();

  // For the sun.
  starsGeometry.vertices.push(new THREE.Vertex(new THREE.Vector3()));

  for (var i = 1; i < stars.count; i++) {
    var vector = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    vector.multiplyScalar(starScale);
    starsGeometry.vertices.push(new THREE.Vertex(vector));
  }

  var shape = new THREE.Object3D();

  var starPoints = new THREE.ParticleSystem(starsGeometry, starMiniMaterial);
  starPoints.sortParticles = true;
  shape.add(starPoints);

  var starGlows = new THREE.ParticleSystem(starsGeometry, starGlowMaterial);
  starGlows.sortParticles = true;
  shape.add(starGlows);

  orbitPosition.add(shape);
  orbitPlane.orbitPosition = orbitPosition;
  return orbitPlane;
}

function newPointLight() {
  return new THREE.PointLight(0xffffff);
}

function newStar(starProps) {
  var orbitPlane = new THREE.Object3D;
  var orbitPosition = new THREE.Object3D;
  orbitPlane.add(orbitPosition);

  // TODO(pablo): add back in 'sun-white' sunspot texture.
  var star = new THREE.Object3D;
  /*
     lodSphere(starProps.radius,
                       new THREE.MeshBasicMaterial({color: 0xffffff,
                                                    depthTest: true,
                                                    wireframe: false,
                                                    transparent: false }));
  */
  orbitPosition.add(star);

  orbitPlane.orbitPosition = orbitPosition;
  return orbitPlane;
}

function newOrbitingPlanet(planetProps) {
  var orbitPlane = new THREE.Object3D;
  doRot(orbitPlane, planetProps.orbit);

  var orbitPosition = new THREE.Object3D;
  orbitPlane.add(orbitPosition);
  // Attaching this property triggers orbit of planet during animation.
  orbitPosition.orbit = planetProps.orbit;

  var planet = newPlanet(planetProps);
  //var planet = sphere();
  planet.rotation.x -= halfPi;
  orbitPosition.add(planet);

  // Children centered at this planet's orbit position.
  orbitPlane.orbitPosition = orbitPosition;
  return orbitPlane;
};

function newPlanet(planetProps) {
  var planet = new THREE.Object3D;
  // TODO(pablo): put these in near LOD only.
  if (planetProps.texture_atmosphere) {
    planet.add(newAtmosphere(planetProps));
    planet.add(atmos(1.01));
  }

  // TODO(pablo): if underlying planet is a BasicMeshMaterial, order
  // matters and surface has to go after atmosphere; adding surface
  // before atmosphere causes failure of atmosphere display.  No idea
  // why.  This is not currently the case, but this appears to be
  // idemopotent given then current config, so leaving it this way.
  planet.add(newSurface(planetProps));

  // Tilt could be set in orbit configuration, but for the moment
  // seems more intrinsic.
  planet.rotation.z = planetProps.axialInclination * toRad;
  //planet.rotation.x += planetProps.axialInclination * toRad;

  // Attaching this property triggers rotation of planet during animation.
  planet.siderealRotationPeriod = planetProps.siderealRotationPeriod;

  return planet;
}

function newSurface(planetProps) {
  var planetMaterial;
  if (true || !(planetProps.texture_hydrosphere || planetProps.texture_terrain)) {
    planetMaterial = cacheMaterial(planetProps.name);
  } else {
    // Fancy planets.
    var shader = THREE.ShaderUtils.lib['normal'];
    var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['tDiffuse'].texture = pathTexture(planetProps.name);
    uniforms['enableAO'].value = false;
    uniforms['enableDiffuse'].value = true;
    uniforms['uDiffuseColor'].value.setHex(0xffffff);
    uniforms['uAmbientColor'].value.setHex(0);
    uniforms['uShininess'].value = 20;

    if (planetProps.texture_hydrosphere) {
      uniforms['enableSpecular'].value = true;
      uniforms['tSpecular'].texture = pathTexture(planetProps.name, '_hydro.jpg');
      uniforms['uSpecularColor'].value.setHex(0xffffff);
    }

    if (planetProps.texture_terrain) {
      uniforms['tNormal'].texture = pathTexture(planetProps.name, '_terrain.jpg');
      uniforms['uNormalScale'].value = 0.1;
    }

    planetMaterial = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: uniforms,
        //        wireframe: true,
        lights: true
      });
  }

  return lodSphere(planetProps.radius, planetMaterial);
}

function newAtmosphere(planetProps) {
  var mat =
    new THREE.MeshLambertMaterial({color: 0xffffff,
                                   map: pathTexture(planetProps.name, '_atmos.png'),
                                   transparent: true});
  return lodSphere(planetProps.radius * atmosScale, mat);
}

function newOrbit(orbit) {
  var ellipseCurve = new THREE.EllipseCurve(0, 0,
                                            orbit.semiMajorAxis * orbitScale,
                                            orbit.eccentricity,
                                            0, 2.0 * Math.PI,
                                            false);
  var ellipseCurvePath = new THREE.CurvePath();
  ellipseCurvePath.add(ellipseCurve);
  var ellipseGeometry = ellipseCurvePath.createPointsGeometry(100);
  ellipseGeometry.computeTangents();
  var orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x000033,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      transparent: true
    });
  
  var line = new THREE.Line(ellipseGeometry, orbitMaterial);
  doRot(line, orbit);
  return line;
}

function doRot(obj, orbit) {
  //obj.rotation.z = orbit.longitudeOfPerihelion; // Add true anomaly here.
  obj.rotation.x = halfPi + parseInt(orbit.inclination);
  //obj.rotation.y = orbit.longitudeOfAscendingNode;
}
