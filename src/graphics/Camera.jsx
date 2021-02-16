import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "react-three-fiber";

export default function Camera(props) {
  const ref = useRef(null);
  const { setDefaultCamera } = useThree();
  // Make the camera known to the system
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void setDefaultCamera(ref.current), []);
  // Update it every frame
  useFrame(() => ref.current.updateMatrixWorld());
  return <perspectiveCamera ref={ref} {...props} />;
}
