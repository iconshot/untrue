export class Frame {
  static request(callback: (time: number) => void): number {
    if (typeof requestAnimationFrame !== "undefined") {
      return requestAnimationFrame(callback);
    }

    return setTimeout((): void => {
      const now = performance.now();

      callback(now);
    }, 1000 / 60);
  }

  static cancel(frame: number | undefined): void {
    if (frame === undefined) {
      return;
    }

    if (typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(frame);

      return;
    }

    clearTimeout(frame);
  }
}
