import { buildGlobalsSnapshot } from './globals-snapshot';
import type { MainWorldMessage } from '../shared/message';

/**
 * Runs in the page's own MAIN-world JS realm (Technical Spec §6) -- no
 * `chrome.*` extension APIs are reachable here, only `window.postMessage`
 * to the ISOLATED content script's bridge (`content/bridge.ts`). Targeted
 * at `window.location.origin`, never `'*'`, so a message never leaks to a
 * different origin even if this script somehow ran inside a cross-origin
 * frame.
 */
function postToContentScript(type: string, payload?: unknown): void {
  const message: MainWorldMessage = { channel: 'slides2figma', version: 1, type, payload };
  window.postMessage(message, window.location.origin);
}

/**
 * Smoke-tests the MAIN-world -> bridge -> service-worker pipeline on every
 * page load -- confirms injection actually happened without shipping any
 * real extraction/probing logic yet (that's a later Phase 01 task). Carries
 * no slide content, only the page URL, which is already visible to the
 * extension via `host_permissions`.
 */
postToContentScript('MAIN_WORLD_READY', { href: window.location.href });

/**
 * MAIN-world-only research helper (Technical Spec §7/Phase 01 Task 5) --
 * ISOLATED-world content scripts get their own separate `window`, so this
 * global scan only sees Google's page-assigned globals from here. Fires
 * once per load, like `MAIN_WORLD_READY` above -- not a passive/periodic
 * probe.
 */
postToContentScript('MAIN_WORLD_GLOBALS_SNAPSHOT', {
  globals: buildGlobalsSnapshot(window as unknown as Record<string, unknown>),
});
