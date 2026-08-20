import { parseMainWorldMessage } from '../shared/message';

/**
 * Bridges MAIN-world `postMessage` traffic into the extension's own
 * messaging system (Technical Spec §28). Runs in the ISOLATED content
 * script world -- it has `chrome.runtime` access that MAIN-world scripts
 * never get, and MAIN-world scripts have no other way to reach the service
 * worker. `event.source !== window || event.origin !== window.location.origin`
 * rejects cross-origin and framed traffic before the message even reaches
 * schema validation -- `parseMainWorldMessage` then rejects anything that
 * isn't a well-formed envelope, silently ignoring unrelated page script
 * `postMessage` traffic rather than treating it as an error.
 */
window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window || event.origin !== window.location.origin) return;

  const message = parseMainWorldMessage(event.data);
  if (!message) return;

  void chrome.runtime.sendMessage(message);
});
