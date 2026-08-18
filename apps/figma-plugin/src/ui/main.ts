import { FIXTURES } from './fixtures';

interface RenderResultMessage {
  type: 'render-result';
  diagnostics: Array<{ severity: string; message: string }>;
}

interface RenderErrorMessage {
  type: 'render-error';
  message: string;
}

type PluginMessage = RenderResultMessage | RenderErrorMessage;

const select = document.querySelector<HTMLSelectElement>('#fixture-select')!;
const renderButton = document.querySelector<HTMLButtonElement>('#render-button')!;
const status = document.querySelector<HTMLDivElement>('#status')!;

for (const fixture of FIXTURES) {
  const option = document.createElement('option');
  option.value = fixture.id;
  option.textContent = fixture.label;
  select.appendChild(option);
}

renderButton.addEventListener('click', () => {
  const fixture = FIXTURES.find((entry) => entry.id === select.value);
  if (!fixture) {
    return;
  }
  status.textContent = `Rendering "${fixture.label}"…`;
  parent.postMessage({ pluginMessage: { type: 'render-fixture', scene: fixture.scene } }, '*');
});

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginMessage }>) => {
  const message = event.data.pluginMessage;
  if (!message) {
    return;
  }

  if (message.type === 'render-result') {
    status.textContent =
      message.diagnostics.length > 0
        ? `Rendered with ${message.diagnostics.length} diagnostic(s):\n` +
          message.diagnostics.map((d) => `[${d.severity}] ${d.message}`).join('\n')
        : 'Rendered successfully.';
  } else if (message.type === 'render-error') {
    status.textContent = `Error: ${message.message}`;
  }
};
