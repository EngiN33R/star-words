import React, { useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "react-three-fiber";

export default function CameraAnchor({
  position,
  offset = new THREE.Vector3(0, 0, 0),
  lookTarget
}) {
  const { camera } = useThree();
  const cb = () => {
    camera.position.copy(position).add(offset);
    if (lookTarget != null) {
      camera.lookAt(lookTarget);
    }
  };
  useEffect(cb, [camera]);
  useFrame(cb);
  // noinspection JSConstructorReturnsPrimitive
  return null;
}
