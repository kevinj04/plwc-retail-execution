• The scaffold is in place. Tooling is minimal here: tsc is not installed and this directory is not a git repo, so I’m
  using a lighter syntax pass with the local Node runtime instead of pretending the full verification exists.

• Ran node --version
  └ v24.14.0

• Ran node --check force-app/main/default/lwc/pulsarDataAdapter/pulsarDataAdapter.js
  └ (no output)

• Ran node --check force-app/main/default/lwc/sharedModels/sharedModels.js
  └ (no output)

• Ran node --check force-app/main/default/lwc/sharedRecordService/sharedRecordService.js
  └ (no output)

• Explored
  └ Read sharedModels.js, sharedRecordService.js, pulsarRecordDetail.js

• Updated Plan
  └ The Phase 1 scaffold is in place and I completed a lightweight syntax verification on the non-LWC-specific JS
    modules. Full typechecking is not available in this environment because TypeScript is not installed.
    ✔ Create project config and source layout for a TypeScript/LWC scaffold
    ✔ Implement shared models, adapter contract, normalization, and record-detail service
    ✔ Add runtime adapter stubs for Salesforce and Pulsar plus adapter registry
    ✔ Add an initial shared record-detail LWC and basic docs
    ✔ Run a lightweight verification pass over the created scaffold

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

• I read the RFC in docs/pulsar-lwc-rfc.md and started with the Phase 1 foundation it describes: shared models, a
  runtime-neutral adapter contract, a record-detail service, adapter scaffolds, and an initial LWC shell.

  The core shared contract is in force-app/main/default/lwc/sharedModels/sharedModels.js:1 and force-app/main/default/
  lwc/dataAdapter/dataAdapter.js:1. The first service is force-app/main/default/lwc/sharedRecordService/
  sharedRecordService.js:1, which loads record data, schema, and layout together and maps them into a metadata-driven
  detail view model. Runtime registration and the two adapter scaffolds are in force-app/main/default/lwc/
  runtimeRegistry/runtimeRegistry.js:1, force-app/main/default/lwc/pulsarDataAdapter/pulsarDataAdapter.js:1, and force-
  app/main/default/lwc/salesforceDataAdapter/salesforceDataAdapter.js:1. The first UI shell is force-app/main/default/
  lwc/pulsarRecordDetail/pulsarRecordDetail.js:1 with its template in force-app/main/default/lwc/pulsarRecordDetail/
  pulsarRecordDetail.html:1.

  I also added basic project scaffolding in package.json, jsconfig.json, sfdx-project.json, and README.md. Verification
  was limited: node --check passed for the plain JS shared modules, but tsc is not installed here and this directory is
  not a git repo.

  Next useful step is to wire one adapter end-to-end first. I’d do Pulsar record/schema/layout integration next so the
  detail component can actually render against real data.

  ^^^^^^^^^^^^ COMMIT 1 ^^^^^^^^^^^^^^

  • The Salesforce path is wired now. The adapter in force-app/main/default/lwc/salesforceDataAdapter/
  salesforceDataAdapter.js:1 calls a new Apex gateway, and the deployable component is force-app/main/default/lwc/
  salesforceRecordDetail/salesforceRecordDetail.js:1 with its bundle metadata in force-app/main/default/lwc/
  salesforceRecordDetail/salesforceRecordDetail.js-meta.xml:1. I also added the missing js-meta.xml files for the shared
  LWC modules so the project can actually deploy.

  The Apex gateway is force-app/main/default/classes/PulsarSalesforceGateway.cls:1. It currently provides:

  - loadRecord: queries a record with a safe, accessible field subset
  - getObjectSchema: returns normalized field metadata for the shared service
  - getLayout: builds a simple synthetic 2-column layout so the shared detail renderer has structure on Salesforce

  This gives you a real end-to-end Salesforce detail flow now: salesforceRecordDetail -> shared record service ->
  Salesforce adapter -> Apex gateway.

  Verification was limited to local JS syntax checks; I could not compile Apex or deploy to a Salesforce org from here.
  The main functional caveat is that the current Salesforce “layout” is generated from describe metadata, not the
  platform’s real page layout metadata yet. If you want, the next step should be either:

  1. add sf project deploy start support and deploy this to an org, or
  2. replace the synthetic Apex layout with a closer Salesforce-native data source.

  ^^^^^^^^^^^^^^^^^^^^ Commit 2 ^^^^^^^^^^^^^^^^^^^^^^

  Let's set this up to deploy to an org. Make that happen and add some guidance in the readme for how to deploy it to an arbitrary org. I will then test.


  * Deploy had compilation errors, so we pasted them and got a fix

  • I fixed both deploy blockers in the workspace.

  The Apex failure at force-app/main/default/classes/PulsarSalesforceGateway.cls:211 was caused by using subList(0,
  MAX_FIELDS), which this Apex compiler/org doesn’t accept for List<String>. I replaced it with an explicit loop that
  builds a capped list and returns that. That should also clear the dependent failure in PulsarSalesforceGatewayTest.

  The LWC metadata failure in force-app/main/default/lwc/salesforceRecordDetail/salesforceRecordDetail.js-meta.xml:11
  was caused by <object>*</object>, which Salesforce does not allow on lightning__RecordPage. I removed the <objects>
  block entirely so the component isn’t restricted by an invalid wildcard.

  I couldn’t verify with an actual Salesforce deploy from here, so the next step is to redeploy and see if any further
  org-specific errors remain.

  * Deploy had errors in testing. Pasted errors and got fixes.





