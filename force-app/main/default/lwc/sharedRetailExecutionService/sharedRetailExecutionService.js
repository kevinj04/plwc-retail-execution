import { assertDataAdapter } from 'c/dataAdapter';
import { normalizeRetailExecutionVisit, normalizeUtcDateTimeString } from 'c/sharedModels';

/**
 * @typedef {import('c/dataAdapter').DataAdapter} DataAdapter
 * @typedef {import('c/sharedModels').FieldModel} FieldModel
 * @typedef {import('c/sharedModels').RetailExecutionStateModel} RetailExecutionStateModel
 * @typedef {import('c/sharedModels').RetailExecutionVisitModel} RetailExecutionVisitModel
 */

export const ACCOUNT_OBJECT_API_NAME = 'Account';
export const STORE_VISIT_OBJECT_API_NAME = 'Store_Visit__c';
export const STORE_VISIT_FIELD_NAMES = [
  'Id',
  'Name',
  'Account__c',
  'Check_In__c',
  'Check_Out__c',
  'Shelf_Condition__c',
  'Promotional_Display_Count__c',
  'Spoke_To_Manager__c'
];

/**
 * Shared runtime-neutral loader for the retail-execution workflow.
 *
 * @param {DataAdapter} adapter
 * @param {{ accountId: string }} input
 * @returns {Promise<RetailExecutionStateModel>}
 */
export async function loadRetailExecutionState(adapter, input) {
  assertDataAdapter(adapter);

  const accountId = input?.accountId ?? '';
  if (!accountId) {
    throw new Error('An accountId is required before loading retail execution.');
  }

  const [accountRecords, visitSchema, visitRecords] = await Promise.all([
    adapter.queryRecords(ACCOUNT_OBJECT_API_NAME, {
      fields: ['Id', 'Name'],
      filters: {
        Id: accountId
      },
      limit: 1
    }),
    adapter.getObjectSchema(STORE_VISIT_OBJECT_API_NAME),
    adapter.queryRecords(STORE_VISIT_OBJECT_API_NAME, {
      fields: STORE_VISIT_FIELD_NAMES,
      filters: {
        Account__c: accountId
      },
      orderBy: 'Check_In__c DESC',
      limit: 1
    })
  ]);

  return createRetailExecutionStateModel({
    accountId,
    accountName: accountRecords[0]?.fields?.Name ?? '',
    lastVisitRecord: visitRecords[0] ?? null,
    visitFields: visitSchema.fields
  });
}

/**
 * @param {{
 *   accountId: string,
 *   accountName?: string,
 *   lastVisitRecord?: import('c/sharedModels').RecordModel | null,
 *   draftVisit?: RetailExecutionVisitModel | null,
 *   visitFields?: FieldModel[]
 * }} input
 * @returns {RetailExecutionStateModel}
 */
export function createRetailExecutionStateModel(input) {
  const draftVisit = input.draftVisit ?? null;

  return {
    accountId: input.accountId,
    accountName: input.accountName ?? '',
    lastVisit: normalizeRetailExecutionVisit(input.lastVisitRecord ?? null),
    draftVisit,
    shelfConditionField: findField(input.visitFields, 'Shelf_Condition__c'),
    isCheckedIn: Boolean(draftVisit)
  };
}

/**
 * Creates the in-memory visit draft that the shared UI will edit before save.
 *
 * @param {string} accountId
 * @param {string=} checkedInAt
 * @returns {RetailExecutionVisitModel}
 */
export function createRetailExecutionDraft(accountId, checkedInAt = new Date().toISOString()) {
  if (!accountId) {
    throw new Error('An accountId is required before starting a retail visit draft.');
  }

  const normalizedCheckedInAt = requireUtcDateTimeString(checkedInAt, 'Retail visit check-in');

  return {
    id: null,
    accountId,
    name: null,
    checkInAt: normalizedCheckedInAt,
    checkOutAt: null,
    shelfCondition: null,
    promotionalDisplayCount: null,
    spokeToManager: false
  };
}

/**
 * @param {RetailExecutionVisitModel} draftVisit
 * @param {string} fieldName
 * @param {unknown} rawValue
 * @returns {RetailExecutionVisitModel}
 */
export function updateRetailExecutionDraft(draftVisit, fieldName, rawValue) {
  if (!draftVisit) {
    throw new Error('A retail visit draft is required before it can be updated.');
  }

  switch (fieldName) {
    case 'Shelf_Condition__c':
      return { ...draftVisit, shelfCondition: normalizeNullableString(rawValue) };
    case 'Promotional_Display_Count__c':
      return { ...draftVisit, promotionalDisplayCount: normalizeDraftNumber(rawValue) };
    case 'Spoke_To_Manager__c':
      return { ...draftVisit, spokeToManager: Boolean(rawValue) };
    case 'Check_In__c':
      return { ...draftVisit, checkInAt: requireUtcDateTimeString(rawValue, 'Retail visit check-in') };
    case 'Check_Out__c':
      return { ...draftVisit, checkOutAt: requireUtcDateTimeString(rawValue, 'Retail visit check-out') };
    case 'Name':
      return { ...draftVisit, name: normalizeNullableString(rawValue) };
    default:
      throw new Error(`Retail execution does not support updating field ${fieldName}.`);
  }
}

/**
 * @param {DataAdapter} adapter
 * @param {RetailExecutionVisitModel} draftVisit
 * @param {string=} checkedOutAt
 * @returns {Promise<RetailExecutionVisitModel>}
 */
export async function saveRetailExecutionDraft(adapter, draftVisit, checkedOutAt = new Date().toISOString()) {
  assertDataAdapter(adapter);

  if (!draftVisit) {
    throw new Error('A retail visit draft is required before save.');
  }

  if (!draftVisit.accountId) {
    throw new Error('A retail visit draft must include an accountId before save.');
  }

  const normalizedCheckInAt = requireUtcDateTimeString(draftVisit.checkInAt, 'Retail visit check-in');
  const normalizedCheckedOutAt = requireUtcDateTimeString(checkedOutAt, 'Retail visit check-out');

  const fields = {
    Account__c: draftVisit.accountId,
    Check_In__c: normalizedCheckInAt,
    Check_Out__c: normalizedCheckedOutAt,
    Shelf_Condition__c: draftVisit.shelfCondition,
    Promotional_Display_Count__c: draftVisit.promotionalDisplayCount,
    Spoke_To_Manager__c: draftVisit.spokeToManager
  };

  const id = await adapter.createRecord(STORE_VISIT_OBJECT_API_NAME, fields);

  return {
    ...draftVisit,
    id,
    checkInAt: normalizedCheckInAt,
    checkOutAt: normalizedCheckedOutAt
  };
}

/**
 * @param {FieldModel[] | undefined} fields
 * @param {string} apiName
 * @returns {FieldModel | null}
 */
function findField(fields, apiName) {
  if (!Array.isArray(fields)) {
    return null;
  }

  return fields.find((field) => field.apiName === apiName) ?? null;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeNullableString(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value);
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {string}
 */
function requireUtcDateTimeString(value, label) {
  const normalizedValue = normalizeUtcDateTimeString(value);
  if (!normalizedValue) {
    throw new Error(`${label} is required.`);
  }

  return normalizedValue;
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function normalizeDraftNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}
