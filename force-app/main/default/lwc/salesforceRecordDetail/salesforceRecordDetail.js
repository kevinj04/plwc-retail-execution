import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getLayout } from 'lightning/uiLayoutApi';
import { createRecordDetailViewModel } from 'c/sharedRecordService';

export default class SalesforceRecordDetail extends LightningElement {
  @api recordId;
  @api objectApiName;
  @api title = 'Pulsar Record Detail';

  sections = [];
  errorMessage = '';
  isLoading = true;

  _objectInfoData;
  _layoutData;
  _recordData;
  _recordTypeId;
  _objectInfoWire;
  _layoutWire;
  _recordWire;

  @wire(getObjectInfo, { objectApiName: '$objectApiName' })
  wiredObjectInfo(value) {
    this._objectInfoWire = value;

    if (value.data) {
      this._objectInfoData = value.data;
    } else if (value.error) {
      this.errorMessage = normalizeWireError(value.error);
    }

    this.updateViewState();
  }

  @wire(getRecord, {
    recordId: '$recordId',
    fields: '$recordTypeFields'
  })
  wiredRecordType(value) {
    if (value.data) {
      this._recordTypeId = readRecordFieldValue(value.data, 'RecordTypeId');
    } else if (value.error) {
      this.errorMessage = normalizeWireError(value.error);
    }

    this.updateViewState();
  }

  @wire(getLayout, {
    objectApiName: '$objectApiName',
    layoutType: 'Full',
    mode: 'View',
    recordTypeId: '$effectiveRecordTypeId'
  })
  wiredLayout(value) {
    this._layoutWire = value;

    if (value.data) {
      this._layoutData = value.data;
    } else if (value.error) {
      this.errorMessage = normalizeWireError(value.error);
    }

    this.updateViewState();
  }

  @wire(getRecord, {
    recordId: '$recordId',
    fields: '$requiredRecordFields',
    optionalFields: '$optionalRecordFields'
  })
  wiredRecord(value) {
    this._recordWire = value;

    if (value.data) {
      this._recordData = value.data;
    } else if (value.error) {
      this.errorMessage = normalizeWireError(value.error);
    }

    this.updateViewState();
  }

  get recordTypeFields() {
    if (!this.objectApiName || !this.recordId) {
      return undefined;
    }

    return [`${this.objectApiName}.RecordTypeId`];
  }

  get effectiveRecordTypeId() {
    return this._recordTypeId || this._objectInfoData?.defaultRecordTypeId;
  }

  get requiredRecordFields() {
    if (!this.objectApiName || !this.recordId) {
      return undefined;
    }

    return [`${this.objectApiName}.Id`];
  }

  get optionalRecordFields() {
    if (!this.objectApiName || !this.recordId || !this._layoutData) {
      return undefined;
    }

    return extractLayoutFieldNames(this._layoutData, this.objectApiName)
      .filter((fieldName) => fieldName !== `${this.objectApiName}.Id`);
  }

  @api
  async refresh() {
    await Promise.all([
      this._recordWire ? refreshApex(this._recordWire) : undefined,
      this._layoutWire ? refreshApex(this._layoutWire) : undefined,
      this._objectInfoWire ? refreshApex(this._objectInfoWire) : undefined
    ].filter(Boolean));
  }

  updateViewState() {
    if (this.errorMessage) {
      this.sections = [];
      this.isLoading = false;
      return;
    }

    if (!this._objectInfoData || !this._layoutData || !this._recordData) {
      this.isLoading = true;
      return;
    }

    try {
      // Salesforce acts as a host runtime here: it maps UI API responses into the same
      // shared models consumed by the neutral record-detail view.
      const schemaFields = Object.values(this._objectInfoData.fields || {}).map(mapObjectInfoField);
      const record = {
        id: this.recordId,
        objectApiName: this.objectApiName,
        fields: mapRecordFields(this._recordData.fields || {})
      };
      const layout = mapUiApiLayout(this._layoutData);
      const detail = createRecordDetailViewModel(this.objectApiName, record, schemaFields, layout);

      this.sections = detail.sections;
      this.errorMessage = '';
      this.isLoading = false;
    } catch (error) {
      this.sections = [];
      this.errorMessage = error instanceof Error ? error.message : 'Unexpected Salesforce record detail error.';
      this.isLoading = false;
    }
  }
}

