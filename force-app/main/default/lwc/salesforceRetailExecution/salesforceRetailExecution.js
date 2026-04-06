import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { SalesforceDataAdapter } from 'c/salesforceDataAdapter';

export default class SalesforceRetailExecution extends LightningElement {
  adapter = new SalesforceDataAdapter();

  @api recordId;
  @api accountId;
  @api title = 'Retail Execution';

  get effectiveAccountId() {
    return this.recordId || this.accountId || '';
  }

  handleSave() {
    this.dispatchEvent(new ShowToastEvent({
      title: 'Success',
      message: 'Visit saved',
      variant: 'success'
    }));
  }

  @api
  async refresh() {
    const retailExecutionApp = this.template.querySelector('c-retail-execution-app');
    if (retailExecutionApp) {
      return retailExecutionApp.refresh();
    }

    return undefined;
  }
}
