# RFC: Pulsar Lightning Web Component (Pulsar LWC)

## Status
Draft

## Summary
Pulsar LWC is a Salesforce-platform-compatible Lightning Web Component architecture that allows a single UI implementation to run in both Salesforce and Pulsar runtimes. The component will share:

- a common UI layer,
- a common service layer,
- and a common set of data models,

while delegating runtime-specific data access to either a Salesforce Data Adapter or a Pulsar Data Adapter.

The initial scope targets three functional areas:

- record detail,
- record editing,
- and lists.

The UI should mimic standard Salesforce behavior as closely as practical, with layout, schema, field rendering, and list presentation driven by shared metadata-oriented models.

## Problem Statement
We want to build components that can be deployed in two environments:

1. on the Salesforce platform as standard-compatible LWC-based components, and
2. inside Pulsar apps, where the same component should operate against Pulsar-backed data access.

Today, runtime-specific assumptions tend to leak into UI code. That creates duplicate implementations, drift in behavior, and unnecessary friction when supporting both environments.

The goal of this RFC is to define a scaffold that isolates those runtime concerns behind adapters while keeping the UI and core service logic shared.

## Goals

### Primary Goals
- Provide one shared UI implementation for Salesforce and Pulsar runtimes.
- Provide one shared service/domain layer for record detail, edit, and list use cases.
- Define a shared data model that normalizes runtime-specific responses.
- Mimic Salesforce UI behavior as closely as practical.
- Use metadata-driven rendering so components remain portable and configuration-friendly.
- Support deployment to Salesforce and use inside Pulsar apps without changing the component UI.

### Non-Goals
- Full parity with every native Salesforce LWC platform capability in the initial scaffold.
- Full abstraction of every runtime difference.
- Direct Pulsar SDK usage from shared UI code.
- Support for every Salesforce object, field behavior, or advanced interaction in the first milestone.

## Background and Constraints
Pulsar provides a promise-based SDK for Salesforce data and platform services, including CRUD operations, layout metadata, schema metadata, listview metadata, related lists, sync operations, and runtime/platform features. It supports both embedded and native contexts, but requires explicit initialization via `new Pulsar()` and `await init()` before using SDK methods. Initialization should occur early and be wrapped in an async IIFE to avoid blocking bridge setup.

Pulsar also stores local data in SQLite and returns values as strings. Queries for `select()` are SQLite queries, and unconstrained `read()` calls are discouraged. `read()` should be used with filters; broader querying should use `select()`.

These runtime characteristics make a shared model layer essential if we want a stable UI contract across both runtimes.

## Proposal

### High-Level Architecture

```text
[ Shared UI Components ]
          |
          v
[ Shared Service / Domain Layer ]
          |
          v
[ Runtime Adapter Interface ]
    /                     \
   v                       v
[ Salesforce Adapter ]   [ Pulsar Adapter ]
```

The architecture splits responsibilities as follows.

### Shared UI Layer
The UI layer renders record detail, edit, and list experiences using only shared service APIs and shared view/data models. It must not depend directly on runtime-specific APIs.

The design intent is to mimic Salesforce UI behavior as closely as practical. That means:
- field labels, required state, help text, and editability should come from metadata,
- sections and field placement should follow layout metadata where available,
- list columns should follow list metadata,
- display formatting should be schema-aware.

For Pulsar specifically, field display and edit behavior should follow SObject schema metadata, and object layouts should be used to determine how records and related content are displayed. fileciteturn1file8 fileciteturn1file1

### Shared Service / Domain Layer
The shared service layer provides runtime-neutral use cases such as:
- loading record detail,
- loading layout metadata,
- loading editable field metadata,
- saving changes,
- loading list definitions,
- querying list rows,
- resolving reference display values,
- exposing runtime capabilities.

This layer converts adapter responses into shared models and is the main contract consumed by the UI layer.

### Runtime Adapter Layer
Each adapter implements the same interface while using runtime-specific primitives internally.

