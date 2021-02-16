import React, {
  Suspense,
  useRef,
  useEffect,
  useContext,
  useState
} from "react";
import SceneContext from "../SceneContext";
import * as THREE from "three";
import { useFrame, useLoader, useThree } from "react-three-fiber";
import chroma from "chroma-js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { animated } from "@react-spring/three";

function Camera(props) {
  const ref = useRef();
  const { setDefaultCamera } = useThree();
  // Make the camera known to the system
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void setDefaultCamera(ref.current), []);
  // Update it every frame
  useFrame(() => ref.current.updateMatrixWorld());
  return <perspectiveCamera ref={ref} {...props} />;
}

function Ship(props) {
  const group = useRef(null);
  const innerGroup = useRef(null);
  const flame1 = useRef(null);
  const flame2 = useRef(null);
  const gltf = useLoader(GLTFLoader, "/ship.glb");
  const {
    lighting: { color: lightingColorHex }
  } = useContext(SceneContext);
  const lightingColor = chroma(lightingColorHex);

  useEffect(() => {
    if (props.groupRef) {
      props.groupRef.current = group.current;
    }
    if (props.innerGroupRef) {
      props.innerGroupRef.current = innerGroup.current;
    }
  }, []);

  useFrame(({ clock }) => {
    if (props.engine) {
      const scale = 0.5 + Math.sin(clock.getElapsedTime() * 200) / 10;
      flame1.current.scale.x = flame1.current.scale.z = flame2.current.scale.x = flame2.current.scale.z = scale;
    } else {
      if (
        (((flame1.current.scale.x !== flame1.current.scale.z) !==
          flame2.current.scale.x) !==
          flame2.current.scale.z) !==
        1
      ) {
        flame1.current.scale.x = flame1.current.scale.z = flame2.current.scale.x = flame2.current.scale.z = 1;
      }
    }
  });

  return (
    <group
      ref={group}
      {...props}
      position={
        props.position.isVector3 ? props.position.toArray() : props.position
      }
    >
      <group ref={innerGroup} rotation={[0, -Math.PI / 2, 0]} scale={[2, 2, 2]}>
        <scene name="Scene">
          <pointLight
            intensity={0.7}
            distance={2}
            position={[-1.58, 0, -0.25]}
            color="#0ff"
          />
          <mesh
            ref={flame1}
            name="Engine_Left_Flame"
            position={[props.engine ? -3.5 * 3 : -1.18, 0, -0.25]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderBufferGeometry
              attach="geometry"
              args={[0.2, 0.2, props.engine ? 20 : 0.35, 6]}
            />
            <meshBasicMaterial attach="material" color="#0aa" />
          </mesh>
          <pointLight
            intensity={0.7}
            distance={2}
            position={[-1.58, 0, 0.25]}
            color="#0ff"
          />
          <mesh
            ref={flame2}
            name="Engine_Right_Flame"
            position={[props.engine ? -3.5 * 3 : -1.18, 0, 0.25]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderBufferGeometry
              attach="geometry"
              args={[0.2, 0.2, props.engine ? 20 : 0.35, 6]}
            />
            <meshBasicMaterial attach="material" color="#0aa" />
          </mesh>
          <mesh
            name="Engine_Left"
            position={[-1.18, 0, -0.25]}
            rotation={[0, 0, -Math.PI / 2]}
            scale={[1, 4, 1]}
          >
            <bufferGeometry attach="geometry" {...gltf.__$[3].geometry} />
            <meshPhongMaterial
              attach="material"
              color="#000"
              specular={lightingColor.darken(3).hex()}
            />
          </mesh>
          <mesh
            name="Engine_Right"
            position={[-1.18, 0, 0.25]}
            rotation={[0, 0, -Math.PI / 2]}
            scale={[1, 4, 1]}
          >
            <bufferGeometry attach="geometry" {...gltf.__$[4].geometry} />
            <meshPhongMaterial
              attach="material"
              color="#000"
              specular={lightingColor.darken(3).hex()}
            />
          </mesh>
          <mesh name="Body">
            <bufferGeometry attach="geometry" {...gltf.__$[5].geometry} />
            <meshPhongMaterial
              attach="material"
              color="#555"
              specular={lightingColor.darken(3).hex()}
            />
          </mesh>
        </scene>
      </group>
    </group>
  );
}

export default function ShipGroup(props) {
  return (
    <Suspense fallback={null}>
      <Ship {...props} />
    </Suspense>
  );
}
