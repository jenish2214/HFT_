/** Suppress known browser-extension console noise (MetaMask, etc.). */

const EXT_PATTERN =
  /MaxListenersExceededWarning|EventEmitter memory leak|ObjectMultiplex|orphaned data for stream|contentscript\.js|inpage\.js|ChromeTransport|app-init-liveness|background-liveness|chromePort disconnected|Resetting the streams|installHook\.js|runtime\.lastError|Could not establish connection|Receiving end does not exist|\[object Object\]/;

function argsToText(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) return a.message;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(" ");
}

const DEV_PATTERN =
  /malformed chunk|webpack-hmr|use-websocket\.js|Failed to fetch RSC payload|Fast Refresh|performing full reload|hot-update\.json|ERR_EMPTY_RESPONSE/;

let installed = false;

function shouldFilter(args: unknown[]): boolean {
  const text = argsToText(args);
  if (EXT_PATTERN.test(text)) return true;
  if (process.env.NODE_ENV === "development" && DEV_PATTERN.test(text)) return true;
  return false;
}

export function installConsoleFilter(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const origWarn = console.warn.bind(console);
  const origError = console.error.bind(console);
  const origLog = console.log.bind(console);

  console.warn = (...args: unknown[]) => {
    if (shouldFilter(args)) return;
    origWarn(...args);
  };

  console.error = (...args: unknown[]) => {
    if (shouldFilter(args)) return;
    origError(...args);
  };

  console.log = (...args: unknown[]) => {
    if (shouldFilter(args)) return;
    origLog(...args);
  };
}

// Run as soon as this module loads on the client bundle.
installConsoleFilter();
