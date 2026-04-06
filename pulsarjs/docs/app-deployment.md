# Deploying Custom Apps in FSL

## Context

When deploying a custom document from within FSL, Pulsar will often add query parameters to the URL so that custom documents can acquire their context.

The values that are typically included when launched from the Lightning Bolt Menu:

- `id` -- The Id of the object that launched this document.
- `objectType` -- The object type of the object that launched this document.
- `docId` -- The Id of this document's ContentDocument.
- `parentId` -- When present, this contains the Id of the parent of the object that launched this document.
- `parentType` -- When present, this contains the object type of the parent of the object that launched this document.

The values that are typically included when launched as a **card component on an overview screen**:
- `id` -- The id of the object represented by the overview screen.
- `objectType` -- The object tyoe of the object represented by the overview screen.
- `saId` -- If the object is a `WorkOrder` overview screen and it has an associated `ServiceAppointment` this will be the id of that `ServiceAppointment`.

## Updating Document Size

When deploying a custom document inside FSL it will be contained in an iFrame. The FSL application will attempt to size the iFrame to fit the content, however, content which changes dynamically -- or that simply loads asynchronously, will need to update FSL through a `window.parent.postMessage`.

If using a fixed value for the height, make sure that any time this value would change (content update, DOM modification) we send the `postMessage`.

### Parameters
- type (string, required): `"refresh"` to indicate that we are doing a height refresh.
- height (string, required): A string value that represents the a valid CSS style height value. e.g. `"50px"` or `"50%"` or `"2em"` or the special value `"*"` which informs FSL to fill all the available space in the viewport.

Note: sending "*" as the origin parameter to `postMessage` is acceptable since this will never carry sensitive data.

### Examples

Set the height of the container iFrame to fill the space in the viewport.
``` js
window.parent.postMessage({
  "type": "refresh",
  "height": "*"
}, "*");
```

Set the height of the container iFrame to 800px.
``` js
// Once you have determined the height you'd like the iFrame to conform to...
// inform FSL of that height formatted as you would CSS.
var myHeight = "800px";
window.parent.postMessage({
  "type": "refresh",
  "height": myHeight
}, "*");
```
