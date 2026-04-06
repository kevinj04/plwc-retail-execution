import { LightningElement, api } from 'lwc';
import { PulsarDataAdapter } from 'c/pulsarDataAdapter';

export default class PulsarRecordDetail extends LightningElement {
  _pulsarSdk;

  @api objectApiName;
  @api recordId;

  @api
  get pulsarSdk() {
    return this._pulsarSdk;
  }

  set pulsarSdk(value) {
    this._pulsarSdk = value;
    // The Pulsar host stays thin: it only converts the injected SDK into the shared adapter contract.
    this.adapter = value ? new PulsarDataAdapter({ sdk: value }) : null;
  }

  adapter = null;

  @api
  async refresh() {
    const recordDetailApp = this.template.querySelector('c-record-detail-app');
    if (recordDetailApp) {
      return recordDetailApp.refresh();
    }

    return undefined;
  }
}
