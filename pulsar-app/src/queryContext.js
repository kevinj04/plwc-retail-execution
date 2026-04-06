/**
 * @typedef {object} PulsarLaunchContext
 * @property {string} recordId
 * @property {string} objectApiName
 * @property {string} parentId
 * @property {string} parentType
 * @property {string} serviceAppointmentId
 * @property {string} documentId
 */

/**
 * Parse Pulsar/FSL launch context from URL query parameters.
 *
 * @param {string} search
 * @returns {PulsarLaunchContext}
 */
export function parseLaunchContext(search) {
  const params = new URLSearchParams(search);
  const getFirst = (...names) => {
    for (const name of names) {
      const value = params.get(name);
      if (value) {
        return value;
      }
    }

    return '';
  };

  return {
    recordId: getFirst('ObjectId', 'objectId', 'id'),
    objectApiName: getFirst('ObjectType', 'objectType'),
    parentId: getFirst('ParentId', 'parentId'),
    parentType: getFirst('ParentType', 'parentType'),
    serviceAppointmentId: getFirst('ServiceAppointmentId', 'saId'),
    documentId: getFirst('DocumentId', 'docId')
  };
}
