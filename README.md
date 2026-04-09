# Pulsar LWC Starter

This repository is a starting point for building a Pulsar LWC: a Lightning Web Component implementation that can run in both Salesforce and Pulsar with the same UI and shared service logic.

The current example is a shared Retail Execution flow for Account records. It exists to show the pattern we want future components to follow:

- shared UI in LWC
- shared view-model and service logic
- runtime-specific data adapters
- one Salesforce host component
- one Pulsar app host

## What A Pulsar LWC Is

The definition for this repo comes from [docs/pulsar-lwc-rfc.md](/home/kevin/projects/retail-exec-2/docs/pulsar-lwc-rfc.md).

A Pulsar LWC should:

- keep UI code runtime-neutral
- keep domain/service logic runtime-neutral
- normalize runtime-specific data into shared models
- isolate Salesforce-specific and Pulsar-specific behavior behind adapters

In practice, that means the shared UI should not talk directly to `lightning/ui*` APIs or the Pulsar SDK. It should consume a shared service contract instead.

## Current Example Architecture

```text
Salesforce runtime                    Pulsar runtime
-------------------                  ----------------
retailExecutionPage                 pulsar-app/src/main.js
        |                                     |
        v                                     v
             retailExecutionView / retailExecutionApp
                              |
                              v
                  sharedRetailExecutionService
                              |
                              v
                         DataAdapter
                      /                \
                     v                  v
         Salesforce adapter      Pulsar SDK adapter
```

## Repo Layout

- `force-app/main/default/lwc/retailExecutionView`: shared Retail Execution UI
- `force-app/main/default/lwc/retailExecutionApp`: shared Retail Execution app controller
- `force-app/main/default/lwc/sharedRetailExecutionService`: shared Retail Execution orchestration
- `force-app/main/default/lwc/sharedModels`: shared typedefs and normalization helpers
- `force-app/main/default/lwc/dataAdapter`: runtime-neutral adapter contract
- `force-app/main/default/lwc/salesforceDataAdapter`: Salesforce adapter backed by Apex
- `force-app/main/default/classes/SharedDataAdapterController.cls`: generic Salesforce data/schema bridge for the adapter
- `force-app/main/default/lwc/retailExecutionPage`: Salesforce host component exposed in App Builder
- `force-app/main/default/lwc/retailExecutionPulsar`: Pulsar LWC host wrapper
- `force-app/main/default/lwc/pulsarDataAdapter`: Pulsar SDK-backed adapter
- `pulsar-app/`: standalone Pulsar app entrypoint and bundling assets
- `docs/pulsar-lwc-rfc.md`: architectural definition
- `docs/design.md`: current project goals
- `AGENTS.md`: project brief for Codex and other coding agents

## Development Rule Of Thumb

When creating a new Pulsar LWC, use this split:

1. Put reusable rendering in a shared component.
2. Put reusable orchestration in a shared service.
3. Define or extend shared models first.
4. Add runtime-specific reads/writes in adapters only.
5. Keep each runtime host thin.

If you feel pressure to import Salesforce UI APIs or the Pulsar SDK into shared UI code, the boundary is drifting.

## How To Start A New Component

Use the Retail Execution example as the template.

1. Copy the shared shape, not the exact feature.
2. Create or extend shared models in `sharedModels`.
3. Add a new shared service module for the use case.
4. Build a shared presentational component that renders the shared view model.
5. Implement the required adapter methods in each runtime.
6. Create a thin Salesforce host and a thin Pulsar host.

For a list component, for example, the target shape should be:

- shared list models
- shared list service
- shared list view component
- Salesforce host that wires platform data into the shared shape
- Pulsar host that wires SDK data into the same shape

## Working In Salesforce

Prerequisites:

- Salesforce CLI installed
- an authenticated org alias or username

Validate a deploy:

```bash
npm run deploy:org:validate -- my-org
```

Deploy to an org:

```bash
npm run deploy:org -- my-org
```

After deployment, add `Retail Execution` to an Account Lightning record page. On app/home pages you can pass an `accountId` manually.

## Working In Pulsar

Install dependencies if needed:

```bash
npm install
```

Run the Pulsar app bundle in watch mode:

```bash
npm run dev:pulsar
```

Create a production bundle:

```bash
npm run build:pulsar
```

Preview the built app locally:

```bash
npm run preview:pulsar
```

Run the lightweight repo syntax check:

```bash
npm run check
```

The standalone Pulsar entrypoint is [pulsar-app/src/main.js](/home/kevin/projects/retail-exec-2/pulsar-app/src/main.js). It initializes the Pulsar bridge, reads launch context from query parameters, and mounts `c-retail-execution-pulsar`.

`npm run check` is intentionally lightweight. It validates JavaScript syntax across the shared LWC modules, the Pulsar app entrypoint, and helper scripts. It is not a substitute for Salesforce deployment validation.

`npm run build:pulsar` currently completes, but the Rollup output still warns that `lightning/card`, `lightning/button`, `lightning/input`, and `lightning/combobox` are unresolved external dependencies in the standalone Pulsar bundle. Treat that as an open runtime-validation item until the Pulsar app is exercised in its real environment.

## What To Clone This Repo For

This repo is intended to be cloned when you want to start a new Pulsar-compatible LWC with the runtime boundary already established.

Before doing a rename pass in a cloned project, use [docs/scaffold-customization-notes.md](/home/kevin/projects/pulsar-lwc-scaffold/docs/scaffold-customization-notes.md) as the handoff checklist for scaffold-specific names and demo artifacts.

You should expect to replace:

- the sample Retail Execution feature
- the specific styling
- any temporary scaffolding that is only useful for this example

You should keep:

- the adapter boundary
- the shared model pattern
- the split between shared UI and runtime hosts
- the Pulsar app build path
- the deployment workflow for Salesforce

## Recommended First Read For A New Agent

Start in this order:

1. [AGENTS.md](/home/kevin/projects/retail-exec-2/AGENTS.md)
2. [docs/pulsar-lwc-rfc.md](/home/kevin/projects/retail-exec-2/docs/pulsar-lwc-rfc.md)
3. [docs/design.md](/home/kevin/projects/retail-exec-2/docs/design.md)
4. [force-app/main/default/lwc/sharedModels/sharedModels.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/sharedModels/sharedModels.js)
5. [force-app/main/default/lwc/sharedRetailExecutionService/sharedRetailExecutionService.js](/home/kevin/projects/retail-exec-2/force-app/main/default/lwc/sharedRetailExecutionService/sharedRetailExecutionService.js)

## Status

This is still a starter scaffold, not a finished framework. The Retail Execution path is the current reference implementation. Future work should simplify further where possible, verify the standalone Pulsar runtime for Lightning base components, and add equivalent shared patterns for edit and list experiences.
