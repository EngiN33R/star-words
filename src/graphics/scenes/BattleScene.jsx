import React, { useRef, useEffect, useMemo, useState } from "react";
import SceneContext from "../SceneContext";
import Star from "../objects/Star";
import Station from "../objects/Station";
import Ship from "../objects/Ship";
import { extend, useFrame, useThree } from "react-three-fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass";
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass";
import * as THREE from "three";
import useStore from "../../data/store";
import { useAnimationStates, useCurvedMovement } from "../hooks";
import CameraAnchor from "../CameraAnchor";
import { getForwardVector, quatLookAt } from "../../util";
extend({
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
  BloomPass,
  FilmPass,
  GlitchPass,
  AfterimagePass
});

function Stars({ count = 2000 }) {
  const positions = useMemo(() => {
    let positions = [];
    for (let i = 0; i < count; i++) {
      const r = 8000;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.cos(theta) * Math.sin(phi) + Math.random() * 1000;
      const y = r * Math.sin(theta) * Math.sin(phi) + Math.random() * 1000;
      const z = r * Math.cos(phi) + Math.random() * 500;
      positions.push(x);
      positions.push(y);
      positions.push(z);
    }
    return new Float32Array(positions);
  }, [count]);
  return (
    <points>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attachObject={["attributes", "position"]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={25}
        sizeAttenuation
        color="white"
        fog={false}
      />
    </points>
  );
}

function Effects() {
  const hurt = useStore(state => state.hurt);
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
      {hurt ? <glitchPass attachArray="passes" args={[0.2]} /> : false}
    </effectComposer>
  );
}

function ShipProp({ position, target, engine }) {
  const ship = useRef(null);
  const innerShip = useRef(null);
  useEffect(() => {
    if (ship.current == null) return;
    ship.current.setRotationFromQuaternion(
      quatLookAt(ship.current.position, target, ship.current.up)
    );
  }, [ship.current]);

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
  const [, offsetPosition] = useCurvedMovement(position, path);
  useFrame(() => {
    if (ship.current == null) return;
    if (innerShip.current == null) return;
    innerShip.current.position.copy(offsetPosition);
    ship.current.setRotationFromQuaternion(
      quatLookAt(ship.current.position, target, ship.current.up)
    );
  });
  const cameraOffset = new THREE.Vector3(0, 2, 0).add(
    getForwardVector(position, target)
      .negate()
      .multiplyScalar(6)
  );

  return (
    <>
      <CameraAnchor
        position={position}
        offset={cameraOffset}
        lookTarget={target}
      />
      <Ship
        groupRef={ship}
        innerGroupRef={innerShip}
        position={position}
        engine={engine}
      />
    </>
  );
}

function Corridor({ ship, target, scale, color, distance }) {
  const end = useRef(null);

  const position = ship
    .clone()
    .add(getForwardVector(ship, target).multiplyScalar(distance));
  const rotation = quatLookAt(position, ship, end.up);

  useFrame(({ clock }) => {
    end.current.setRotationFromQuaternion(rotation);
    end.current.scale.x =
      (scale * 6) / (1 + scale * 2) + Math.sin(clock.getElapsedTime() * 5) / 5;
    end.current.scale.y = scale * 2 + Math.cos(clock.getElapsedTime() * 2) / 5;
  });

  return (
    <scene>
      <mesh ref={end} position={position.toArray()} visible={scale > 0}>
        <circleBufferGeometry attach="geometry" args={[20, 32]} />
        <meshBasicMaterial attach="material" color={color} />
      </mesh>
      <directionalLight position={position.toArray()} color={color} />
    </scene>
  );
}

const stationPosition = new THREE.Vector3(0, 0, 0);
const startPosition = new THREE.Vector3(-1000, 500, 2000);
const endPosition = new THREE.Vector3(-10, 10, 20);
export default function BattleScene({ star, station, ship }) {
  const [
    damage,
    setFade,
    sceneChange,
    nextScene,
    confirmSceneChange
  ] = useStore(state => [
    state.damage,
    state.setFade,
    state.nextScene.type != null,
    state.nextScene,
    state.confirmSceneChange
  ]);
  function keyPress(e) {
    if (e.key === " ") {
      damage();
    }
  }
  const preJumpPoint = endPosition
    .clone()
    .add(
      getForwardVector(
        endPosition,
        new THREE.Vector3(...star.direction).multiplyScalar(10)
      ).multiplyScalar(150)
    );
  const jumpPoint = endPosition
    .clone()
    .add(
      getForwardVector(
        endPosition,
        new THREE.Vector3(...star.direction).multiplyScalar(10)
      ).multiplyScalar(500)
    );

  const {
    jumpIn: { start: jumpIn, value: position, finished: arrived },
    fadeIn: { start: fadeIn },
    orientOut: { start: rotateOut, value: outTarget, finished: rotated },
    openCorridor: { start: openAperture, value: scale, finished: apertureOpen },
    jumpOut: {
      start: jumpOut,
      value: outPosition,
      finished: out,
      running: jumping
    }
  } = useAnimationStates({
    jumpIn: {
      start: startPosition,
      end: endPosition,
      type: "vector",
      func: "easeOutCubic"
    },
    fadeIn: {
      start: 1,
      end: 0,
      delta: 0.05,
      onUpdate: opacity => setFade({ opacity })
    },
    orientOut: {
      start: stationPosition,
      end: preJumpPoint,
      type: "vector",
      func: "easeOutCubic"
    },
    openCorridor: { start: 0, end: 1 },
    jumpOut: {
      start: endPosition,
      end: jumpPoint,
      type: "vector",
      func: "easeInCubic"
    }
  });

  useEffect(() => {
    document.addEventListener("keydown", keyPress, false);
    jumpIn();
    fadeIn();

    return () => {
      document.removeEventListener("keydown", keyPress, false);
    };
  }, []);

  useEffect(() => {
    if (sceneChange) {
      rotateOut();
      if (rotated) {
        openAperture();
      }
      if (apertureOpen) {
        jumpOut();
      }
      if (out) {
        confirmSceneChange();
      }
    }
  }, [sceneChange, rotated, apertureOpen, out]);

  return (
    <SceneContext.Provider
      value={{ lighting: { color: star.color, intensity: star.size } }}
    >
      <Effects />
      <Stars />
      <ambientLight intensity={0.1} />
      <Star {...star} />
      <Station {...station} position={stationPosition} />
      <ShipProp
        {...ship}
        position={apertureOpen ? outPosition : position}
        target={apertureOpen ? jumpPoint : outTarget}
        engine={!arrived || jumping}
      />
      <Corridor
        ship={position}
        target={outTarget}
        scale={scale}
        color="#fff"
        distance={500}
        open={rotated}
      />
    </SceneContext.Provider>
  );
}
