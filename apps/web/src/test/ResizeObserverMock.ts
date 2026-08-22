export class ResizeObserverMock implements ResizeObserver {
  static readonly instances = new Set<ResizeObserverMock>();

  readonly #callback: ResizeObserverCallback;
  readonly #targets = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
    ResizeObserverMock.instances.add(this);
  }

  observe(target: Element) {
    this.#targets.add(target);
  }

  unobserve(target: Element) {
    this.#targets.delete(target);
  }

  disconnect() {
    this.#targets.clear();
    ResizeObserverMock.instances.delete(this);
  }

  static notify(target?: Element) {
    for (const observer of ResizeObserverMock.instances) {
      if (target && !observer.#targets.has(target)) continue;
      observer.#callback([], observer);
    }
  }

  static reset() {
    ResizeObserverMock.instances.clear();
  }
}