- The Salesforce adapter will use Salesforce-runtime mechanisms.
- The Pulsar adapter will use documented Pulsar SDK methods only, such as `read`, `select`, `create`, `update`, `delete`, `getLayout`, `getLayoutFields`, `getLayoutSections`, `getCompactLayoutFields`, `getSObjectSchema`, `listviewInfo`, and `listviewMetadata`. 

## Shared Data Model
The initial shared data model explicitly targets record detail, editing, and lists.

### 1. Record Model
A normalized record shape used by both detail and edit experiences.

```ts
interface RecordModel {
  id: string;
  objectApiName: string;
  fields: Record<string, string | null>;
}
```

For Pulsar, normalization is required because returned values are strings and data is stored in SQLite. fileciteturn1file8 fileciteturn1file13

### 2. Field Model
A shared model for field metadata and rendering behavior.

```ts
interface FieldModel {
  apiName: string;
  label: string;
  dataType: string;
  required: boolean;
  nillable: boolean;
  createable: boolean;
  updateable: boolean;
  inlineHelpText?: string;
  precision?: number;
  scale?: number;
  digits?: number;
  picklistValues?: Array<{ label: string; value: string; active?: boolean; defaultValue?: boolean }>;
  referenceTo?: string[];
  nameField?: boolean;
  extraTypeInfo?: string;
}
```

This model should be rich enough to drive a Salesforce-like renderer for display and edit modes. Pulsar’s notes explicitly call for formatting and editing behavior to follow the schema for types such as string, textarea, double, int, picklist, boolean, date, datetime, reference, currency, percent, phone, url, email, and multipicklist. fileciteturn1file8

### 3. Layout Model
A shared model for page structure.

```ts
interface LayoutModel {
  sections: LayoutSectionModel[];
  relatedLists?: RelatedListModel[];
}

interface LayoutSectionModel {
  heading: string;
  rows: LayoutRowModel[];
  collapsed?: boolean;
  columns?: number;
}

interface LayoutRowModel {
  items: LayoutItemModel[];
}

interface LayoutItemModel {
  label?: string;
  required?: boolean;
  editableForNew?: boolean;
  editableForUpdate?: boolean;
  placeholder?: boolean;
  components: LayoutComponentModel[];
}

interface LayoutComponentModel {
  type: string;
  value: string;
  fieldType?: string;
  displayLines?: number;
}
```

Pulsar’s `getLayout()` returns full layout metadata, including detail sections, edit sections, quick actions, related content, and related lists. Lighter helpers also exist for sections and fields. fileciteturn1file1 fileciteturn1file0

### 4. List View Model
A shared model for list definitions.

```ts
interface ListViewModel {
  listViewId: string;
  label?: string;
  fields: string[];
  labels: string[];
  whereClause?: string;
  filters?: unknown;
  orderBy?: string;
}
```

In Pulsar, `listviewMetadata()` returns the display metadata for the listview and the field data associated with display configuration, but it does not contain row field values. The rules explicitly warn that `fields` and `labels` describe columns to display and do not themselves provide record data. 

### 5. Reference Display Model
A shared model for showing reference-field labels.

```ts
interface ReferenceDisplayModel {
  id: string;
  objectApiName: string;
  displayValue: string;
}
```

This model is important because reference rendering in Pulsar must be performed explicitly via schema-aware lookup and follow-up record resolution. fileciteturn1file8

### 6. Runtime Capabilities Model
A shared capability contract allows the UI and services to degrade gracefully.

```ts
interface RuntimeCapabilities {
  supportsOfflineCache: boolean;
  supportsExplicitSync: boolean;
  supportsNativeLookup: boolean;
  supportsNativeNavigation: boolean;
  supportsHostResizeMessaging: boolean;
}
```

## Adapter Interface
A first-pass shared contract is below.

