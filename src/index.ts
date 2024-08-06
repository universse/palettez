const DEFAULT_LOCAL_STORAGE_KEY = "__palettez";

type Modes<T> = { [K in keyof T]: keyof T[K] };
type Listener<T> = (updatedModes: Modes<T>, resolvedModes: Modes<T>) => void;

export type ThemeConfig = Record<
  string,
  {
    label: string;
    options: Record<
      string,
      {
        value: string;
        isDefault?: boolean;
        media?: { query: string; ifMatch: string; ifNotMatch: string };
      }
    >;
  }
>;

class Theme<T extends ThemeConfig> {
  modesAndOptions: Array<{
    key: string;
    label: string;
    options: Array<{ key: string; value: string }>;
  }>;

  #defaultModes: Modes<T>;
  #currentModes: Modes<T>;
  #resolvedOptionsByMode: Record<string, Record<string, string>>;

  #listeners: Set<Listener<T>> = new Set<Listener<T>>();

  constructor(
    private config: T,
    private options: { storageKey: string } = {
      storageKey: DEFAULT_LOCAL_STORAGE_KEY,
    }
  ) {
    this.modesAndOptions = Object.entries(config).reduce<
      Array<{
        key: string;
        label: string;
        options: Array<{ key: string; value: string }>;
      }>
    >((acc, [mode, modeConfig]) => {
      acc.push({
        key: mode,
        label: modeConfig.label,
        options: Object.entries(modeConfig.options).map(
          ([optionKey, { value }]) => ({
            key: optionKey,
            value,
          })
        ),
      });

      return acc;
    }, []);

    this.#defaultModes = Object.fromEntries(
      Object.entries(config).map(([mode, modeConfig]) => {
        const entries = Object.entries(modeConfig.options);

        const defaultOption =
          entries.find(([, option]) => option.isDefault) || entries[0];

        return [mode, defaultOption![0]];
      })
    ) as Modes<T>;

    this.#currentModes = { ...this.#defaultModes };

    this.#resolvedOptionsByMode = Object.fromEntries(
      Object.keys(config).map((mode) => [mode, {}])
    );
  }

  getModes(): Modes<T> {
    return this.#currentModes;
  }

  getResolvedModes(): Modes<T> {
    return this.#resolveModes();
  }

  setMode(newMode: Partial<Modes<T>>): void {
    this.#currentModes = { ...this.#currentModes, ...newMode };

    const resolvedModes = this.#resolveModes();

    this.#applyModes(resolvedModes);

    window.localStorage.setItem(
      this.options.storageKey,
      JSON.stringify(this.#currentModes)
    );

    this.#notify(resolvedModes);
  }

  restorePersistedModes(): void {
    const persistedModes = JSON.parse(
      window.localStorage.getItem(this.options.storageKey) || "null"
    );

    this.#currentModes = persistedModes || this.#defaultModes;

    const resolvedModes = this.#resolveModes();

    this.#applyModes(resolvedModes);
  }

  subscribe(callback: Listener<T>): () => void {
    this.#listeners.add(callback);

    return () => {
      this.#listeners.delete(callback);
    };
  }

  sync(): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key !== this.options.storageKey) return;

      const persistedModes = JSON.parse(e.newValue || "null");

      this.#currentModes = persistedModes || this.#defaultModes;

      const resolvedModes = this.#resolveModes();

      this.#applyModes(resolvedModes);

      this.#notify(resolvedModes);
    };

    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("storage", handler);
    };
  }

  #resolveModes(): Modes<T> {
    // @ts-expect-error TODO
    return Object.fromEntries(
      Object.entries(this.#currentModes).map(([mode, optionKey]) => {
        const option = this.config[mode]!.options[optionKey]!;

        const resolved = option.media
          ? this.#resolveOption({
              mode,
              // @ts-expect-error TODO
              option: { key: optionKey, ...option },
            })
          : optionKey;

        return [mode, resolved];
      })
    );
  }

  #applyModes(modes: Modes<T>): void {
    Object.entries(modes).forEach(([mode, optionKey]) => {
      document.documentElement.dataset[mode] = optionKey;
    });
  }

  #resolveOption({
    mode,
    option,
  }: {
    mode: string;
    option: {
      key: string;
      value: string;
      media: { query: string; ifMatch: string; ifNotMatch: string };
    };
  }): string {
    if (!this.#resolvedOptionsByMode[mode]![option.key]) {
      const {
        media: { query, ifMatch, ifNotMatch },
      } = option;

      const mq = window.matchMedia(query);

      this.#resolvedOptionsByMode[mode]![option.key] = mq.matches
        ? ifMatch
        : ifNotMatch;

      mq.addEventListener("change", (e) => {
        this.#resolvedOptionsByMode[mode]![option.key] = e.matches
          ? ifMatch
          : ifNotMatch;

        if (this.#currentModes[mode] === option.key) {
          const resolvedModes = this.#resolveModes();

          this.#applyModes(resolvedModes);

          this.#notify(resolvedModes);
        }
      });
    }

    return this.#resolvedOptionsByMode[mode]![option.key]!;
  }

  #notify(resolvedModes: Modes<T>): void {
    this.#listeners.forEach((listener) =>
      listener(this.#currentModes, resolvedModes)
    );
  }
}

export function create(config: ThemeConfig) {
  return new Theme(config);
}
