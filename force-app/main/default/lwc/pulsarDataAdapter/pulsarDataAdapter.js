import { DataAdapter } from 'c/dataAdapter';
import { createRuntimeCapabilities, normalizeRecord } from 'c/sharedModels';

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

/**
 * Pulsar SDK-backed adapter scaffold.
 * Runtime-specific API integration should be filled in behind this class.
 */
export class PulsarDataAdapter extends DataAdapter {
  /**
   * @param {{ sdk?: unknown }} input
   */
  constructor(input = {}) {
    super();
    this.sdk = input.sdk;
    this.initPromise = null;
  }

  async getRuntime() {
    return 'pulsar';
  }

  /**
   * @param {string} objectApiName
   * @param {string} id
   * @returns {Promise<import('c/sharedModels').RecordModel | null>}
   */
  async loadRecord(objectApiName, id) {
    const sdk = await this.ensureReady();

    if (!sdk?.read) {
      throw new Error('Pulsar SDK read() is not available.');
    }

    const rows = await sdk.read(objectApiName, { Id: id });
    return rows?.[0] ? normalizeRecord(objectApiName, withCompoundFieldValues(rows[0])) : null;
  }

  async queryRecords() {
    throw new Error('PulsarDataAdapter.queryRecords() is not implemented yet.');
  }

  async createRecord() {
    throw new Error('PulsarDataAdapter.createRecord() is not implemented yet.');
  }

  async updateRecord() {
    throw new Error('PulsarDataAdapter.updateRecord() is not implemented yet.');
  }

  async deleteRecord() {
    throw new Error('PulsarDataAdapter.deleteRecord() is not implemented yet.');
  }

  /**
   * @param {string} objectApiName
   * @returns {Promise<{ fields: import('c/sharedModels').FieldModel[] }>}
   */
  async getObjectSchema(objectApiName) {
    const sdk = await this.ensureReady();

    if (!sdk?.getSObjectSchema) {
      throw new Error('Pulsar SDK getSObjectSchema() is not available.');
    }

    const schema = await sdk.getSObjectSchema(objectApiName);
    return {
      fields: Array.isArray(schema?.fields) ? schema.fields.map(mapSchemaField) : []
    };
  }

  /**
   * @param {import('c/sharedModels').LayoutRequest} input
   * @returns {Promise<import('c/sharedModels').LayoutModel>}
   */
  async getLayout(input) {
    const sdk = await this.ensureReady();
    const effectiveRecordTypeId = input.recordTypeId || MASTER_RECORD_TYPE_ID;

    if (!sdk?.getLayout) {
      console.log('[PulsarDataAdapter] sdk.getLayout unavailable', { input });
      return { sections: [] };
    }

    if (!input.recordTypeId) {
      console.log('[PulsarDataAdapter] missing recordTypeId, using master record type', {
        input,
        effectiveRecordTypeId
      });
    }

    const describeLayout = await sdk.getLayout(input.objectApiName, effectiveRecordTypeId);
    console.log('[PulsarDataAdapter] layout response', {
      objectApiName: input.objectApiName,
      recordTypeId: effectiveRecordTypeId,
      detailLayoutSections: describeLayout?.detailLayoutSections?.length ?? 0,
      editLayoutSections: describeLayout?.editLayoutSections?.length ?? 0,
      raw: describeLayout
    });
    return mapDescribeLayout(describeLayout, input.mode);
  }

  async getListViewInfo() {
    throw new Error('PulsarDataAdapter.getListViewInfo() is not implemented yet.');
  }

  async getListViewMetadata() {
    throw new Error('PulsarDataAdapter.getListViewMetadata() is not implemented yet.');
  }

  async resolveReferenceDisplay() {
    return null;
  }

  async getCapabilities() {
    const sdk = await this.ensureReady();

    if (typeof sdk?.getPlatformFeatures !== 'function') {
      return createRuntimeCapabilities({
        supportsOfflineCache: true,
        supportsExplicitSync: true,
        supportsHostResizeMessaging: true
      });
    }

    const features = await sdk.getPlatformFeatures();
    return createRuntimeCapabilities({
      supportsOfflineCache: true,
      supportsExplicitSync: typeof sdk.syncData === 'function',
      supportsHostResizeMessaging: true,
      supportsNativeLookup: typeof sdk.lookupObject === 'function',
      supportsNativeNavigation: false
    });
  }

  /**
   * @returns {Promise<unknown>}
   */
  async ensureReady() {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        if (!this.sdk) {
          throw new Error('Pulsar SDK has not been supplied to the adapter.');
        }

        return this.sdk;
      })();
    }

    return this.initPromise;
  }
}

/**
 * @param {Record<string, unknown>} field
 * @returns {import('c/sharedModels').FieldModel}
 */
