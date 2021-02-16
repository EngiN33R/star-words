import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "react-three-fiber";
import SceneContext from "../SceneContext";
import * as THREE from "three";
import chroma from "chroma-js";
import flatten from "lodash/flatten";
import sampleSize from "lodash/sampleSize";
import Ship from "../objects/Ship";
import { Float32BufferAttribute } from "three";
import useStore from "../../data/store";
import { useAnimationStates, useCurvedMovement } from "../hooks";

function Effects() {
  const composer = useRef();
  const { scene, gl, size, camera } = useThree();
  useEffect(() => void composer.current.setSize(size.width, size.height), [
    size
  ]);
  useFrame(() => composer.current.render(), 2);
  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />
      <unrealBloomPass attachArray="passes" args={[undefined, 1.6, 1, 0]} />
      {/*<filmPass attachArray="passes" args={[0.05, 0.5, 1500, false]} />*/}
      {/*<glitchPass attachArray="passes" args={[256]} />*/}
    </effectComposer>
  );
}

function generateStar(fast) {
  if (fast) {
    //return new THREE.Vector3(-200 + Math.random() * 400, -200 + Math.random() * 400, 200 + Math.random() * 1000);
    return [
      -200 + Math.random() * 400,
      -200 + Math.random() * 400,
      200 + Math.random() * 1000
    ];
  } else {
    //return new THREE.Vector3(-1500 + Math.random() * 3000, -1500 + Math.random() * 3000, 1000 + Math.random() * 1000);
    return [
      -1500 + Math.random() * 3000,
      -1500 + Math.random() * 3000,
      1000 + Math.random() * 1000
    ];
  }
}

const FAST_STARS = 100;
const SLOW_STARS = 300;
function Stars({ speed }) {
  const scene = useRef(null);
  const initialFastStars = [];
  for (let i = 0; i < FAST_STARS; i++) {
    initialFastStars.push(generateStar(true));
  }
  const initialSlowStars = [];
  for (let i = 0; i < SLOW_STARS; i++) {
    initialSlowStars.push(generateStar());
  }
  const [fastStars, setFastStars] = useState(initialFastStars);
  const [slowStars, setSlowStars] = useState(initialSlowStars);

  useFrame(() => {
    const chance = Math.random();
    const newFastStars = [];
    const newSlowStars = [];
    for (let i = 0; i < fastStars.length; i++) {
      if (fastStars[i][2] > -5) {
        //newFastStars.push(fastStars[i].setZ(fastStars[i].z - speed));
        newFastStars.push([
          fastStars[i][0],
          fastStars[i][1],
          fastStars[i][2] - speed
        ]);
      }
    }
    for (let i = 0; i < slowStars.length; i++) {
      if (slowStars[i][2] > -5) {
        //newSlowStars.push(slowStars[i].setZ(slowStars[i].z - speed / 3));
        newSlowStars.push([
          slowStars[i][0],
          slowStars[i][1],
          slowStars[i][2] - speed / 3
        ]);
      }
    }
    if (fastStars.length < FAST_STARS && chance > 0.5) {
      for (let i = 0; i < FAST_STARS - fastStars.length; i++) {
        newFastStars.push(generateStar(true));
      }
    }
    if (slowStars.length < SLOW_STARS && chance > 0.5) {
      for (let i = 0; i < SLOW_STARS - slowStars.length; i++) {
        newSlowStars.push(generateStar());
      }
    }
    setFastStars(newFastStars);
    setSlowStars(newSlowStars);
  });

  /*const mergedFastStars = new Float32Array(flatten(fastStars.map(s => s.toArray())));
  const mergedSlowStars = new Float32Array(flatten(slowStars.map(s => s.toArray())));*/
  const mergedFastStars = new Float32Array(flatten(fastStars));
  const mergedSlowStars = new Float32Array(flatten(slowStars));
  //console.log(mergedFastStars);

  const fastStarGeometry = new THREE.BufferGeometry();
  fastStarGeometry.addAttribute(
    "position",
    new Float32BufferAttribute(mergedFastStars, 3)
  );
  const slowStarGeometry = new THREE.BufferGeometry();
  slowStarGeometry.addAttribute(
    "position",
    new Float32BufferAttribute(mergedSlowStars, 3)
  );

  //const lightSources = sampleSize(fastStars, 5).map((v, idx) => <pointLight distance={200} key={idx} position={v.toArray()} intensity={0.4} color="#fff" />);
  const lightSources = sampleSize(fastStars, 5).map((v, idx) => (
    <pointLight
      distance={200}
      key={idx}
      position={v}
      intensity={0.4}
      color="#fff"
    />
  ));

  return (
    <scene ref={scene}>
      <points geometry={fastStarGeometry}>
        <pointsMaterial
          attach="material"
          size={5}
          sizeAttenuation
          depthTest={false}
          color="white"
          fog={false}
        />
      </points>
      <points geometry={slowStarGeometry}>
        <pointsMaterial
          attach="material"
          size={5}
          sizeAttenuation
          depthTest={false}
          color="white"
          fog={false}
        />
      </points>
      {lightSources}
    </scene>
  );
}

