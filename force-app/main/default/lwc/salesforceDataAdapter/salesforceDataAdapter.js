import { DataAdapter } from 'c/dataAdapter';
import { normalizeRecord } from 'c/sharedModels';
import queryRecords from '@salesforce/apex/SharedDataAdapterController.queryRecords';
import createRecord from '@salesforce/apex/SharedDataAdapterController.createRecord';
import updateRecord from '@salesforce/apex/SharedDataAdapterController.updateRecord';
import deleteRecord from '@salesforce/apex/SharedDataAdapterController.deleteRecord';
import getObjectSchema from '@salesforce/apex/SharedDataAdapterController.getObjectSchema';

export class SalesforceDataAdapter extends DataAdapter {
  async getRuntime() {
    return 'salesforce';
  }

  /**
   * @param {string} objectApiName
   * @param {string} id
   * @returns {Promise<import('c/sharedModels').RecordModel | null>}
   */
  async loadRecord(objectApiName, id) {
    const records = await this.queryRecords(objectApiName, {
      fields: ['Id', 'Name'],
      filters: { Id: id },
      limit: 1
    });

    return records[0] ?? null;
  }

  /**
   * @param {string} objectApiName
   * @param {import('c/sharedModels').QuerySpec} querySpec
   * @returns {Promise<import('c/sharedModels').RecordModel[]>}
   */
  async queryRecords(objectApiName, querySpec = {}) {
    const rows = await queryRecords({
      objectApiName,
      querySpecJson: JSON.stringify(querySpec)
    });

    return Array.isArray(rows)
      ? rows.map((row) => normalizeRecord(objectApiName, row))
      : [];
  }

  /**
   * @param {string} objectApiName
   * @param {Record<string, unknown>} fields
   * @returns {Promise<string>}
   */
  async createRecord(objectApiName, fields) {
    return createRecord({
      objectApiName,
      fieldsJson: JSON.stringify(fields)
    });
  }

  /**
   * @param {string} objectApiName
   * @param {Record<string, unknown>} fields
   * @returns {Promise<string>}
   */
  async updateRecord(objectApiName, fields) {
    return updateRecord({
      objectApiName,
      fieldsJson: JSON.stringify(fields)
    });
  }

  /**
   * @param {string} objectApiName
   * @param {string} id
   * @returns {Promise<string>}
   */
  async deleteRecord(objectApiName, id) {
    return deleteRecord({
      objectApiName,
      recordId: id
    });
  }

  /**
   * @param {string} objectApiName
   * @returns {Promise<{ fields: import('c/sharedModels').FieldModel[] }>}
   */
  async getObjectSchema(objectApiName) {
    const schema = await getObjectSchema({ objectApiName });
    return {
      fields: Array.isArray(schema?.fields) ? schema.fields.map(mapSchemaField) : []
    };
  }
}

/**
 * @param {Record<string, unknown>} field
 * @returns {import('c/sharedModels').FieldModel}
 */
function mapSchemaField(field) {
  return {
    apiName: asString(field.apiName),
    label: asString(field.label) || asString(field.apiName),
    dataType: asString(field.dataType).toLowerCase() || 'string',
    required: asBoolean(field.required),
    nillable: asBoolean(field.nillable),
    createable: asBoolean(field.createable),
    updateable: asBoolean(field.updateable),
    inlineHelpText: asNullableString(field.inlineHelpText),
    precision: asNullableNumber(field.precision),
    scale: asNullableNumber(field.scale),
    digits: asNullableNumber(field.digits),
    picklistValues: mapPicklistValues(field.picklistValues),
    referenceTo: Array.isArray(field.referenceTo) ? field.referenceTo.map(String) : undefined,
    nameField: asBoolean(field.nameField),
    extraTypeInfo: asNullableString(field.extraTypeInfo)
  };
}

/**
 * @param {unknown} picklistValues
 * @returns {import('c/sharedModels').PicklistValueModel[] | undefined}
 */
function mapPicklistValues(picklistValues) {
  if (!Array.isArray(picklistValues)) {
    return undefined;
  }

  return picklistValues.map((entry) => ({
    label: asString(entry?.label),
    value: asString(entry?.value),
    active: asBoolean(entry?.active),
    defaultValue: asBoolean(entry?.defaultValue)
  }));
}

function asString(value) {
  return value == null ? '' : String(value);
}

function asNullableString(value) {
  return value == null || value === '' ? undefined : String(value);
}

function asNullableNumber(value) {
  if (value == null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function asBoolean(value) {
  return value === true || value === 'true' || value === 'TRUE';
}
