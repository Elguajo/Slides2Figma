import { parseMainWorldMessage } from '../shared/message';

/**
 * Re-validates on receipt (Technical Spec §28: "После получения обязательно
 * Zod/JSON Schema validation") rather than trusting `content/bridge.ts`'s
 * validation alone -- the service worker is a second trust boundary
 * (`chrome.runtime.sendMessage` can be called by any extension context, not
 * just this bridge), so it must not assume every sender already validated.
 *
 * Only logs `channel`/`type`, never `payload` -- avoids habituating this
 * codebase to logging potential slide content even though today's only
 * payload (`MAIN_WORLD_READY`'s page URL) is harmless (Technical Spec
 * §56.6: never log text content in production).
 */
chrome.runtime.onMessage.addListener((data: unknown) => {
  const message = parseMainWorldMessage(data);
  if (!message) return;

  console.debug(`[slides2figma] received "${message.type}" via ${message.channel}`);
});
