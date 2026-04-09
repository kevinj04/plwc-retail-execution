import { LightningElement, api, track } from 'lwc';
import {
  createRetailExecutionDraft,
  loadRetailExecutionState,
  saveRetailExecutionDraft,
  updateRetailExecutionDraft
} from 'c/sharedRetailExecutionService';

export default class RetailExecutionApp extends LightningElement {
  _adapter;
  _accountId = '';
  _showHeader = false;
  _isConnected = false;
  _refreshVersion = 0;

  @track accountName = '';
  @track lastVisit = null;
  @track draftVisit = null;
  @track viewingVisit = null;
  @track shelfConditionField = null;
  @track errorMessage = '';
  @track isLoading = false;
  @track isSaving = false;

  @api
  get adapter() {
    return this._adapter;
  }

  set adapter(value) {
    this._adapter = value;
    this.queueRefresh();
  }

  @api
  get accountId() {
    return this._accountId;
  }

  set accountId(value) {
    this._accountId = value || '';
    this.queueRefresh();
  }

  @api
  get showHeader() {
    return this._showHeader;
  }

  set showHeader(value) {
    this._showHeader = value === true || value === 'true';
  }

  connectedCallback() {
    this._isConnected = true;
    this.queueRefresh();
  }

  disconnectedCallback() {
    this._isConnected = false;
    this._refreshVersion += 1;
  }

  @api
  async refresh() {
    const refreshVersion = ++this._refreshVersion;

    if (!this._adapter) {
      this.resetState();
      this.errorMessage = '';
      return;
    }

    if (!this._accountId) {
      this.resetState();
      this.errorMessage = '';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const state = await loadRetailExecutionState(this._adapter, {
        accountId: this._accountId
      });

      if (!this.shouldApply(refreshVersion)) {
        return;
      }

      this.accountName = state.accountName;
      this.lastVisit = state.lastVisit;
      this.draftVisit = null;
      this.viewingVisit = null;
      this.shelfConditionField = state.shelfConditionField;
      this.errorMessage = '';
    } catch (error) {
      if (!this.shouldApply(refreshVersion)) {
        return;
      }

      this.resetState();
      this.errorMessage = normalizeErrorMessage(error, 'Unexpected retail execution error.');
    } finally {
      if (!this.shouldApply(refreshVersion)) {
        return;
      }

      this.isLoading = false;
    }
  }

  get isCheckedIn() {
    return Boolean(this.draftVisit);
  }

  get isViewingVisit() {
    return Boolean(this.viewingVisit);
  }

  handleStartVisit() {
    if (!this._accountId) {
      this.errorMessage = 'Retail Execution requires an Account record context.';
      return;
    }

    if (this.isLoading || this.isSaving) {
      return;
    }

    this.draftVisit = createRetailExecutionDraft(this._accountId);
    this.viewingVisit = null;
    this.errorMessage = '';
  }

  handleDraftChange(event) {
    if (!this.draftVisit || this.isSaving) {
      return;
    }

    const { fieldName, value } = event.detail || {};
    if (!fieldName) {
      return;
    }

    this.draftVisit = updateRetailExecutionDraft(this.draftVisit, fieldName, value);
  }

  handleCancelDraft() {
    if (this.isSaving) {
      return;
    }

    this.draftVisit = null;
  }

  async handleSaveDraft() {
    if (!this.draftVisit || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      const savedVisit = await saveRetailExecutionDraft(this._adapter, this.draftVisit);
      this.lastVisit = savedVisit;
      this.draftVisit = null;
      this.viewingVisit = null;

      this.dispatchEvent(new CustomEvent('save', {
        detail: {
          visitId: savedVisit.id
        }
      }));
    } catch (error) {
      this.errorMessage = normalizeErrorMessage(error, 'Unexpected retail execution save error.');
    } finally {
      this.isSaving = false;
    }
  }

  handleShowLastVisit() {
    if (!this.lastVisit || this.isCheckedIn) {
      return;
    }

    this.viewingVisit = { ...this.lastVisit };
  }

  handleCloseLastVisit() {
    this.viewingVisit = null;
  }

  queueRefresh() {
    if (!this._isConnected) {
      return;
    }

    void this.refresh();
  }

  shouldApply(refreshVersion) {
    return this._isConnected && refreshVersion === this._refreshVersion;
  }

  resetState() {
    this.accountName = '';
    this.lastVisit = null;
    this.draftVisit = null;
    this.viewingVisit = null;
    this.shelfConditionField = null;
    this.isLoading = false;
    this.isSaving = false;
  }
}

function normalizeErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (Array.isArray(error?.body)) {
    return error.body
      .map((entry) => entry?.message)
      .filter(Boolean)
      .join(', ') || fallbackMessage;
  }

  if (typeof error?.body?.message === 'string' && error.body.message) {
    return error.body.message;
  }

  if (typeof error?.message === 'string' && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
