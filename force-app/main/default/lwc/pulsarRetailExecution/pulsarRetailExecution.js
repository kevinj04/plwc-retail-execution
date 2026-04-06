import { LightningElement, api } from 'lwc';
import { PulsarDataAdapter } from 'c/pulsarDataAdapter';

export default class PulsarRetailExecution extends LightningElement {
  _pulsarSdk;

  @api accountId;

  @api
  get pulsarSdk() {
    return this._pulsarSdk;
  }

  set pulsarSdk(value) {
    this._pulsarSdk = value;
    this.adapter = value ? new PulsarDataAdapter({ sdk: value }) : null;
  }

  adapter = null;

  @api
  async refresh() {
    const retailExecutionApp = this.template.querySelector('c-retail-execution-app');
    if (retailExecutionApp) {
      return retailExecutionApp.refresh();
    }

    return undefined;
  }
}
