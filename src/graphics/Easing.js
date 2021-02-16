import * as THREE from "three";
import chroma from "chroma-js";

const Easing = {
  vector: function(v1, v2, t, f = Easing.linear) {
    return new THREE.Vector3(
      v1.x + (v2.x - v1.x) * f(t),
      v1.y + (v2.y - v1.y) * f(t),
      v1.z + (v2.z - v1.z) * f(t)
    );
  },
  quat: function(q1, q2, t, f = Easing.linear) {
    return q1.clone().slerp(q2, f(t));
  },
  number: function(v1, v2, t, f = Easing.linear) {
    return v1 + (v2 - v1) * f(t);
  },
  color: function(c1, c2, t, f = Easing.linear) {
    return chroma.mix(c1, c2, f(t)).hex();
  },
  // no easing, no acceleration
  linear: function(t) {
    return t;
  },
  // accelerating from zero velocity
  easeInQuad: function(t) {
    return t * t;
  },
  // decelerating to zero velocity
  easeOutQuad: function(t) {
    return t * (2 - t);
  },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  // accelerating from zero velocity
  easeInCubic: function(t) {
    return t * t * t;
  },
  // decelerating to zero velocity
  easeOutCubic: function(t) {
    return --t * t * t + 1;
  },
  // acceleration until halfway, then deceleration
  easeInOutCubic: function(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  // accelerating from zero velocity
  easeInQuart: function(t) {
    return t * t * t * t;
  },
  // decelerating to zero velocity
  easeOutQuart: function(t) {
    return 1 - --t * t * t * t;
  },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  },
  // accelerating from zero velocity
  easeInQuint: function(t) {
    return t * t * t * t * t;
  },
  // decelerating to zero velocity
  easeOutQuint: function(t) {
    return 1 + --t * t * t * t * t;
  },
  // acceleration until halfway, then deceleration
  easeInOutQuint: function(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  }
};

export default Easing;
