import { LightningElement, api, track } from 'lwc';
import { loadRecordDetail } from 'c/sharedRecordService';

export default class RecordDetailApp extends LightningElement {
  _adapter;
  _objectApiName = '';
  _recordId = '';
  _isConnected = false;
  _refreshVersion = 0;

  @track sections = [];
  @track errorMessage = '';
  @track isLoading = false;

  @api
  get adapter() {
    return this._adapter;
  }

  set adapter(value) {
    this._adapter = value;
    this.queueRefresh();
  }

  @api
  get objectApiName() {
    return this._objectApiName;
  }

  set objectApiName(value) {
    this._objectApiName = value || '';
    this.queueRefresh();
  }

  @api
  get recordId() {
    return this._recordId;
  }

  set recordId(value) {
    this._recordId = value || '';
    this.queueRefresh();
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
      this.sections = [];
      this.errorMessage = 'A data adapter is required before loading record detail.';
      this.isLoading = false;
      return;
    }

    if (!this._objectApiName || !this._recordId) {
      this.sections = [];
      this.errorMessage = 'Set both object-api-name and record-id before loading record detail.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // This is the runtime-neutral entrypoint for record-detail loading.
      // Hosts provide context plus an adapter; the shared service does the rest.
      const detail = await loadRecordDetail(this._adapter, this._objectApiName, this._recordId);

      if (!this._isConnected || refreshVersion !== this._refreshVersion) {
        return;
      }

      this.sections = detail.sections;
    } catch (error) {
      if (!this._isConnected || refreshVersion !== this._refreshVersion) {
        return;
      }

      this.sections = [];
      this.errorMessage = error instanceof Error ? error.message : 'Unexpected record detail error.';
    } finally {
      if (!this._isConnected || refreshVersion !== this._refreshVersion) {
        return;
      }

      this.isLoading = false;
    }
  }

  queueRefresh() {
    if (!this._isConnected) {
      return;
    }

    // The app refreshes whenever the host changes adapter or record context.
    void this.refresh();
  }
}
