import { render } from "@testing-library/react";
import { toast } from "sonner";
import UpdatePrompt, { UPDATE_CHECK_MS } from "../UpdatePrompt";

const updateServiceWorker = vi.fn();
let needRefresh = false;
let options: {
  onRegisteredSW?: (url: string, r?: ServiceWorkerRegistration) => void;
} = {};

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: (opts: typeof options) => {
    options = opts;
    return {
      needRefresh: [needRefresh, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    };
  },
}));
vi.mock("sonner", () => ({
  toast: Object.assign(
    vi.fn(() => "toast-1"),
    { dismiss: vi.fn() },
  ),
}));

type Action = { label: string; onClick: () => void };

describe("UpdatePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    needRefresh = false;
  });
  afterEach(() => vi.useRealTimers());

  it("stays quiet while the running version is current", () => {
    render(<UpdatePrompt />);
    expect(toast).not.toHaveBeenCalled();
  });

  it("offers a refresh that activates the new version", () => {
    needRefresh = true;
    const { unmount } = render(<UpdatePrompt />);

    expect(toast).toHaveBeenCalledWith(
      "A new version of the shop is available.",
      expect.objectContaining({ duration: Infinity }),
    );
    const { action } = vi.mocked(toast).mock.calls[0][1] as {
      action: Action;
    };
    expect(action.label).toBe("Refresh");
    action.onClick();
    expect(updateServiceWorker).toHaveBeenCalledWith(true);

    unmount();
    expect(toast.dismiss).toHaveBeenCalledWith("toast-1");
  });

  it("checks for new deploys hourly and when the tab is shown again", () => {
    vi.useFakeTimers();
    const update = vi.fn(() => Promise.resolve());
    render(<UpdatePrompt />);
    options.onRegisteredSW?.("/service-worker.js", {
      update,
    } as unknown as ServiceWorkerRegistration);

    vi.advanceTimersByTime(UPDATE_CHECK_MS);
    expect(update).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new Event("visibilitychange"));
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("does nothing if the service worker didn't register", () => {
    render(<UpdatePrompt />);
    expect(() => options.onRegisteredSW?.("/sw.js", undefined)).not.toThrow();
  });
});
