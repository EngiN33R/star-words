import React, { useRef, useState, useContext } from "react";
import chroma from "chroma-js";
import { useFrame } from "react-three-fiber";
import SceneContext from "../SceneContext";

function Shield({ rotation }) {
  return (
    <mesh scale={[2.5, 2.5, 2.5]} rotation={[rotation, 0, rotation]}>
      <sphereBufferGeometry attach="geometry" args={[5, 12, 12]} />
      <meshLambertMaterial
        attach="material"
        transparent={true}
        opacity={0.2}
        color="#778"
        emissive="#006"
      />
    </mesh>
  );
}

export default function Station({ position, shielded }) {
  const groupRef = useRef(null);
  const coreRef = useRef(null);
  const ringRef = useRef(null);
  const [bob, setBob] = useState(0);
  const [rotation, setRotation] = useState(0);
  const {
    lighting: { color: lightingColorHex }
  } = useContext(SceneContext);
  useFrame((state, delta) => {
    setRotation((rotation + delta / 3) % (Math.PI * 2));
    setBob((bob + delta * 2) % (Math.PI * 2));
  });

  const lightingColor = chroma(lightingColorHex);

  return (
    <group
      ref={groupRef}
      position={position.isVector3 ? position.toArray() : position}
    >
      <mesh
        ref={coreRef}
        scale={[1, 1.5, 1]}
        position={[0, Math.sin(bob) / 2, 0]}
        rotation={[0, -rotation, 0]}
      >
        <octahedronBufferGeometry attach="geometry" args={[5]} />
        <meshPhongMaterial
          attach="material"
          color="#18f"
          specular={lightingColor.hex()}
        />
      </mesh>
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, rotation]}
        scale={[2, 2, 2]}
      >
        <torusBufferGeometry attach="geometry" args={[5, 0.2, 10, 10]} />
        <meshPhongMaterial
          attach="material"
          color="#fff"
          specular={lightingColor.darken(3).hex()}
        />
      </mesh>
      {shielded ? <Shield rotation={rotation} /> : null}
    </group>
  );
}