```ts
interface DataAdapter {
  getRuntime(): Promise<'salesforce' | 'pulsar'>;

  loadRecord(objectApiName: string, id: string): Promise<RecordModel | null>;
  queryRecords(objectApiName: string, querySpec: QuerySpec): Promise<RecordModel[]>;

  createRecord(objectApiName: string, fields: Record<string, unknown>): Promise<string>;
  updateRecord(objectApiName: string, fields: Record<string, unknown>): Promise<string>;
  deleteRecord(objectApiName: string, id: string): Promise<string>;

  getObjectSchema(objectApiName: string): Promise<{ fields: FieldModel[] }>;
  getLayout(input: LayoutRequest): Promise<LayoutModel>;
  getListViewInfo(objectApiName: string): Promise<Record<string, string>>;
  getListViewMetadata(objectApiName: string, listViewId: string): Promise<ListViewModel>;

  resolveReferenceDisplay(
    baseObjectApiName: string,
    fieldApiName: string,
    referenceId: string
  ): Promise<ReferenceDisplayModel | null>;

  getCapabilities(): Promise<RuntimeCapabilities>;
}
```

## Salesforce-Like UI Behavior
The shared UI should aim to mimic Salesforce as closely as practical, not just visually but behaviorally.

### Record Detail
- Render sections and rows using layout metadata when available.
- Render field labels, values, and help affordances using schema metadata.
- Respect compact/detail-oriented layout choices where possible.
- Hide technical fields like `Id` and `base64` when the schema guidance says they should not be displayed. fileciteturn1file8

### Record Edit
- Use layout metadata to determine field order and sectioning.
- Respect `required`, `nillable`, `updateable`, and `createable` from schema.
- Use type-specific editors for picklists, booleans, dates, datetimes, references, and numeric fields.
- Follow metadata-driven formatting and validation constraints such as `precision`, `scale`, `digits`, and picklist option rules. fileciteturn1file8

### Lists
- Use listview metadata to determine columns and labels.
- Keep list definition metadata separate from row retrieval.
- Preserve list filtering/sorting semantics through the shared service layer.
- Aim for a Salesforce-like table layout and column labeling.

## Pulsar Adapter Design

### Initialization
The Pulsar adapter must:
- import `pulsar.js`,
- instantiate `new Pulsar()`,
- call `await init()`,
- do so from an async IIFE or equivalent early startup path.

This is required to safely receive the Pulsar bridge event and avoid initialization timing issues. 

### Record Access
- Use `read(objectName, filters)` for constrained exact-match access.
- Use `select(objectName, query)` for more flexible querying and list data.
- Avoid unconstrained `read()` usage.
- All list queries should be written for SQLite. fileciteturn1file3 fileciteturn1file13

### Record Mutations
Use documented Pulsar CRUD methods:
- `create`
- `update`
- `delete`

### Layout and Metadata
Use the following documented metadata methods as needed:
- `getLayout`
- `getLayoutSections`
- `getLayoutFields`
- `getCompactLayoutFields`
- `getSObjectSchema`
- `listviewInfo`
- `listviewMetadata`
- `getPicklist`
- `getUnfilteredPicklist`

### Reference Fields
Do not use `resolveSOQLFieldPath` for displaying reference fields. The project notes explicitly prohibit that for this use case. Instead:
- inspect the field’s `referenceTo`,
- select the target object,
- get that target object’s schema,
- find the target object’s name field,
- read the referenced record,
- display the name field value.

For editing, the Pulsar notes recommend using `lookupObject(objectType)` to choose a related record and then assigning the selected Id to the base field. 

### Related Lists
When rendering related list information in Pulsar, the guidance is to use `getLayout()` to obtain the related list information and fields to display. 

## Host and Deployment Considerations
The scaffold must support Pulsar-hosted deployment as well as Salesforce deployment.

When deployed inside FSL or a Pulsar-hosted iframe context, the host may pass context via query parameters such as `id`, `objectType`, `docId`, `parentId`, `parentType`, and sometimes `saId`. Dynamic documents may also need to notify the host of height changes using `window.parent.postMessage({ type: 'refresh', height }, '*')`. 

These concerns should remain in host shell code, not shared UI components.

## Known Limitations and Important Notes for Salesforce LWC Developers