function mapSchemaField(field) {
  return {
    apiName: asString(field.name),
    label: asString(field.label) || asString(field.name),
    dataType: asString(field.type).toLowerCase() || 'string',
    required: !asBoolean(field.nillable) && !asBoolean(field.defaultedOnCreate),
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
    extraTypeInfo: asNullableString(field.extraTypeInfo) || asNullableString(field.soapType)
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

/**
 * @param {Record<string, unknown>} describeLayout
 * @param {string | undefined} mode
 * @returns {import('c/sharedModels').LayoutModel}
 */
function mapDescribeLayout(describeLayout, mode) {
  const sourceSections = mode === 'edit'
    ? describeLayout?.editLayoutSections
    : describeLayout?.detailLayoutSections;

  return {
    sections: Array.isArray(sourceSections) ? sourceSections.map(mapLayoutSection) : []
  };
}

/**
 * @param {Record<string, unknown>} section
 * @returns {import('c/sharedModels').LayoutSectionModel}
 */
function mapLayoutSection(section) {
  const rows = Array.isArray(section?.layoutRows) ? section.layoutRows : [];

  return {
    heading: asString(section.heading),
    rows: rows.map(mapLayoutRow),
    collapsed: asBoolean(section.collapsed),
    columns: asNullableNumber(section.columns) ?? getSectionColumnCount(rows)
  };
}

/**
 * @param {unknown[]} rows
 * @returns {number | undefined}
 */
function getSectionColumnCount(rows) {
  const firstRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  const items = Array.isArray(firstRow?.layoutItems) ? firstRow.layoutItems : [];
  return items.length > 0 ? items.length : undefined;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {import('c/sharedModels').LayoutRowModel}
 */
function mapLayoutRow(row) {
  const items = Array.isArray(row?.layoutItems) ? row.layoutItems : [];
  return {
    items: items.map(mapLayoutItem)
  };
}

/**
 * @param {Record<string, unknown>} item
 * @returns {import('c/sharedModels').LayoutItemModel}
 */
function mapLayoutItem(item) {
  const components = Array.isArray(item?.layoutComponents) ? item.layoutComponents : [];

  return {
    label: asNullableString(item.label),
    required: asBoolean(item.required),
    editableForNew: asBoolean(item.editableForNew),
    editableForUpdate: asBoolean(item.editableForUpdate),
    placeholder: asBoolean(item.placeholder),
    components: components.map(mapLayoutComponent)
  };
}

/**
 * @param {Record<string, unknown>} component
 * @returns {import('c/sharedModels').LayoutComponentModel}
 */
function mapLayoutComponent(component) {
  const details = component?.details && typeof component.details === 'object'
    ? component.details
    : null;

  return {
    type: normalizeLayoutComponentType(component.type),
    value: asString(component.value) || asString(details?.name),
    fieldType: asNullableString(details?.type) || asNullableString(component.type),
    displayLines: asNullableNumber(component.displayLines)
  };
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeLayoutComponentType(value) {
  const normalized = asString(value).toLowerCase();
  if (normalized === 'field') {
    return 'field';
  }
  return normalized || 'field';
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function asString(value) {
  return value == null ? '' : String(value);
}

/**
 * @param {unknown} value
 * @returns {string | undefined}
 */
function asNullableString(value) {
  return value == null || value === '' ? undefined : String(value);
}

/**
 * @param {unknown} value
 * @returns {number | undefined}
 */
function asNullableNumber(value) {
  if (value == null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function asBoolean(value) {
  return value === true || value === 'true' || value === 'TRUE';
}

/**
 * @param {Record<string, unknown>} fields
 * @returns {Record<string, unknown>}
 */
function withCompoundFieldValues(fields) {
  const normalized = { ...fields };

  applyAddressCompound(normalized, 'Billing');
  applyAddressCompound(normalized, 'Shipping');
  applyAddressCompound(normalized, 'Mailing');
  applyAddressCompound(normalized, 'Other');

  return normalized;
}

/**
 * @param {Record<string, unknown>} fields
 * @param {string} prefix
 */
function applyAddressCompound(fields, prefix) {
  const compoundFieldName = `${prefix}Address`;
  if (fields[compoundFieldName]) {
    return;
  }

  const street = asNullableString(fields[`${prefix}Street`]);
  const city = asNullableString(fields[`${prefix}City`]);
  const state = asNullableString(fields[`${prefix}State`]);
  const postalCode = asNullableString(fields[`${prefix}PostalCode`]);
  const country = asNullableString(fields[`${prefix}Country`]);

  const localityLine = [city, state, postalCode].filter(Boolean).join(', ');
  const compoundValue = [street, localityLine, country].filter(Boolean).join('\n');

  if (compoundValue) {
    fields[compoundFieldName] = compoundValue;
  }
}