function Corridor({ color, distance }) {
  const end = useRef(null);

  useFrame(({ clock }) => {
    end.current.scale.x = 2 + Math.sin(clock.getElapsedTime() * 5) / 5;
    end.current.scale.y = 2 + Math.cos(clock.getElapsedTime() * 2) / 5;
  });

  return (
    <scene>
      <mesh ref={end} position={[0, 0, distance]} rotation={[0, Math.PI, 0]}>
        <circleBufferGeometry attach="geometry" args={[20, 32]} />
        <meshBasicMaterial attach="material" color={color} />
      </mesh>
      <directionalLight position={[0, 0, distance]} color={color} />
    </scene>
  );
}

function ShipEntity({ position, engine }) {
  const ship = useRef(null);
  const innerShip = useRef(null);

  const path = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, 0.5, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0.5, -0.5, 0),
      new THREE.Vector3(-0.5, 0.5, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(-0.5, -0.5, 0)
    ],
    true,
    "chordal"
  );
  const [, offsetPosition] = useCurvedMovement(position, path, {
    speed: 2,
    mapPoint: v => v.multiplyScalar(0.5)
  });
  useFrame(() => {
    if (innerShip.current == null) return;
    innerShip.current.position.copy(offsetPosition);
  });

  return (
    <Ship
      groupRef={ship}
      innerGroupRef={innerShip}
      position={position}
      engine={engine}
    />
  );
}

const cameraPosition = new THREE.Vector3(0, 2, -6);
const shipPosition = new THREE.Vector3(0, 0, 0);
export default function WarpScene({ speed = 10 }) {
  const { camera } = useThree();
  const [
    sceneChange,
    nextScene,
    confirmSceneChange,
    setFade,
    didSwitch
  ] = useStore(state => [
    state.nextScene.type != null,
    state.nextScene,
    state.confirmSceneChange,
    state.setFade,
    state.previousScene.type != null
  ]);

  const {
    star: {
      start: startStarColor,
      setEnd: setStarColor,
      value: starColor,
      finished: starFinished
    },
    jump: {
      start: startJump,
      value: corridorDistance,
      finished: corridorFinished
    },
    speedUp: { start: speedUp, value: starSpeed, finished: speedFinished },
    fadeIn: { start: fadeIn }
  } = useAnimationStates({
    star: { start: "#fff", end: "#fff", type: "color" },
    jump: { start: 500, end: -5 },
    speedUp: { start: speed, end: speed * 5 },
    fadeIn: {
      start: 1,
      end: 0,
      delta: 0.05,
      onUpdate: opacity => setFade({ opacity })
    }
  });
  const allFinished = starFinished && speedFinished && corridorFinished;

  useEffect(() => {
    camera.position.copy(cameraPosition);
    camera.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    if (didSwitch) {
      fadeIn();
    }
  }, [camera]);

  useEffect(() => {
    if (sceneChange) {
      setStarColor(
        chroma(nextScene.context.star.color)
          .brighten(2)
          .hex()
      );
      startStarColor();
      speedUp();
      startJump();
    }
  }, [sceneChange]);

  useEffect(() => {
    if (allFinished) {
      setFade({ opacity: 1 });
      confirmSceneChange();
    }
  }, [allFinished]);

  return (
    <SceneContext.Provider value={{ lighting: { color: "#444" } }}>
      <Effects />
      <ambientLight intensity={0.02} />
      <Stars speed={starSpeed} />
      <Corridor color={starColor} distance={corridorDistance} />
      <ShipEntity position={shipPosition} engine={!corridorFinished} />
    </SceneContext.Provider>
  );
}