### 1. Pulsar Data Is Offline-First and String-Based
Pulsar stores local data in SQLite and returns values as strings. Developers used to typed data from Salesforce APIs should expect normalization work for numbers, dates, booleans, and display formatting.

### 2. Querying Semantics Differ
Pulsar list and flexible query scenarios should use SQLite via `select()`. This is not the same mental model as relying only on standard Salesforce wire/data abstractions. 

### 3. List Metadata Is Separate from List Data
Pulsar’s listview metadata is useful for determining visible columns and labels, but row data must be retrieved separately. This is an important design constraint for a shared list service. 

### 4. Search Layout Fallback Is a Gap
The Pulsar notes indicate that access to Search Layout fields is not currently supported in the SDK and would require a new JSAPI method. This matters if a list experience would otherwise want to fall back to Search Layout fields when no listview is selected. 

### 5. Reference Rendering Requires Explicit Resolution
Developers should not assume a simple dot-path display mechanism for reference fields. The Pulsar notes define a schema-aware lookup and display process that the shared service should encapsulate. 

### 6. Rich Text May Need Special Handling
For textarea/rich text rendering, the notes warn that rendering rich text without a suitable rendering solution may require explicit user guidance. 

### 7. Embedded Runtime Startup Has Operational Constraints
The initialization pattern matters in Pulsar. Improper startup can interfere with bridge readiness. The scaffold should hide this complexity inside the Pulsar adapter and host shell. 

### 8. Host Sizing Behavior Can Be Required in FSL
Unlike many normal LWC surfaces, FSL-hosted documents may require explicit iframe height refresh messaging when content changes dynamically. 

## Phased Plan

### Phase 1: Shared Record Detail
- Define shared models for record, field, layout, and reference display.
- Build a shared detail component.
- Implement basic record detail loading in both adapters.
- Render sections and fields using metadata-driven behavior.

### Phase 2: Shared Record Editing
- Add shared edit form rendering.
- Support required/editable/createable behavior from metadata.
- Implement shared save flows for create and update.
- Add reference editing patterns.

### Phase 3: Shared Lists
- Define shared listview model and list row loading contract.
- Implement list metadata loading in both adapters.
- Implement separate row retrieval in both adapters.
- Render a Salesforce-like list UI.

### Phase 4: Runtime Capability Refinement
- Add offline/sync-aware UX for Pulsar.
- Add host-shell behaviors such as resize messaging.
- Add optional advanced features only where runtime capabilities allow.

## Risks
- Metadata parity may differ between Salesforce runtime and Pulsar runtime.
- Type normalization may become a hidden source of UI inconsistencies.
- Reference rendering may introduce additional adapter calls and latency.
- Mimicking Salesforce closely may expose subtle unsupported differences that require explicit UX compromises.
- Lists may require careful query translation and sort/filter normalization across runtimes.

## Alternatives Considered

### Separate UI per Runtime
Rejected because it duplicates behavior, increases maintenance cost, and undermines the main purpose of the scaffold.

### Shared UI but Runtime-Specific Services and Models
Rejected because drift in model shapes would quickly leak into the UI and weaken portability.

### Pulsar-First UI with Salesforce Wrapper
Rejected because the target is a Salesforce-platform-compatible LWC that should feel familiar to Salesforce users.

## Open Questions
- What minimum visual fidelity is required to call the UI “Salesforce-like” for the first milestone?
- Should the first list implementation target one canonical list style or support multiple variants immediately?
- How should runtime-specific capability gaps be surfaced in the UI: silent degradation, badges, or explicit notices?
- Which object families should be included in the first end-to-end reference implementation?

## Proposed Initial Deliverables
- Shared model package for record detail, edit, and lists.
- Shared service package with runtime-neutral use cases.
- Pulsar adapter implementation.
- Salesforce adapter implementation.
- Shared record detail component.
- Shared record edit component.
- Shared list component.
- Host shells for Salesforce and Pulsar deployment.
- Developer notes documenting runtime differences and limitations.

