# Golden Rules

Do not break these:

* Always import `pulsar.js` into any javascript files that you create that use the SDK. Make sure to mark the javascript file as a `module` when including it in an `HTML` file via the `src` tag.
* Always instantiate and initialize Pulsar when the document first loads. Make sure that this is wrapped in an immediately invoked function expression (IIFE) to ensure that we do not create a blocking situation when awaiting the bridge setup.
* The return type of `listviewMetadata` has `fields` and `labels` which correspond to the columns to display for that listview. **It does not contain any field values**.
* Do not use `read()` to load objects without also limiting the number of objects by providing filtering parameters. `read()` can easily fail when no filters are provided. Use a `select()` instead and offer to paginate if it makes sense.
* When writing a query - format it for a SQLite database.
* Do not use `resolveSOQLFieldPath` when displaying a `reference` field. Follow the instructions in `pulsar-notes.md`.
* Pulsar uses SQLite for its database. Format all query strings accordingly.
* Do not make assumptions about fields on SObjects. If you do not know how, ask the user.
* When building SQLite queries, make use of information provided by the user and properties defined in the `sobject-relationships.md` file. Do not query the internet or make guesses.
* If you are not certain how to write a query, ask the user.