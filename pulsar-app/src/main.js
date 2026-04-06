import { createElement } from 'lwc';
import PulsarRetailExecution from '../../force-app/main/default/lwc/pulsarRetailExecution/pulsarRetailExecution.js';
import { Pulsar } from './vendor/pulsar.js';
import { installHostSizing, notifyHostSize } from './hostSizing.js';
import { parseLaunchContext } from './queryContext.js';

const appRoot = document.getElementById('app');
const cleanupHostSizing = installHostSizing(appRoot);
let pulsar = null;
let appElement = null;

function refreshRetailExecution() {
  if (typeof appElement?.refresh === 'function') {
    void appElement.refresh();
  }
}

(async () => {
  renderBootstrapLoading();
  notifyHostSize('*');

  try {
    pulsar = new Pulsar();
    await pulsar.init();

    const launchContext = parseLaunchContext(window.location.search);
    if (!launchContext.recordId) {
      renderMissingContext();
      notifyHostSize('*');
      return;
    }

    if (launchContext.objectApiName && launchContext.objectApiName !== 'Account') {
      renderUnsupportedContext(launchContext.objectApiName);
      notifyHostSize('*');
      return;
    }

    appElement = createElement('c-pulsar-retail-execution', {
      is: PulsarRetailExecution
    });
    appElement.pulsarSdk = pulsar;
    appElement.accountId = launchContext.recordId;

    appRoot.replaceChildren(appElement);
    notifyHostSize('*');

    if (typeof pulsar.registerHandler === 'function') {
      pulsar.registerHandler('invalidateLayout', refreshRetailExecution);
      pulsar.registerHandler('syncDataFinished', refreshRetailExecution);
    }
  } catch (error) {
    renderError(error instanceof Error ? error.message : 'Unexpected Pulsar bootstrap error.');
    notifyHostSize('*');
  }
})();

function renderBootstrapLoading() {
  appRoot.innerHTML = `
    <main class="shell">
      <section class="panel">
        <div class="panel-header">
          <p class="eyebrow">Pulsar App</p>
          <h1 class="title">Retail Execution</h1>
          <p class="subtitle">Initializing Pulsar bridge.</p>
        </div>
        <div class="state">Loading...</div>
      </section>
    </main>
  `;
}

function renderError(message) {
  appRoot.innerHTML = `
    <main class="shell">
      <section class="panel">
        <div class="panel-header">
          <p class="eyebrow">Pulsar App</p>
          <h1 class="title">Retail Execution</h1>
          <p class="subtitle">Bootstrap failed before the app could render.</p>
        </div>
        <div class="state error">${escapeHtml(message)}</div>
      </section>
    </main>
  `;
}

function renderMissingContext() {
  appRoot.innerHTML = `
    <main class="shell">
      <section class="panel">
        <div class="panel-header">
          <p class="eyebrow">Pulsar App</p>
          <h1 class="title">Retail Execution</h1>
          <p class="subtitle">Launch context is incomplete.</p>
        </div>
        <div class="state error">This app requires an account id in the launch context.</div>
      </section>
    </main>
  `;
}

function renderUnsupportedContext(objectApiName) {
  appRoot.innerHTML = `
    <main class="shell">
      <section class="panel">
        <div class="panel-header">
          <p class="eyebrow">Pulsar App</p>
          <h1 class="title">Retail Execution</h1>
          <p class="subtitle">Launch context is unsupported.</p>
        </div>
        <div class="state error">Retail Execution expects an Account context but received ${escapeHtml(objectApiName)}.</div>
      </section>
    </main>
  `;
}

window.addEventListener('beforeunload', () => {
  if (typeof pulsar?.deregisterHandler === 'function') {
    pulsar.deregisterHandler('invalidateLayout');
    pulsar.deregisterHandler('syncDataFinished');
  }

  appElement?.remove();
  cleanupHostSizing();
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
