import { createElement } from 'lwc';
import PulsarRecordDetail from '../../force-app/main/default/lwc/pulsarRecordDetail/pulsarRecordDetail.js';
import { Pulsar } from './vendor/pulsar.js';
import { installHostSizing, notifyHostSize } from './hostSizing.js';
import { parseLaunchContext } from './queryContext.js';

const appRoot = document.getElementById('app');
const cleanupHostSizing = installHostSizing(appRoot);
let pulsar = null;
let appElement = null;

function refreshRecordDetail() {
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
    if (!launchContext.objectApiName || !launchContext.recordId) {
      renderMissingContext();
      notifyHostSize('*');
      return;
    }

    appElement = createElement('c-pulsar-record-detail', {
      is: PulsarRecordDetail
    });
    appElement.pulsarSdk = pulsar;
    appElement.objectApiName = launchContext.objectApiName;
    appElement.recordId = launchContext.recordId;

    appRoot.replaceChildren(appElement);
    notifyHostSize('*');

    if (typeof pulsar.registerHandler === 'function') {
      pulsar.registerHandler('invalidateLayout', refreshRecordDetail);
      pulsar.registerHandler('syncDataFinished', refreshRecordDetail);
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
          <h1 class="title">Pulsar Record Detail</h1>
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
          <h1 class="title">Pulsar Record Detail</h1>
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
          <h1 class="title">Pulsar Record Detail</h1>
          <p class="subtitle">Launch context is incomplete.</p>
        </div>
        <div class="state error">This app requires both objectType and id query parameters.</div>
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
