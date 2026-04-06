import { assertDataAdapter } from 'c/dataAdapter';
import { indexFieldsByApiName } from 'c/sharedModels';

/**
 * @typedef {import('c/dataAdapter').DataAdapter} DataAdapter
 * @typedef {import('c/sharedModels').FieldModel} FieldModel
 * @typedef {import('c/sharedModels').LayoutModel} LayoutModel
 * @typedef {import('c/sharedModels').RecordDetailViewModel} RecordDetailViewModel
 * @typedef {import('c/sharedModels').RecordFieldViewModel} RecordFieldViewModel
 * @typedef {import('c/sharedModels').RecordModel} RecordModel
 */

/**
 * Loads normalized record detail data from a runtime adapter and maps it into a metadata-driven view model.
 *
 * @param {DataAdapter} adapter
 * @param {string} objectApiName
 * @param {string} recordId
 * @returns {Promise<RecordDetailViewModel>}
 */
export async function loadRecordDetail(adapter, objectApiName, recordId) {
  assertDataAdapter(adapter);

  const record = await adapter.loadRecord(objectApiName, recordId);

  if (!record) {
    throw new Error(`Record ${objectApiName}:${recordId} was not found.`);
  }

  const recordTypeId = record.fields.RecordTypeId ?? null;
  console.log('[loadRecordDetail] recordTypeId', {
    objectApiName,
    recordId,
    recordTypeId,
    fieldKeys: Object.keys(record.fields)
  });

  const [schema, layout] = await Promise.all([
    adapter.getObjectSchema(objectApiName),
    adapter.getLayout({
      objectApiName,
      mode: 'view',
      recordTypeId
    })
  ]);

  const fieldIndex = indexFieldsByApiName(schema.fields);
  return createRecordDetailViewModel(objectApiName, record, fieldIndex, layout);
}

/**
 * @param {string} objectApiName
 * @param {RecordModel} record
 * @param {Map<string, FieldModel> | FieldModel[]} fieldIndexOrFields
 * @param {LayoutModel} layout
 * @returns {RecordDetailViewModel}
 */
export function createRecordDetailViewModel(objectApiName, record, fieldIndexOrFields, layout) {
  const fieldIndex = fieldIndexOrFields instanceof Map
    ? fieldIndexOrFields
    : indexFieldsByApiName(fieldIndexOrFields);
  const sections = createSections(layout, fieldIndex, record);

  return {
    objectApiName,
    recordId: record.id,
    sections
  };
}

/**
 * @param {LayoutModel} layout
 * @param {Map<string, FieldModel>} fieldIndex
 * @param {RecordModel} record
 * @returns {import('c/sharedModels').RecordDetailSectionViewModel[]}
 */
function createSections(layout, fieldIndex, record) {
  if (!layout.sections.length) {
    return [
      {
        heading: 'Details',
        rows: createFallbackRows(fieldIndex, record)
      }
    ];
  }

  return layout.sections.map((section) => ({
    heading: section.heading || 'Details',
    rows: section.rows
      .map((row, rowIndex) => ({
        key: `${section.heading || 'Details'}-${rowIndex}`,
        fields: row.items
        .filter((item) => !item.placeholder)
        .map((item) => {
          const component = item.components.find((candidate) => candidate.value in record.fields);
          if (!component) {
            return null;
          }

          const field = fieldIndex.get(component.value);
          return createFieldViewModel(field, component.value, record.fields[component.value]);
        })
        .filter(Boolean)
      }))
      .filter((row) => row.fields.length > 0)
  }));
}

/**
 * @param {Map<string, FieldModel>} fieldIndex
 * @param {RecordModel} record
 * @returns {{ key: string, fields: RecordFieldViewModel[] }[]}
 */
function createFallbackRows(fieldIndex, record) {
  return Array.from(fieldIndex.values())
    .filter((field) => shouldDisplayField(field.apiName, field))
    .map((field) => ({
      key: field.apiName,
      fields: [createFieldViewModel(field, field.apiName, record.fields[field.apiName])]
    }));
}

/**
 * @param {FieldModel | undefined} field
 * @param {string} apiName
 * @param {string | null | undefined} rawValue
 * @returns {RecordFieldViewModel}
 */
function createFieldViewModel(field, apiName, rawValue) {
  const value = rawValue ?? '';

  return {
    apiName,
    label: field?.label ?? apiName,
    value,
    isEmpty: value === '',
    dataType: field?.dataType ?? 'string',
    required: Boolean(field?.required),
    inlineHelpText: field?.inlineHelpText
  };
}

/**
 * @param {string} apiName
 * @param {FieldModel} field
 * @returns {boolean}
 */
function shouldDisplayField(apiName, field) {
  if (apiName === 'Id') {
    return false;
  }

  return field.dataType !== 'base64';
}
