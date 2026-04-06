# Field Service Relationships

## ServiceAppointment
The `ParentRecordType` property will contain the `objectType` referenced by the `ParentRecordId`.

| Field        | ReferenceTo                          |
| ------------ | ------------------------------------ |
| OwnerId      | Group, User                          |
| RecordTypeId | RecordType                           |
| CreatedById  | User                                 |
| LastModifiedById | User                             |
| ParentRecordId | | Account, Asset, Case, Lead, Opportunity, WorkOrder, WorkOrderLineItem |
| AccountId    | Account                              |
| WorkTypeId   | WorkType                             |
| ContactId    | Contact                              |
| ServiceTerritoryId | ServiceTerritory               |
| RelatedBundleId | ServiceAppointment                |
| BundlePolicyId    | ApptBundlePolicy                |

## WorkOrder
| Field        | ReferenceTo                          |
| ------------ | ------------------------------------ |
| OwnerId      | Group, User                          |
| CreatedById  | User                                 |
| LastModifiedById | User                             |
| AccountId    | Account                              |
| ContactId    | Contact                              |
| CaseId       | Case                                 |
| EntitlementId | Entitlement                         |
| ServiceContractId | ServiceContract                 |
| AssetId       | Asset                               |
| RootWorkOrderId | WorkOrder                         |
| Pricebook2Id   | Pricebook2                         |
| ParentWorkOrderId | WorkOrder                       |
| BusinessHoursId    | BusinessHours                  |
| ServiceTerritoryId | ServiceTerritory               |
| LocationId    | Location                            |
| MaintenancePlanId | MaintenancePlan                 |
| ServiceReportTemplateId    | ServiceReportTemplate  |
| ReturnOrderLineItemId    | ReturnOrderLineItem      |
| ReturnOrderId    | ReturnOrder                      |

## WorkOrderLineItem
| Field        | ReferenceTo                          |
| ------------ | ------------------------------------ |
| CreatedById  | User                                 |
| LastModifiedById | User |
| WorkOrderId | WorkOrder |
| ParentWorkOrderLineItemId | WorkOrderLineItem |
| ParentRecordId | Account, Asset, Case, Lead, Opportunity, WorkOrder, WorkOrderLineItem |
| Product2Id | Product2 |
| AssetId | Asset |
| OrderId | Order |
| RootWorkOrderLineItemId | WorkOrderLineItem |
| PricebookEntryId | PricebookEntry |
| WorkTypeId   | WorkType                             |
| ServiceTerritoryId | ServiceTerritory               |
| LocationId    | Location                            |
| ServiceReportTemplateId    | ServiceReportTemplate  |
| ReturnOrderLineItemId    | ReturnOrderLineItem      |
| ReturnOrderId    | ReturnOrder                      |

## AssignedResource
| Field        | ReferenceTo                          |
| ------------ | ------------------------------------ |
| CreatedById  | User                                 |
| LastModifiedById | User                             |
| ServiceAppointmentId | ServiceAppointment           |

## ServiceResource
| Field        | ReferenceTo                          |
| ------------ | ------------------------------------ |
| OwnerId      | Group, User                          |
| CreatedById  | User                                 |
| LastModifiedById | User                             |
| RelatedRecordId | User                              |
| LocationId    | Location |
| ServiceCrewId    | ServiceCrew |

## User
| Field        | ReferenceTo                          |
| ------------ | ------------------------------------ |
| UserRoleId   | UserRole                             |
| ProfileId    | Profile                              |
| DelegateApproverId | Group, User                    |
| ManagerId | User |
| CreatedById  | User                                 |
| LastModifiedById | User                             |
| ContactId    | Contact                              |
| AccountId    | Account                              |
| CallCenterId | CallCenter                           |
| IndividualId | Individual                           |
