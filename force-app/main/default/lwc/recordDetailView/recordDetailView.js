import { LightningElement, api } from 'lwc';

export default class RecordDetailView extends LightningElement {
  @api sections = [];
  @api errorMessage = '';
  @api isLoading = false;

  get hasError() {
    return Boolean(this.errorMessage);
  }

  get hasSections() {
    return this.sections.length > 0;
  }
}
