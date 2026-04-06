# Agent Brief

This repository is a starter for building Pulsar-compatible Lightning Web Components. Read this file first when starting work in the repo.

## Purpose

The goal is not just to ship the current record-detail demo. The goal is to preserve a clean starting point that can be cloned and extended into new Pulsar LWCs.

A Pulsar LWC in this repo means:

- one shared UI implementation
- one shared service or domain layer
- one shared set of normalized models
- runtime-specific adapters for Salesforce and Pulsar

The canonical background is in [docs/pulsar-lwc-rfc.md](/home/kevin/projects/retail-exec-2/docs/pulsar-lwc-rfc.md). The current project direction is in [docs/design.md](/home/kevin/projects/retail-exec-2/docs/design.md).

## Architectural Rules

- Shared UI must stay runtime-neutral.
- Shared services must depend on the adapter contract, not on runtime APIs.
- Runtime-specific logic belongs in host components and adapters.
- Shared models are the contract between runtime adapters and UI.
- Prefer extending the shared pattern over adding one-off runtime branches.

## Current Reference Flow

Use the record-detail path as the reference implementation.

Shared path:

- [force-app/main/default/lwc/sharedModels/sharedModels.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/sharedModels/sharedModels.js)
- [force-app/main/default/lwc/dataAdapter/dataAdapter.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/dataAdapter/dataAdapter.js)
- [force-app/main/default/lwc/sharedRecordService/sharedRecordService.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/sharedRecordService/sharedRecordService.js)
- [force-app/main/default/lwc/recordDetailApp/recordDetailApp.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/recordDetailApp/recordDetailApp.js)
- [force-app/main/default/lwc/recordDetailView/recordDetailView.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/recordDetailView/recordDetailView.js)

Salesforce host:

- [force-app/main/default/lwc/salesforceRecordDetail/salesforceRecordDetail.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/salesforceRecordDetail/salesforceRecordDetail.js)

Pulsar host:

- [force-app/main/default/lwc/pulsarRecordDetail/pulsarRecordDetail.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/pulsarRecordDetail/pulsarRecordDetail.js)
- [force-app/main/default/lwc/pulsarDataAdapter/pulsarDataAdapter.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/pulsarDataAdapter/pulsarDataAdapter.js)
- [pulsar-app/src/main.js](/home/kevin/projects/retail-exec-2/pulsar-app/src/main.js)

## What To Preserve

- The runtime boundary.
- The thin-host pattern.
- The shared model and shared service approach.
- The ability to develop the shared UI once and mount it in both runtimes.

## What To Improve Next

- Simplify the demo further when it makes the starter easier to understand.
- Keep documentation ahead of code drift.
- Add equivalent starter patterns for editing and list experiences.
- Prefer comments that explain boundaries and intent over comments that restate code.

## Working Style For Future Agents

Before making changes:

1. Read this file.
2. Read the RFC and design docs.
3. Inspect whether a change belongs in shared code, a runtime host, or an adapter.
4. If the task is to rebrand or repurpose the scaffold, read [docs/scaffold-customization-notes.md](/home/kevin/projects/pulsar-lwc-scaffold/docs/scaffold-customization-notes.md).

When making changes:

1. Default to preserving the starter-template shape.
2. Update docs when architecture or workflow changes.
3. Avoid introducing Salesforce-only or Pulsar-only dependencies into shared UI.

When adding a new feature:

1. Define the shared model.
2. Add the shared service.
3. Build the shared view.
4. Implement runtime adapters.
5. Keep each host thin.
