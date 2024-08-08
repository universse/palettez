import * as React from "react";

export function usePalettez(key: string = "palettez") {
  const {
    modesAndOptions,
    getModes,
    getResolvedModes,
    setModes,
    restorePersistedModes,
    subscribe,
    sync,
    // @ts-expect-error TODO
  } = window.palettez.read(key);

  const modes = React.useSyncExternalStore(
    React.useCallback(
      (callback) => {
        return subscribe(callback);
      },
      [key]
    ),
    () => getModes(),
    () => null
  );

  return {
    modesAndOptions,
    modes,
    getResolvedModes,
    setModes,
    restorePersistedModes,
    subscribe,
    sync,
  };
}