function extractLayoutFieldNames(layoutData, objectApiName) {
  const names = new Set();
  const sections = Array.isArray(layoutData?.sections) ? layoutData.sections : [];

  for (const section of sections) {
    const rows = Array.isArray(section?.layoutRows) ? section.layoutRows : [];

    for (const row of rows) {
      const items = Array.isArray(row?.layoutItems) ? row.layoutItems : [];

      for (const item of items) {
        const components = Array.isArray(item?.layoutComponents) ? item.layoutComponents : [];

        for (const component of components) {
          const apiName = component?.apiName || component?.value || component?.details?.apiName;
          if (apiName) {
            names.add(apiName.includes('.') ? apiName : `${objectApiName}.${apiName}`);
          }
        }
      }
    }
  }

  return Array.from(names);
}

function mapRecordFields(fields) {
  const normalized = {};

  for (const [apiName, field] of Object.entries(fields)) {
    normalized[apiName] = field?.displayValue ?? field?.value ?? null;
  }

  return normalized;
}

function readRecordFieldValue(record, apiName) {
  return record?.fields?.[apiName]?.value ?? null;
}

function mapObjectInfoField(field) {
  return {
    apiName: asString(field.apiName),
    label: asString(field.label) || asString(field.apiName),
    dataType: asString(field.dataType).toLowerCase() || 'string',
    required: asBoolean(field.required),
    nillable: !asBoolean(field.required),
    createable: asBoolean(field.createable),
    updateable: asBoolean(field.updateable),
    inlineHelpText: asNullableString(field.inlineHelpText),
    precision: asNullableNumber(field.precision),
    scale: asNullableNumber(field.scale),
    digits: asNullableNumber(field.digits),
    picklistValues: mapPicklistValues(field.picklistValues),
    referenceTo: Array.isArray(field.referenceToInfos)
      ? field.referenceToInfos.map((entry) => asString(entry.apiName)).filter(Boolean)
      : undefined,
    nameField: asBoolean(field.nameField),
    extraTypeInfo: asNullableString(field.extraTypeInfo)
  };
}

function mapUiApiLayout(layout) {
  const sections = Array.isArray(layout?.sections) ? layout.sections.map(mapLayoutSection) : [];

  return { sections };
}

function mapLayoutSection(section) {
  const rows = Array.isArray(section?.layoutRows) ? section.layoutRows : [];

  return {
    heading: asString(section.heading) || 'Details',
    rows: rows.map(mapLayoutRow),
    collapsed: asBoolean(section.collapsed),
    columns: asNullableNumber(section.columns) ?? getSectionColumnCount(rows)
  };
}

function getSectionColumnCount(rows) {
  const firstRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  const items = Array.isArray(firstRow?.layoutItems) ? firstRow.layoutItems : [];
  return items.length > 0 ? items.length : undefined;
}

function mapLayoutRow(row) {
  const items = Array.isArray(row?.layoutItems) ? row.layoutItems : [];

  return {
    items: items.map(mapLayoutItem)
  };
}

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

function mapLayoutComponent(component) {
  const details = component?.details && typeof component.details === 'object'
    ? component.details
    : null;

  return {
    type: normalizeLayoutComponentType(component.componentType || component.type),
    value: asString(component.apiName) || asString(component.value) || asString(details?.apiName),
    fieldType: asNullableString(details?.dataType) || asNullableString(details?.type),
    displayLines: asNullableNumber(component.displayLines)
  };
}

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

function normalizeLayoutComponentType(value) {
  const normalized = asString(value).toLowerCase();
  if (normalized.includes('field')) {
    return 'field';
  }
  return normalized || 'field';
}

function normalizeWireError(error) {
  const body = error?.body;

  if (Array.isArray(body)) {
    return body.map((entry) => entry?.message).filter(Boolean).join('; ') || 'Unexpected Salesforce error.';
  }

  if (body?.message) {
    return body.message;
  }

  return error?.message || 'Unexpected Salesforce error.';
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
