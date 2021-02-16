import { useState } from "react";
import { useFrame } from "react-three-fiber";
import Easing from "./Easing";
import * as THREE from "three";

export function useAnimationState({
  start,
  end,
  delta = 0.005,
  type = "number",
  func = "linear",
  onEnd,
  onUpdate
}) {
  const [startValue, setStartValue] = useState(start);
  const [endValue, setEndValue] = useState(end);
  const [state, setState] = useState({
    value: start,
    timer: 0,
    started: false,
    finished: false
  });
  useFrame(() => {
    const timer = Math.min(state.timer, 1);
    if (state.started && timer <= 1) {
      const newValue = Easing[type](startValue, endValue, timer, Easing[func]);
      setState({ ...state, value: newValue, timer: state.timer + delta });
      if (onUpdate) onUpdate(newValue, state.timer);
      if (timer === 1) {
        setState({ ...state, started: false, finished: true });
        if (onEnd) onEnd(state.value);
      }
    }
  });
  return {
    start: () => setState({ ...state, started: true }),
    stop: () => setState({ ...state, started: false }),
    setEnd: setEndValue,
    setStart: setStartValue,
    value: state.value,
    timer: state.timer,
    running: state.started,
    finished: state.finished
  };
}

export function useAnimationStates(states) {
  const [startValues, setStartValues] = useState(
    Object.keys(states).reduce(
      (values, key) => ({ ...values, [key]: states[key].start }),
      {}
    )
  );
  const [endValues, setEndValues] = useState(
    Object.keys(states).reduce(
      (values, key) => ({ ...values, [key]: states[key].end }),
      {}
    )
  );
  const [frameValues, setFrameValues] = useState(
    Object.keys(states)
      .filter(key => states[key].frames != null)
      .reduce((values, key) => ({ ...values, [key]: states[key].frames }), {})
  );
  const [internals, setInternals] = useState(
    Object.keys(states).reduce(
      (values, key) => ({
        ...values,
        [key]: {
          value: states[key].start,
          timer: 0,
          frame: 0,
          started: false,
          finished: false
        }
      }),
      {}
    )
  );

  function updateInternals(key, update) {
    // Function passed here to avoid race conditions
    setInternals(prevState => ({
      ...prevState,
      [key]: { ...prevState[key], ...update }
    }));
  }

  useFrame(() => {
    for (const key of Object.keys(states)) {
      const state = internals[key];
      const { type = "number", onEnd, onUpdate, func = "linear" } = states[key];
      const startValue =
        frameValues[key] != null
          ? frameValues[key][state.frame]
          : startValues[key];
      const nextValue =
        frameValues[key] != null
          ? frameValues[key][state.frame + 1]
          : endValues[key];
      const timer = state.timer > 1 ? 1 : state.timer;
      let delta = states[key].delta || 0.005;
      if (delta instanceof Object) {
        delta = delta[state.frame];
      }
      if (state.started && timer <= 1) {
        //if (key === 'jumpOut') console.log(startValue, nextValue, delta);
        const newValue = Easing[type](
          startValue,
          nextValue,
          timer,
          Easing[func]
        );
        updateInternals(key, { value: newValue, timer: state.timer + delta });
        if (onUpdate) onUpdate(newValue, state.timer);
        if (timer === 1) {
          if (frameValues[key] != null) {
            if (state.frame < frameValues[key].length - 2) {
              updateInternals(key, { frame: state.frame + 1, timer: 0 });
              return;
            }
          }
          updateInternals(key, { started: false, finished: true });
          if (onEnd) onEnd(state.value);
        }
      }
    }
  });

  return Object.keys(states).reduce(
    (object, key) => ({
      ...object,
      [key]: {
        start: () => updateInternals(key, { started: true }),
        stop: () => updateInternals(key, { started: false }),
        setEnd: end => setEndValues({ ...endValues, [key]: end }),
        setStart: start => setStartValues({ ...startValues, [key]: start }),
        setFrames: frames => setFrameValues({ ...frameValues, [key]: frames }),
        frame: internals[key].frame,
        nextValue:
          frameValues[key] && frameValues[key][internals[key].frame + 1],
        value: internals[key].value,
        timer: internals[key].timer,
        running: internals[key].started,
        finished: internals[key].finished
      }
    }),
    {}
  );
}

export function useCurvedMovement(
  startPosition,
  curve,
  { speed = 1, mapPoint } = {}
) {
  const [point, setPoint] = useState(0);
  const [offset, setOffset] = useState(new THREE.Vector3(0, 0, 0));
  const [position, setPosition] = useState(new THREE.Vector3(0, 0, 0));
  useFrame(() => {
    const splinePoint = curve.getPointAt(point);
    if (mapPoint) {
      splinePoint.copy(mapPoint(splinePoint));
    }
    setPosition(startPosition.clone().add(splinePoint));
    setOffset(splinePoint);
    setPoint((point + 0.0005 * speed) % 1);
  });
  return [position, offset];
}
