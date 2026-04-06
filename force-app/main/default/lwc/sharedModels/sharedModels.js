/**
 * Shared model helpers and typedefs for Salesforce and Pulsar runtimes.
 */

/**
 * @typedef {Object.<string, string | null>} RecordFields
 */

/**
 * @typedef {object} RecordModel
 * @property {string} id
 * @property {string} objectApiName
 * @property {RecordFields} fields
 */

/**
 * @typedef {object} PicklistValueModel
 * @property {string} label
 * @property {string} value
 * @property {boolean=} active
 * @property {boolean=} defaultValue
 */

/**
 * @typedef {object} FieldModel
 * @property {string} apiName
 * @property {string} label
 * @property {string} dataType
 * @property {boolean} required
 * @property {boolean} nillable
 * @property {boolean} createable
 * @property {boolean} updateable
 * @property {string=} inlineHelpText
 * @property {number=} precision
 * @property {number=} scale
 * @property {number=} digits
 * @property {PicklistValueModel[]=} picklistValues
 * @property {string[]=} referenceTo
 * @property {boolean=} nameField
 * @property {string=} extraTypeInfo
 */

/**
 * @typedef {object} LayoutComponentModel
 * @property {string} type
 * @property {string} value
 * @property {string=} fieldType
 * @property {number=} displayLines
 */

/**
 * @typedef {object} LayoutItemModel
 * @property {string=} label
 * @property {boolean=} required
 * @property {boolean=} editableForNew
 * @property {boolean=} editableForUpdate
 * @property {boolean=} placeholder
 * @property {LayoutComponentModel[]} components
 */

/**
 * @typedef {object} LayoutRowModel
 * @property {LayoutItemModel[]} items
 */

/**
 * @typedef {object} LayoutSectionModel
 * @property {string} heading
 * @property {LayoutRowModel[]} rows
 * @property {boolean=} collapsed
 * @property {number=} columns
 */

/**
 * @typedef {object} RelatedListModel
 * @property {string} apiName
 * @property {string} label
 * @property {string[]=} fields
 */

/**
 * @typedef {object} LayoutModel
 * @property {LayoutSectionModel[]} sections
 * @property {RelatedListModel[]=} relatedLists
 */

/**
 * @typedef {object} ListViewModel
 * @property {string} listViewId
 * @property {string=} label
 * @property {string[]} fields
 * @property {string[]} labels
 * @property {string=} whereClause
 * @property {unknown=} filters
 * @property {string=} orderBy
 */

/**
 * @typedef {object} ReferenceDisplayModel
 * @property {string} id
 * @property {string} objectApiName
 * @property {string} displayValue
 */

/**
 * @typedef {object} RuntimeCapabilities
 * @property {boolean} supportsOfflineCache
 * @property {boolean} supportsExplicitSync
 * @property {boolean} supportsNativeLookup
 * @property {boolean} supportsNativeNavigation
 * @property {boolean} supportsHostResizeMessaging
 */

/**
 * @typedef {object} QuerySpec
 * @property {string[]=} fields
 * @property {string=} where
 * @property {string=} orderBy
 * @property {number=} limit
 */

/**
 * @typedef {object} LayoutRequest
 * @property {string} objectApiName
 * @property {string=} mode
 * @property {string=} recordTypeId
 */

/**
 * @typedef {object} RecordFieldViewModel
 * @property {string} apiName
 * @property {string} label
 * @property {string} value
 * @property {boolean} isEmpty
 * @property {string} dataType
 * @property {boolean} required
 * @property {string=} inlineHelpText
 */

/**
 * @typedef {object} RecordDetailSectionViewModel
 * @property {string} heading
 * @property {{ key: string, fields: RecordFieldViewModel[] }[]} rows
 */

/**
 * @typedef {object} RecordDetailViewModel
 * @property {string} objectApiName
 * @property {string} recordId
 * @property {RecordDetailSectionViewModel[]} sections
 */

/**
 * @param {Partial<RuntimeCapabilities>=} overrides
 * @returns {RuntimeCapabilities}
 */
export function createRuntimeCapabilities(overrides = {}) {
  return {
    supportsOfflineCache: false,
    supportsExplicitSync: false,
    supportsNativeLookup: false,
    supportsNativeNavigation: false,
    supportsHostResizeMessaging: false,
    ...overrides
  };
}

/**
 * Pulsar values arrive as strings. The shared model keeps that contract stable.
 *
 * @param {string} objectApiName
 * @param {Record<string, unknown>} fields
 * @returns {RecordModel}
 */
export function normalizeRecord(objectApiName, fields) {
  const normalizedFields = {};

  for (const [key, value] of Object.entries(fields)) {
    normalizedFields[key] = normalizeScalar(value);
  }

  return {
    id: String(fields.Id ?? fields.id ?? ''),
    objectApiName,
    fields: normalizedFields
  };
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeScalar(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return String(value);
}

/**
 * @param {FieldModel[]} fields
 * @returns {Map<string, FieldModel>}
 */
export function indexFieldsByApiName(fields) {
  return new Map(fields.map((field) => [field.apiName, field]));
}
