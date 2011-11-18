function animateSystem(system, time) {
  
  twoPiTime = twoPi * time;

  if (system.siderealRotationPeriod) {
    system.rotation.y = twoPiTime / system.siderealRotationPeriod;
  }

  if (system.orbit) {
    var eccentricity = system.orbit.eccentricity;
    var aRadius = system.orbit.semiMajorAxis;
    var bRadius = aRadius * Math.sqrt(1.0 - Math.pow(eccentricity, 2.0));
    var t = twoPiTime / system.orbit.siderealOrbitPeriod;
    system.position.set(aRadius * Math.cos(t),
                        bRadius * Math.sin(t),
                        0);
  }

  for (ndx in system.children) {
    var child = system.children[ndx];
    animateSystem(child, time);
  }
}
