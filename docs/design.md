# Pulsar LWC Components
A Pulsar LWC Component is a Salesforce Platform compatible LWC component that pulls its data from a service module which is either backed by a Pulsar Data Adapter or a Salesforce Data Adapter depending on which runtime the component has been launched from. The UI should be something that can be written once and appears the same in both runtime environments. 

The architecture should share the UI and the service module across both potential runtimes. A shared set of data models will make those shared resources possible. Our two data adapters should serve those data models and be custom-built to access the data via their specific runtimes.

# Current State of Project
Currently the project achieves our initial goal. We have a single UI that is shared between our Salesforce platform app and our PulsarApp. Both applications retrieve their data in different ways, which is what we want. Both of these apps build and deploy properly on their respective platforms.

# Next Steps

## Simplification
I'd like to align this project with the goal of making it a starting point for future Pulsar LWC Components. It should keep the structure so that designing a single UI for a LWC can be done and shared between the Salesforce and PulsarApp.

We should reduce the application to this point, wherein it is easy to see where and how to develop LWCs from this point.

## Documentation
Please write comments and documentation to describe how to start developing a new Pulsaw LWC and how to build and test it on both platforms.

Help me write documentation that will help future instances of Codex understand both what a Pulsar LWC is and how we plan to develop them.