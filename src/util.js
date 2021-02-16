import * as THREE from "three";

export function quatLookAt(v1, v2, up = new THREE.Vector3(0, 1, 0)) {
  const rotationMatrix = new THREE.Matrix4();
  const targetQuaternion = new THREE.Quaternion();
  rotationMatrix.lookAt(v2, v1, up);
  targetQuaternion.setFromRotationMatrix(rotationMatrix);
  return targetQuaternion;
}

export function getForwardVector(v1, v2) {
  return new THREE.Ray(v1).lookAt(v2).direction;
}
