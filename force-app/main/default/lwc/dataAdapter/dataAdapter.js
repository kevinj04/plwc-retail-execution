import { createRuntimeCapabilities } from 'c/sharedModels';

/**
 * @typedef {import('c/sharedModels').FieldModel} FieldModel
 * @typedef {import('c/sharedModels').LayoutModel} LayoutModel
 * @typedef {import('c/sharedModels').LayoutRequest} LayoutRequest
 * @typedef {import('c/sharedModels').ListViewModel} ListViewModel
 * @typedef {import('c/sharedModels').QuerySpec} QuerySpec
 * @typedef {import('c/sharedModels').RecordModel} RecordModel
 * @typedef {import('c/sharedModels').ReferenceDisplayModel} ReferenceDisplayModel
 * @typedef {import('c/sharedModels').RuntimeCapabilities} RuntimeCapabilities
 */

/**
 * Runtime-neutral adapter contract. Concrete implementations should override every method.
 */
export class DataAdapter {
  /**
   * @returns {Promise<'salesforce' | 'pulsar'>}
   */
  async getRuntime() {
    throw new Error('DataAdapter.getRuntime() is not implemented.');
  }

  /**
   * @param {string} objectApiName
   * @param {string} id
   * @returns {Promise<RecordModel | null>}
   */
  async loadRecord(objectApiName, id) {
    throw new Error(`DataAdapter.loadRecord() is not implemented for ${objectApiName}:${id}.`);
  }

  /**
   * @param {string} objectApiName
   * @param {QuerySpec} querySpec
   * @returns {Promise<RecordModel[]>}
   */
  async queryRecords(objectApiName, querySpec) {
    void objectApiName;
    void querySpec;
    throw new Error('DataAdapter.queryRecords() is not implemented.');
  }

  /**
   * @param {string} objectApiName
   * @param {Record<string, unknown>} fields
   * @returns {Promise<string>}
   */
  async createRecord(objectApiName, fields) {
    void objectApiName;
    void fields;
    throw new Error('DataAdapter.createRecord() is not implemented.');
  }

  /**
   * @param {string} objectApiName
   * @param {Record<string, unknown>} fields
   * @returns {Promise<string>}
   */
  async updateRecord(objectApiName, fields) {
    void objectApiName;
    void fields;
    throw new Error('DataAdapter.updateRecord() is not implemented.');
  }

  /**
   * @param {string} objectApiName
   * @param {string} id
   * @returns {Promise<string>}
   */
  async deleteRecord(objectApiName, id) {
    void objectApiName;
    void id;
    throw new Error('DataAdapter.deleteRecord() is not implemented.');
  }

  /**
   * @param {string} objectApiName
   * @returns {Promise<{ fields: FieldModel[] }>}
   */
  async getObjectSchema(objectApiName) {
    void objectApiName;
    throw new Error('DataAdapter.getObjectSchema() is not implemented.');
  }

  /**
   * @param {LayoutRequest} input
   * @returns {Promise<LayoutModel>}
   */
  async getLayout(input) {
    void input;
    return { sections: [] };
  }

  /**
   * @param {string} objectApiName
   * @returns {Promise<Record<string, string>>}
   */
  async getListViewInfo(objectApiName) {
    void objectApiName;
    throw new Error('DataAdapter.getListViewInfo() is not implemented.');
  }

  /**
   * @param {string} objectApiName
   * @param {string} listViewId
   * @returns {Promise<ListViewModel>}
   */
  async getListViewMetadata(objectApiName, listViewId) {
    void objectApiName;
    void listViewId;
    throw new Error('DataAdapter.getListViewMetadata() is not implemented.');
  }

  /**
   * @param {string} baseObjectApiName
   * @param {string} fieldApiName
   * @param {string} referenceId
   * @returns {Promise<ReferenceDisplayModel | null>}
   */
  async resolveReferenceDisplay(baseObjectApiName, fieldApiName, referenceId) {
    void baseObjectApiName;
    void fieldApiName;
    void referenceId;
    return null;
  }

  /**
   * @returns {Promise<RuntimeCapabilities>}
   */
  async getCapabilities() {
    return createRuntimeCapabilities();
  }
}

/**
 * @param {unknown} adapter
 * @returns {asserts adapter is DataAdapter}
 */
export function assertDataAdapter(adapter) {
  const requiredMethods = [
    'getRuntime',
    'loadRecord',
    'queryRecords',
    'createRecord',
    'updateRecord',
    'deleteRecord',
    'getObjectSchema',
    'getLayout',
    'getListViewInfo',
    'getListViewMetadata',
    'resolveReferenceDisplay',
    'getCapabilities'
  ];

  for (const methodName of requiredMethods) {
    if (!adapter || typeof adapter[methodName] !== 'function') {
      throw new Error(`Adapter is missing required method ${methodName}().`);
    }
  }
}
