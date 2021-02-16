import React, { useEffect, useRef } from "react";
import "./App.scss";
import {
  Canvas,
  extend,
  useFrame,
  useRender,
  useThree
} from "react-three-fiber";
import Stats from "stats.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import useStore from "./data/store";
import BattleScene from "./graphics/scenes/BattleScene";
import Camera from "./graphics/Camera";
import SceneContext from "./graphics/SceneContext";
import WarpScene from "./graphics/scenes/WarpScene";
import styled, { css } from "styled-components";
extend({ OrbitControls });

function Controls(props) {
  const { gl, camera } = useThree();
  const ref = useRef();
  useRender(() => ref.current.update());
  return <orbitControls ref={ref} args={[camera, gl.domElement]} {...props} />;
}

function getComponent(scene) {
  switch (scene.type) {
    case "warp":
      return <WarpScene />;
    case "battle":
      return <BattleScene {...scene.context} />;
  }
}

const Fade = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  ${props => css`
    background-color: ${props.color || "#fff"};
    opacity: ${props.opacity == null ? 1 : props.opacity};
  `}
`;

function App() {
  const [scene, requestSceneChange, fade] = useStore(state => [
    state.scene,
    state.requestSceneChange,
    state.fade
  ]);

  function keyPress(e) {
    if (e.key === "w") {
      requestSceneChange("warp", {});
    } else if (e.key === "b") {
      requestSceneChange("battle", {
        star: {
          color: "#f33",
          direction: [-1, 1, -2],
          distance: 1500,
          size: 3
        },
        station: { shielded: true }
      });
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", keyPress, false);

    return () => {
      document.removeEventListener("keydown", keyPress, false);
    };
  }, []);

  return (
    <div className="App">
      <div className="canvas-root">
        <Canvas>
          <Camera fov={75} zoom={1} near={0.1} far={10000} />
          {/*<Controls />*/}
          {getComponent(scene)}
        </Canvas>
        <Fade color={fade.color} opacity={fade.opacity} />
      </div>
    </div>
  );
}

export default App;
