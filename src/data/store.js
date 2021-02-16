import create from "zustand";
import { devtools } from "zustand/middleware";
import merge from "lodash/merge";

function initialStore(set) {
  function update(delta) {
    if (typeof delta === "function") {
      return set(state => merge({ ...state }, delta(state)));
    }
    return set(state => merge({ ...state }, delta));
  }

  return {
    hurt: false,
    fade: { color: "#fff", opacity: 0 },
    scene: { type: "warp", context: {} },
    nextScene: { type: null, context: {} },
    previousScene: { type: null, context: {} },

    requestSceneChange: (type, context) => {
      update({ nextScene: { type, context } });
    },
    confirmSceneChange: () => {
      update(state => ({
        previousScene: { ...state.scene },
        scene: { ...state.nextScene },
        nextScene: { type: null, context: {} }
      }));
    },
    changeScene: (type, context) => {
      update({ scene: { type, context } });
    },
    damage: () => {
      update({ hurt: true });
      setTimeout(() => update({ hurt: false }), 250);
    },
    setFade: fade => {
      update({ fade });
    }
  };
}

const [useStore] = create(devtools(initialStore));

export default useStore;
