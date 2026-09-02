export interface LatestRequest {
  readonly signal: AbortSignal;
  isCurrent(): boolean;
}

export class LatestRequestController {
  private generation = 0;
  private active: AbortController | null = null;

  begin(): LatestRequest {
    this.active?.abort(new DOMException('Request superseded.', 'AbortError'));
    const controller = new AbortController();
    const generation = ++this.generation;
    this.active = controller;

    return {
      signal: controller.signal,
      isCurrent: () =>
        this.generation === generation && this.active === controller && !controller.signal.aborted,
    };
  }

  finish(request: LatestRequest): void {
    if (request.isCurrent()) this.active = null;
  }

  cancel(): void {
    this.active?.abort(new DOMException('Request cancelled.', 'AbortError'));
    this.active = null;
    this.generation++;
  }
}
