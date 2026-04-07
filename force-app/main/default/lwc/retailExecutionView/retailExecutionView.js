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

  get hasLastVisit() {
    return Boolean(this.lastVisit);
  }

  get lastVisitDisplay() {
    const checkInAt = this.lastVisit?.checkInAt;
    if (!checkInAt) {
      return 'No recorded visits.';
    }

    return formatDate(checkInAt, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  get checkedInDisplay() {
    const checkInAt = this.draftVisit?.checkInAt;
    if (!checkInAt) {
      return this.lastVisitDisplay;
    }

    return formatDate(checkInAt, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  get saveButtonLabel() {
    return this.isSaving ? 'Checking Out...' : 'Check-Out';
  }

  get canInteract() {
    return !this.isLoading && !this.isSaving;
  }

  get viewingVisitRows() {
    if (!this.viewingVisit) {
      return [];
    }

    return [
      { key: 'name', label: 'Visit', value: this.viewingVisit.name || '--' },
      { key: 'checkin', label: 'Check In', value: formatDateTimeOrFallback(this.viewingVisit.checkInAt) },
      { key: 'checkout', label: 'Check Out', value: formatDateTimeOrFallback(this.viewingVisit.checkOutAt) },
      { key: 'shelf', label: 'Shelf Condition', value: this.viewingVisit.shelfCondition || '--' },
      { key: 'display', label: 'Display Count', value: formatNumberOrFallback(this.viewingVisit.promotionalDisplayCount) },
      { key: 'manager', label: 'Spoke To Manager', value: this.viewingVisit.spokeToManager ? 'Yes' : 'No' }
    ];
  }

  handleStartVisit() {
    this.dispatchEvent(createComponentEvent('startvisit'));
  }

  handleCancelDraft() {
    this.dispatchEvent(createComponentEvent('canceldraft'));
  }

  handleSaveDraft() {
    this.dispatchEvent(createComponentEvent('savedraft'));
  }

  handleShowLastVisit() {
    this.dispatchEvent(createComponentEvent('showlastvisit'));
  }

  handleCloseLastVisit() {
    this.dispatchEvent(createComponentEvent('closelastvisit'));
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

    this.dispatchEvent(createComponentEvent('draftchange', {
      detail: {
        fieldName,
        value
      }
    }));
  }
}

function createComponentEvent(name, init = {}) {
  return new CustomEvent(name, {
    bubbles: true,
    composed: true,
    ...init
  });
}

function formatDate(value, options) {
  const dateValue = parseDate(value);
  if (!dateValue) {
    return '--';
  }

  return new Intl.DateTimeFormat(undefined, options).format(dateValue);
}

function formatDateTimeOrFallback(value) {
  const dateValue = parseDate(value);
  if (!dateValue) {
    return '--';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(dateValue);
}

function formatNumberOrFallback(value) {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  return String(value);
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const dateValue = new Date(value);
  return Number.isNaN(dateValue.getTime()) ? null : dateValue;
}
