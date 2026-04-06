import { LightningElement, api } from 'lwc';

export default class RetailExecutionView extends LightningElement {
  @api accountName = '';
  @api lastVisit = null;
  @api draftVisit = null;
  @api viewingVisit = null;
  @api shelfConditionField = null;
  @api isLoading = false;
  @api isSaving = false;
  @api errorMessage = '';

  get hasError() {
    return Boolean(this.errorMessage);
  }

  get isCheckedIn() {
    return Boolean(this.draftVisit);
  }

  get isViewingLastVisit() {
    return Boolean(this.viewingVisit);
  }

  get shelfOptions() {
    return this.shelfConditionField?.picklistValues ?? [];
  }

  get lastVisitName() {
    return this.lastVisit?.name ?? '';
  }

  handleStartVisit() {
    this.dispatchEvent(new CustomEvent('startvisit'));
  }

  handleCancelDraft() {
    this.dispatchEvent(new CustomEvent('canceldraft'));
  }

  handleSaveDraft() {
    this.dispatchEvent(new CustomEvent('savedraft'));
  }

  handleShowLastVisit() {
    this.dispatchEvent(new CustomEvent('showlastvisit'));
  }

  handleCloseLastVisit() {
    this.dispatchEvent(new CustomEvent('closelastvisit'));
  }

  handleFieldChange(event) {
    const fieldName = event.target.name;
    let value;

    if (event.target.type === 'checkbox') {
      value = event.target.checked;
    } else if (event.detail && event.detail.value !== undefined) {
      value = event.detail.value;
    } else {
      value = event.target.value;
    }

    this.dispatchEvent(new CustomEvent('draftchange', {
      detail: {
        fieldName,
        value
      }
    }));
  }
}
