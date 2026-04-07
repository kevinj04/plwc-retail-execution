# Pulsar LWC Components
A Pulsar LWC Component is a Salesforce Platform compatible LWC component that pulls its data from a service module which is either backed by a Pulsar Data Adapter or a Salesforce Data Adapter depending on which runtime the component has been launched from. The UI should be something that can be written once and appears the same in both runtime environments. 

The architecture should share the UI and the service module across both potential runtimes. A shared set of data models will make those shared resources possible. Our two data adapters should serve those data models and be custom-built to access the data via their specific runtimes.

# Current State of Project
The project now uses a shared Retail Execution workflow as the primary reference implementation. The current feature is an Account-scoped visit flow with:

- one shared UI in `retailExecutionView`
- one shared controller in `retailExecutionApp`
- one shared service in `sharedRetailExecutionService`
- shared normalized visit models in `sharedModels`
- a Salesforce adapter plus thin Salesforce host
- a Pulsar adapter plus thin Pulsar host

This is the shape we want future Pulsar LWCs to copy.

Current local verification status:

- JavaScript syntax checks pass with `npm run check`
- the standalone Pulsar bundle builds with `npm run build:pulsar`
- the Pulsar build still emits unresolved `lightning/*` base component warnings, so Pulsar runtime verification is not complete yet
- Salesforce deploy/runtime validation still needs to happen against a real org

# Next Steps

## Simplification
Keep aligning this project with the goal of making it a starting point for future Pulsar LWC Components. It should keep the structure so that designing a single UI for a LWC can be done and shared between the Salesforce and PulsarApp.

We should keep reducing incidental complexity until it is easy to see where shared models, shared services, shared views, adapters, and thin hosts belong.

## Documentation
Continue writing comments and documentation that describe how to start developing a new Pulsar LWC and how to build and test it on both platforms.

Help me write documentation that will help future instances of Codex understand both what a Pulsar LWC is and how we plan to develop them.
