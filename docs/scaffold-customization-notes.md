# Scaffold Customization Notes

This file captures the repo-specific names and demo artifacts that should usually be revisited when cloning this scaffold into a new product repository.

Use it as a handoff brief for a future agent tasked with renaming, removing, or rewriting scaffold-specific pieces.

## Rename Immediately

These names are tied to the current record-detail demo or scaffold identity and will usually need to change in a real project.

- Package and repo identity:
  - [package.json](/home/kevin/projects/pulsar-lwc-scaffold/package.json)
  - [package-lock.json](/home/kevin/projects/pulsar-lwc-scaffold/package-lock.json)

- Shared demo feature bundles:
  - [force-app/main/default/lwc/recordDetailApp](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/recordDetailApp)
  - [force-app/main/default/lwc/recordDetailView](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/recordDetailView)

- Runtime host bundles:
  - [force-app/main/default/lwc/salesforceRecordDetail](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/salesforceRecordDetail)
  - [force-app/main/default/lwc/pulsarRecordDetail](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/pulsarRecordDetail)

- References to those bundle names:
  - [manifest/package.xml](/home/kevin/projects/pulsar-lwc-scaffold/manifest/package.xml)
  - [pulsar-app/src/main.js](/home/kevin/projects/pulsar-lwc-scaffold/pulsar-app/src/main.js)

- User-visible demo labels and titles:
  - [pulsar-app/index.html](/home/kevin/projects/pulsar-lwc-scaffold/pulsar-app/index.html)
  - [pulsar-app/src/main.js](/home/kevin/projects/pulsar-lwc-scaffold/pulsar-app/src/main.js)
  - [force-app/main/default/lwc/salesforceRecordDetail/salesforceRecordDetail.js](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/salesforceRecordDetail/salesforceRecordDetail.js)
  - [force-app/main/default/lwc/salesforceRecordDetail/salesforceRecordDetail.js-meta.xml](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/salesforceRecordDetail/salesforceRecordDetail.js-meta.xml)

## Usually Keep As-Is

These are scaffold primitives rather than app branding. Keep them unless the project is intentionally changing the architecture.

- [force-app/main/default/lwc/dataAdapter](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/dataAdapter)
- [force-app/main/default/lwc/pulsarDataAdapter](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/pulsarDataAdapter)
- [force-app/main/default/lwc/sharedModels](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/sharedModels)
- [force-app/main/default/lwc/sharedRecordService](/home/kevin/projects/pulsar-lwc-scaffold/force-app/main/default/lwc/sharedRecordService)
- [pulsar-app/src/queryContext.js](/home/kevin/projects/pulsar-lwc-scaffold/pulsar-app/src/queryContext.js)
- [pulsar-app/src/hostSizing.js](/home/kevin/projects/pulsar-lwc-scaffold/pulsar-app/src/hostSizing.js)

## Rewrite Or Remove

These files describe the scaffold itself or document the current demo. They should usually be rewritten or removed early in project setup.

- [README.md](/home/kevin/projects/pulsar-lwc-scaffold/README.md)
- [AGENTS.md](/home/kevin/projects/pulsar-lwc-scaffold/AGENTS.md)
- [docs/design.md](/home/kevin/projects/pulsar-lwc-scaffold/docs/design.md)
- [docs/pulsar-lwc-rfc.md](/home/kevin/projects/pulsar-lwc-scaffold/docs/pulsar-lwc-rfc.md)
- [docs/codex-logs.md](/home/kevin/projects/pulsar-lwc-scaffold/docs/codex-logs.md)

## Rename Execution Notes

- If an LWC bundle folder is renamed, the `.js`, `.html`, `.css`, and `.js-meta.xml` files inside it must be renamed to exactly match the new bundle name.
- Update every import and component tag that references the old bundle name, including `createElement('c-...')` calls.
- Do not hand-edit generated output in [dist/pulsar-app](/home/kevin/projects/pulsar-lwc-scaffold/dist/pulsar-app). Rebuild after source renames.
- The generic shared primitives should only be renamed if there is a strong reason to diverge from the scaffold architecture.