# Proposal to setup Pulsar App
• I’m turning the strategy into a concrete implementation proposal with file ownership, build boundaries, and the minimum
  refactors needed to keep Salesforce deploys stable while adding a real Pulsar app shell.

• Here is the implementation proposal I’d use.

  Architecture
  We keep two delivery targets:

  - force-app/...: Salesforce-deployable LWCs and Apex
  - pulsar-app/...: standalone Pulsar web app bundle

  We keep one shared core for both:

  - shared data contract
  - shared record-detail view-model mapping
  - shared presentational UI

  The key rule is that shared code cannot import Salesforce-only modules or depend on the LWC metadata packaging model.

  Target Shape
  Salesforce path:

  - salesforceRecordDetail remains the Salesforce host wrapper
  - it provides record context and a Salesforce adapter
  - it renders the shared record-detail view

  Pulsar path:

  - pulsar-app/index.html bootstraps Pulsar in an IIFE
  - it reads id and objectType from query params
  - it creates a PulsarDataAdapter
  - it renders the same shared record-detail view inside a standalone app shell

  Proposed File Structure
  Keep:

  - force-app/main/default/lwc/dataAdapter/dataAdapter.js
  - force-app/main/default/lwc/sharedModels/sharedModels.js
  - force-app/main/default/lwc/sharedRecordService/sharedRecordService.js
  - force-app/main/default/lwc/salesforceDataAdapter/salesforceDataAdapter.js
  - force-app/main/default/lwc/pulsarDataAdapter/pulsarDataAdapter.js

  Refactor:

  - force-app/main/default/lwc/recordDetailView/recordDetailView.html
  - force-app/main/default/lwc/recordDetailView/recordDetailView.js
  - force-app/main/default/lwc/recordDetailView/recordDetailView.css
  - force-app/main/default/lwc/salesforceRecordDetail/salesforceRecordDetail.html
  - force-app/main/default/lwc/sharedRecordService/sharedRecordService.js

  Add:

  - pulsar-app/index.html
  - pulsar-app/src/main.js
  - pulsar-app/src/pulsarApp.js
  - pulsar-app/src/queryContext.js
  - pulsar-app/src/hostSizing.js
  - pulsar-app/src/adapters/pulsarBridgeAdapter.js or reuse a shared-exported Pulsar adapter
  - pulsar-app/src/components/... only if the shared renderer cannot be consumed directly by the standalone build
  - pulsar-app/public/pulsar.js or copied vendor file from pulsarjs/pulsar.js
  - vite.config.js or equivalent standalone bundler config

  Implementation Phases

  1. Make the shared renderer truly neutral.
     Changes:

  - Remove lightning-card from force-app/main/default/lwc/recordDetailView/recordDetailView.html.
  - Keep the shared component plain HTML/CSS only.
  - Move Salesforce shell chrome into force-app/main/default/lwc/salesforceRecordDetail/salesforceRecordDetail.html.

  Reason:

  - Shared UI should not depend on Salesforce base components.
  - This makes it much safer to reuse in a standalone build.

  2. Update the shared load flow for Pulsar layout requirements.
     Changes in force-app/main/default/lwc/sharedRecordService/sharedRecordService.js:

  - load record first
  - derive recordTypeId from record fields if present
  - fetch schema and layout after that
  - pass recordTypeId into adapter.getLayout(...)

  Suggested shape:

  - const record = await adapter.loadRecord(...)
  - const recordTypeId = record.fields.RecordTypeId ?? null
  - const [schema, layout] = await Promise.all([...])

  Reason:

  - Pulsar docs say getLayout() requires recordTypeId or recordTypeName.
  - This avoids mismatches between the displayed record and layout metadata.

  3. Finish the Pulsar adapter against the real bridge.
     Changes in force-app/main/default/lwc/pulsarDataAdapter/pulsarDataAdapter.js:

  - keep init() caching
  - loadRecord(objectApiName, id) uses read(objectApiName, { Id: id })
  - getObjectSchema(objectApiName) maps DescribeSObjectResult.fields
  - getLayout({ objectApiName, recordTypeId, mode }) maps Pulsar DescribeLayout.detailLayoutSections into the shared
    LayoutModel
  - add getCapabilities() based on getPlatformFeatures() if useful
  - optionally implement resolveReferenceDisplay() for lookup fields later

  Reason:

  - This is the real bridge seam for the standalone app.
  - It should normalize Pulsar SDK responses into the same view model the Salesforce path already uses.

  4. Build a standalone Pulsar app shell.
     Add:

  - pulsar-app/index.html
  - pulsar-app/src/main.js

  main.js responsibilities:

  - import local pulsar.js
  - run an IIFE
  - instantiate new Pulsar()
  - await init()
  - parse URL context
  - construct adapter
  - render the app

  Reason:

  - The docs explicitly require early init() in an IIFE.
  - This separates platform bootstrap from UI rendering.

  5. Add query-param context parsing.
     Add pulsar-app/src/queryContext.js:

  - parse id
  - parse objectType
  - optionally parse parentId, parentType, saId, docId

  Return a normalized object like:

  - { recordId, objectApiName, parentId, parentType, serviceAppointmentId, documentId }

  Reason:

  - This is how Pulsar/FSL passes launch context per the docs.

  6. Add host iframe sizing support.
     Add pulsar-app/src/hostSizing.js:

  - send window.parent.postMessage({ type: 'refresh', height: '*' }, '*')
  - optionally use ResizeObserver
  - trigger on initial render, data load, and error state transitions

  Reason:

  - Pulsar/FSL hosting expects explicit size refreshes for async content.

  7. Add a Pulsar app container component.
     Add pulsar-app/src/pulsarApp.js:

  - owns loading/error state
  - calls the shared record-detail service
  - mounts the shared view
  - refreshes after sync/layout invalidation events later

  Reason:

  - Keeps host concerns out of adapters and view code.

  8. Add standalone build tooling.
     Update package.json:

  - add dev:pulsar
  - add build:pulsar

  Likely add:

  - vite
  - open-source LWC tooling only if we truly want to reuse the LWC renderer directly

  Important Decision
  There are two viable ways to reuse the shared UI:

  Option A, recommended:

  - Reuse shared model/service/adapter logic
  - Rebuild the renderer for Pulsar as a plain web component or minimal DOM app shell

  Option B:

  - Introduce open-source LWC build tooling and try to reuse the same LWC presentational component directly in the Pulsar app

  I recommend Option A unless you specifically want to invest in OSS LWC packaging now. It is lower risk and avoids coupling
  the standalone app to Salesforce/LWC compilation constraints. The current codebase is not yet set up for OSS LWC builds.

  Concrete Work Order

  1. Neutralize recordDetailView and move lightning-card back into the Salesforce wrapper.
  2. Refactor sharedRecordService to load record first and support recordTypeId.
  3. Complete the Pulsar layout/schema normalization in the Pulsar adapter.
  4. Add pulsar-app/ shell with index.html, main.js, query parsing, and host sizing.
  5. Add standalone build tooling.
  6. Wire the standalone app to the shared core and verify it can render a record from id + objectType.
  7. Add sync/layout invalidation refresh behavior.

  Risks

  - Pulsar getLayout() may require stricter record type handling than the current abstraction assumes.
  - Reusing LWC UI directly in the standalone app will require more tooling than the repo currently has.
  - Reference/picklist display may need extra normalization work if we want parity with Salesforce-quality formatting.

  Recommendation
  If you want the fastest path to a working Pulsar app, implement the shared-core reuse now and keep the standalone renderer
  simple and host-native. If you want maximum UI code reuse, we should first decide whether to adopt open-source LWC as a
  second build target.

  If you want, I can turn this next into a step-by-step execution plan with exact file edits for Phase 1 only.