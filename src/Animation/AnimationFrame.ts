export class AnimationFrame {
  public static request(callback: (time: number) => void): number {
    if (typeof requestAnimationFrame !== "undefined") {
      return requestAnimationFrame(callback);
    }

    return setTimeout((): void => {
      const now = performance.now();

      callback(now);
    }, 1000 / 60) as unknown as number;
  }

  public static cancel(frame: number | undefined): void {
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
