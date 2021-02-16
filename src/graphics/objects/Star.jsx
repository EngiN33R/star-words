import React, { useState } from "react";
import { useFrame } from "react-three-fiber";
import chroma from "chroma-js";

export default function Star({ color, direction, distance, size }) {
  const position = direction.map(d => d * distance);
  const [rotation, setRotation] = useState(0);
  useFrame((state, delta) =>
    setRotation((rotation + delta / 10) % (Math.PI * 2))
  );
  const chromaColor = chroma(color);
  return (
    <>
      {/*<directionalLight intensity={size / 3} position={position} color={chromaColor.brighten(2).hex()}/>*/}
      <pointLight
        intensity={size / 3}
        position={position}
        color={chromaColor.brighten(2).hex()}
      />
      <mesh position={position} rotation={[0, rotation, 0]}>
        <sphereBufferGeometry attach="geometry" args={[size * 100, 8, 6]} />
        <meshLambertMaterial
          attach="material"
          color={chromaColor.darken().hex()}
          emissive={color}
        />
      </mesh>
    </>
  );
}
