# Pulsar Notes
Pulsar maintains its data in a SQLite database. All values in the database are strings. All queries for select JSAPI calls are made in `SQLite`.

## Table of Contents
- [Displaying and Entering Field Values](#displaying-and-entering-field-values)
  - [Common to All Fields](#common-to-all-fields)
  - [string](#string)
  - [textarea](#textarea)
  - ...
- [Common Field Service Relations](#common-field-service-relations)
- [Creating PDFs with `saveAs`](#creating-pdfs-with-saveas)
- [Listviews](#listviews)
  - [Displaying Listviews and their Related Information](#displaying-listviews-and-their-related-information)

## Displaying and Entering Field Values
When displaying the fields of an SObject in a user interface, **always** adhere to the formatting defined by the SObject schema. Here is a guide for each field type: `string`, `textarea`, `double`, `int`, `picklist`, `boolean`, `date`, `datetime`, `base64`, `Id`, `reference`, `currency`, `percent`, `phone`, `url`, `email`, `combobox`, `multipicklist`, `locaiton`.

### Common to All Fields
- `inlineHelpText`: when a value is present here, display a small "info" icon next to the field with a clickable tooltip.
- `required`: When true, display a small red vertical line to the left of the entry field in edit mode. In display mode, there is nothing to do.
- `nillable`: Relevant for picklists especially - ensure that an empty option is provided when editing.
- `updateable`: When editing an object fields that are not `updateable` should not have an editable input field.
- `createable`: When creating an object, fields that are not `createable` should not have an editable input field.

### `string`
**Summary**: Single-line plain text value with max length.
- Display as-is, on a single line.
- Enforce `length` from schema.


### `textarea`
**Summary**: A multi-line plain or rich text area.
- `plaintext` or `richtextarea` are defined by the `extraTypeInfo` property of the `Field` object.
- Display the value in a fixed height element that scrolls vertically with the content size
- If rendering rich text without a provided third party rendering solution, **prompt the user about this potential issue.**

### `double`
**Summary**: Single-line text value displays a formatted floating-point number.
- The value should be formatted using the `Field`'s `precision` and `scale`.
- `precision` defines the total number of digits both to the left and right of the decimal point.
- `scale` defines the number of digits allowed to the right of the decimal point and truncates any that exceed that length.
- Do not show extra leading zeros when displaying the value.

### `int`
**Summary**: Single-line text value displays a formatted integer.
- The value should be formatted using the `digits` field of the `Field` object.
- Only display the number of digits described by this field.
- Limit any data entry to that number of digits.
- Integers should not have decimal points or values to the right of a decimal point. Do not show extra leading zeros when displaying the value.

### `picklist`
**Summary**: Display the label associated with the picklist value of this field.
- The value should be used to determine and display the associated picklist label from the `picklistValues` property of the `Field` object. When displaying an editable picklist field, use a dropdown menu guided by the following information:
| Display Behavior            | Controlled by                           |
| --------------------------- | --------------------------------------- |
| Dropdown options            | `picklistValues[].label`                |
| Stored value                | `picklistValues[].value`                |
| Initial value               | `picklistValues[].defaultValue`         |
| Availability                | `picklistValues[].active`               |
| Blank option shown          | `nillable`                              |
| User must select a value    | `required`                              |
| Controlled by another field | `controllingField`, `dependentPicklist` |


### `boolean`
**Summary**: Display a checkbox that is either checked for `true` or unchecked for `false`.
- In display mode, the checkbox should not be modifiable.
- In edit mode, allow the user to interact with the checkbox and update the value accordingly.

### `date`
**Summary**: Display a formatted date. Do not display the time portion.
- In display mode, display a formatted date string.
- The displayed format and behavior are influenced by both the user's locale settings and field-level metadata from the `Field` schema.
- In edit mode, display using a date picker UI.

### `datetime`
**Summary**: Display a formatted date and time.
- In display mode, display a formatted date time string.
- The displayed format and behavior are influenced by both the user's locale settings and field-level metadata from the `Field` schema.
- A `datetime` field is displayed using a combined date and time picker in editable forms.

### `base64`
**Summary**: Do not display.

### `Id`
**Summary**: Do not display.

### `reference`
**Summary**: Displays a human-readable label by resolving an `Id` field to a related record’s display name. Editing uses a searchable lookup dialog.

#### Displaying a `reference` Field
A `reference` field stores the Id of a record in another object.
- To display it:
  - Get the `referenceTo` array from the field’s schema.
  - Select a target object:
    - If only one object is present, use it.
    - If multiple are present, choose the first by default or prompt the user based on context.
  - Call `pulsar.getSObjectSchema(targetObject)` and find the field with nameField: true.
  - Use `pulsar.read(targetObject, id)` to fetch the referenced record.
  - Display the value of the name field (e.g., Name, Subject, etc.).

#### Editing a `reference` Field
To make a reference field editable:
- Retrieve the `referenceTo` array from the field’s schema.
- Determine the object type to search:
  - If only one type: call `pulsar.lookupObject(objectType)`.
  - If multiple types: prompt the user to select one, then call `lookupObject` for that type.
- When selected through `lookupObject`, assign the resulting record's Id to the reference field in the base object.
- 💡 This process ensures schema-aware resolution and a user-friendly editing experience for lookup fields.

### `currency`
**Summary**: Display a localized, formatted number with a currency symbol.
- A `currency` field is displayed as a localized, formatted number with a currency symbol, such as `$1,234.56` or `€1.234,56`, depending on the user's locale, currency settings, and the field’s metadata schema.
- Similarly to `double`, `precision` defines the total number of digits to display and `scale` defines the total number of decimal places to show.
- When a `currencyIsoCode` is supplied, we use this value over the user's locale. Do not show leading zeros when displaying the value.

### `percent`
**Summary**: Numeric value formatted as a percentage (e.g., `42.5%`), based on schema and locale.
- Display the value as a number followed by a percent sign (%).
- Use the field's scale property to determine the number of decimal places to show.
- Format the number using the user’s locale settings (e.g., comma vs. period as decimal separator).
- ⚠️ Do not display extra leading zeros (e.g., show 5%, not 005.00%).
-  edit mode, use a numeric input (not a free-form text box) constrained to the expected precision and scale.

### `phone`
**Summary**: Displayed as a clickable, formatted phone number, with behavior tailored to locale and platform context.

#### Displaying a phone Field
Display the stored string as a clickable link using the tel: URI scheme.
- Example: tel:+14155550123
- Format the phone number according to the user’s locale, when possible (e.g., (415) 555-0123 in US locales).
- Add click-to-dial behavior for mobile devices or CTI (Computer Telephony Integration) environments.
- The raw value is stored as a plain string, but:
  - Display formatting is often inferred from external context (e.g., device type, browser).
  - No strict formatting rules are exposed in the field schema.

#### Editing a phone Field
Use a text input field that:
- Accepts numeric characters, parentheses, spaces, and dashes.
- Optionally validates using regex based on locale or org-defined standards.
- Avoid enforcing a fixed format unless explicitly required by the schema or UX.
- 💡 The system should be flexible in accepting input but consistent in display formatting, prioritizing user locale and telephony compatibility.

### `url`
**Summary**: Displayed as a clickable hyperlink where the stored string is used as both the link’s destination and visible label.

#### Displaying a `url` Field
Render the string value as a clickable hyperlink (<a> tag).
- Use the value as both the href and the link text.
- Example: https://example.com → https://example.com
- Open the link in a new tab/window by setting target="_blank" and rel="noopener noreferrer" for safety.
- ⚠️ If the value does not start with a protocol (e.g., http:// or https://), prepend https:// to avoid broken links.
- Display fallback text like "Invalid URL" if the value is missing or malformed.

#### Editing a `url` Field
Use a single-line text input field.
- Optionally validate the value with a regex or URL constructor to ensure correct formatting.
- Warn users if the protocol is missing or the string is not a valid URL.
- 💡 Even though the schema stores the value as plain text, the expected behavior is to treat it as a functional hyperlink for navigation.

### `email`
**Summary**: Displayed as a clickable `mailto:` link using the email string as both the link destination and visible label.

#### Displaying an `email` Field
Render the value as a clickable `mailto:` link:
- Use the value as both the link label and the `mailto:` target.
- Include basic email format validation before rendering (e.g., @ and domain presence).
- Optionally add hover text or an icon to indicate email functionality.

#### Editing an `email` Field
Use a single-line text input field.
- Validate the input using a standard email regex or `HTMLInputElement` with `type="email"`.
- Disallow spaces and invalid characters.
- Allow but do not require lowercase transformation — email systems are generally case-insensitive but store values as entered.
-💡 Email fields are expected to be interactable in display mode and rigorously validated in edit mode.

### `combobox`
**Summary**: A `combobox` is a UI rendering pattern, not a distinct schema type. It combines a text input with a dropdown list to support selection and filtering.

#### When is a Field Rendered as a `Combobox`?
A field is displayed as a `combobox` when it supports both:
- Predefined options (like a dropdown)
- Search/filter interaction (like a text input)
- This typically applies to:
  - `picklist`
  - `multipicklist`
  - `reference` (i.e. lookup fields)

#### Behavior Driven By Underlying Field Type
| Field Type      | `Combobox` Behavior                                               |
| --------------- | --------------------------------------------------------------- |
| `picklist`      | Dropdown with type-ahead filter; options from `picklistValues`. |
| `multipicklist` | May render as a searchable dual-list or multi-select combo.     |
| `reference`     | Lookup field; powered by `pulsar.lookupObject()`.               |


#### 💡 Schema Properties That Influence `Combobox` Behavior
- `picklistValues[]`: Defines dropdown options for picklists.
- `referenceTo[]`: Defines target objects for lookups.
- `nillable` / `required`: Determines whether an empty selection is allowed.
- `controllingField` / `dependentPicklist`: Affects filtered visibility of options.

#### Editing in a `Combobox`
- Allow text input for filtering options.
- Display a list of selectable values underneath.
- On selection, store the associated value (for picklists) or `Id` (for references).

💡 The `combobox` pattern improves usability but relies entirely on the underlying field type and schema to determine available values and selection rules.

### `multipicklist`
**Summary**: Allows selection of multiple values from a predefined list. Stored as a semicolon-delimited string, but rendered as a dual-list UI in forms.

#### Displaying a `multipicklist` Field
- In read-only views, display the selected values as a semicolon-separated string:
  - Example: `Red;Blue;Green`
- In editable forms, render a dual-list box:
  - Left side: available options
  - Right side: currently selected values
  - Users move items between the lists.

#### Editing a `multipicklist` Field
- Use the `picklistValues[]` array from the schema to populate available options.
- Allow selection of multiple values; order is typically preserved as selected.
- Store the result as a single string with `;` as the delimiter.
  - Example: `Blue;Green`

#### Important Rules and Behavior
| Context	| Behavior |
| ------- | -------- |
| Form (Edit Mode) | Dual-list UI (left = available, right = selected). |
| Record | View	Display as text: Value1;Value2;Value3 |
| Reports/List Views | Show selected values as a single string |
| SOQL / API | Single string value using ; as delimiter (e.g., "A;B;C") |

💡 Unlike picklist, users can select more than one value — always treat the stored format as a flat string unless parsed into an array.

### `location`
**Summary**: A compound field storing geographic coordinates — latitude and longitude — used for mapping and geospatial calculations.

#### Displaying a `location` Field
- Display as a comma-separated pair of decimal values: `Latitude, Longitude` (e.g., `37.7749, -122.4194`).
- Use the field's `scale` to determine the number of decimal places shown.
- Format both values using the user’s locale, including decimal separators and minus signs.
- Show the field label (e.g., "Location") once, with both coordinates displayed inline or on separate lines if space-constrained.
- Optionally, render as a map with a pin, if the UI supports it (e.g., Lightning components or mobile apps).

#### Editing a `location` Field
- Use two numeric input fields, one for latitude and one for longitude.
- Apply validation to ensure:
  - Latitude is between `-90` and `+90`
  - Longitude is between `-180` and `+180`
- Limit input precision using `precision` and `scale` to match schema (e.g., up to 9 digits with 4 decimals).
- 💡 Display real-time validation or map previews to assist users in entering accurate locations.
- If the field is `nillable`, allow either or both inputs to be blank.

---

## Common Field Service Relations

### A User's ServiceAppointments
This is the way a user is related to a Service Appointment.
- ServiceResource has a lookup field that can relate to a User. The field `RelatedRecordId` can reference a User. A User can be referenced in only one ServiceResource record.
- Each ServiceResource can be linked to many ServiceAppointments via the AssignedResource junction table.
  - AssignedResource has a ServiceAppointmentId lookup field.
  - AssignedResource has a ServiceResourceId lookup field.

#### Example
```sql
SELECT sa.*
FROM ServiceAppointments sa
JOIN AssignedResources ar ON sa.Id = ar.ServiceAppointmentId
JOIN ServiceResources sr ON ar.ServiceResourceId = sr.Id
WHERE sr.RelatedRecordId = `005XXXXXXXXXXXX`;
```
### A User's WorkOrders
This is the primary way a user is related to a `WorkOrder`.

To get all `WorkOrders` for a given UserId in Pulsar (based on how the data relationships are structured), you would typically follow the relationship from `User → ServiceResource → AssignedResource → ServiceAppointment → WorkOrder`.

However, since `WorkOrders` are not directly linked to Users but to `ServiceAppointments` (which in turn are assigned via `ServiceResources`), here is an SQLite query to retrieve all `WorkOrders` for a specific UserId using Pulsar's `select()` method:

``` js
const userId = '005XXXXXXXXXXXX'; // Replace with actual UserId
const workOrders = await pulsar.select('WorkOrder', `
  SELECT wo.*
  FROM WorkOrder wo
  JOIN ServiceAppointment sa ON wo.Id = sa.ParentRecordId
  JOIN AssignedResource ar ON sa.Id = ar.ServiceAppointmentId
  JOIN ServiceResource sr ON ar.ServiceResourceId = sr.Id
  WHERE sr.RelatedRecordId = '${userId}'
`);
```

## Field Data Types
Fields on objects have an associated data type via their schema. When editing a value for a field, always respect the schema data type. Valid data types include:

- string
- textarea
- double
- int
- picklist
- address
- phone
- reference
- url
- currency
- date
- datetime
- time
- location
- id
- email

---

## Creating PDFs with `saveAs`
Custom documents will often be used to save PDF versions of the information they have collected. The `saveAs` JSAPI method is the correct way to do this. By supplying a unique file name, the `saveAs` method will attempt to convert the current document and all of its contents into a PDF.

### Saving the Whole Document
Making a call to `saveAs('fileName.pdf')` will attempt to convert the entire current `Document` to a PDF. There is no need to supply a `docnode` argument in this case.

### Targeting a Document
Some users may wish to create a PDF in an iFrame in their custom document. When this path is chosen, they should provide an argument to `saveAs` for the `docnode` which should specify how to identify the `document` from *within* their custom document. This is often specified an executable JS statement like `document.getElementById('myframeId').contentDocument` that resolves to a `Document` object.

### Important Tips
In order to ensure that iPads and iPhones print the PDF in the same way, avoiding any browser text scaling, it is important to include a `meta` tag that sets the viewport to match the device width and scale.

``` js
function viewportTag(doc) {
  const meta = doc.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0';
  return meta;
}
```

---

## Listviews
Listviews are used to display **tables of SObject records** (e.g., Accounts, Contacts) in a structured, column-based format. Each row represents a single SObject record, and each column corresponds to a specific field on that object. Listviews allow users to browse, sort, and select multiple records at once.

💡 The **set of visible rows** is context-dependent and determined by user-defined listviews, filters, or listview defaults.

### Identifying and Loading Listviews

#### 1. Getting Available Listviews
To retrieve the list of all available listviews for a given object type, use the `pulsar.listviewInfo(objectType)` method.
- This returns a map of `{ [listviewId]: label }` for that SObject.
- Labels are human-readable names like "All Accounts" or "My Opportunities".

✅ If a user refers to a listview by name, you should:
- Call `listviewInfo(objectType)`
- Filter the returned values to find the corresponding `listviewId`.

Example: Getting a Listview ID by Label
``` js
const listViewLabelMap = await pulsar.listviewInfo('Account');
const listviewId = Object.entries(listViewLabelMap).find(
  ([_, label]) => label === 'All Accounts'
)?.[0];
```

#### 2. Getting Listview Metadata
Once you have a valid `listviewId`, use the `pulsar.listviewMetadata(objectType, listviewId)` method to get metadata for that view.
- This metadata defines which fields should be displayed as columns.
- It may also include sorting and filtering instructions.
``` js
const metadata = await pulsar.listviewMetadata('Account', listviewId);
const listviewFields = metadata.fields;
```

#### 3. Fallback: Using Search Layout Fields
If no `listviewId` is provided, the UI should fall back to the Search Layout fields for that object. These fields are defined in Salesforce and are used as a default column layout when no specific listview is selected.

⚠️ Accessing Search Layout fields is not currently supported in the Pulsar SDK — a new `JSAPI` method must be implemented to retrieve them.

🧠 Notes for GPT Consumers
- Listview metadata is not part of the Layout metadata, except for Related Lists.
- Use `listviewInfo` → `listviewMetadata` to determine how to display a table of records.
- Fields defined in a listview should be used as display columns, not editable form fields.
- If a user specifies a listview "by name", map it to its listviewId via listviewInfo.

---

## Using an Objects Layout
When displaying an object using its layout, always use the more complete `getLayout` method. Make sure that you include the objects record type Id if it has one when retrieving this layout.

### Laying Out a Section
Each section has a `heading` that should be displayed unless the `useHeading` property is `false`. Additionally, sections can be collapsible if the `useCollapsibleSection` is `true`. A collapsible section has an initial state defined by the `collapsed` property.

Each section also has a number of `layoutRows` and each of these rows is split into the number of `columns` defined by that property. When we are displaying a layout on a narrow display -- less than `400px` -- we should display these columns vertically stacked rather than side-by-side.

### Laying Out a Row
Each row in a layout has two properties: `numItems` and `layoutItems`. `numItems` should correspond to the `columns` value from the section and indicates how many items are in this row.

`layoutItems` contains information about each item to display in the row.

### Laying Out an Item
Each item has a `label` which should be displayed as a lesser importance element in the UI along side the value of the `layoutComponents`. Each item also has a `placeholder` property which, when `true`, indicates that this item is empty and should just take up an appopriate amount of space in the layout. It also has a `required` property which should be used to indicate whether or not this item is `required` when creating a new object or editing an existing object.

The `layoutComponents` property will contain one or more `LayoutComponents` to display.

`layoutComponents` that have `fieldType` `address` or `location` or `name` will be composed of multiple `components`. These require special layouts defined later.

When there are multiple `layoutComponent` objects to display, they are displayed by concatenating the `Field` component values and any `Separator` values.

When there is a single `layoutComponent` that is a `Field` and has an empty array for `components` can be displayed directly. Use the schema information in the `details` property for information on how to format and display the data.


---

## Formatting Values With Locales
When a locale is needed to format a value, use the locale defined in `userInfo()` that is most appropriate. For non-currency cases, use the `userlanguage` property if it exists. If not use the `devicelanguage`. If neither exists, default to `"en_US"`. For currency formatting, use the `orgDefaultCurrencyLocale` if it exists, falling back on general locale otherwise. For formatting the currency symbol make use of the `userDefaultCurrencyIsoCode` which takes precedence over the `orgDefaultCurrencyIsoCode`.

---


# Creating Service Reports
Creating service reports is a common feature for field service applications. The process for doing so involves determining which service report template to use based on the `ServiceAppointment` and/or parent (`WorkOrder` or `WorkOrderLineItem`). Once the service report template has been identified, the document is built using information from the related objects of the ServiceAppointment and parent object following the layout describe by the template.

## Choosing the Correct Service Report Template
We use a hierarchical approach to resolve the service report template.
- First, check the `ServiceReportTemplateId` field on the `ServiceAppointment` - this has top priority.
- If that field is empty, check the `ServiceReportTemplateId` field on the parent record referenced by the `ParentRecordId` field. Use the `ParentRecordType` field to obtain the object type for the `read`.
- If none of these objects has a `ServiceReportTemplateId`, call `getFLSTemplate('')` with an empty string as the `templateId` argument. This will return an array containing only the default service report template.
``` js
// where appointmentId is the Id of a ServiceAppointment
const appointmentData = (await pulsar.read('ServiceAppointment', { Id: appointmentId }))[0];
let template;

if (appointmentData.ServiceReportTemplateId) {
  const result = await pulsar.getFSLTemplate(appointmentData.ServiceReportTemplateId);
  template = result?.serviceReportTemplates?.[0];
} else if (appointmentData.ParentRecordId && appointmentData.ParentRecordType) {
  const parent = (await pulsar.read(appointmentData.ParentRecordType, { Id: appointmentData.ParentRecordId }))[0];
  if (parent?.ServiceReportTemplateId) {
    const result = await pulsar.getFSLTemplate(parent.ServiceReportTemplateId);
    template = result?.serviceReportTemplates?.[0];
  }
}

if (!template) {
  const result = await pulsar.getFSLTemplate('');
  template = result?.serviceReportTemplates?.[0];
}
```

## Choosing the Correct SubTemplate
When using `getFSLTemplate` with an service report template `Id` argument we expect the returned value to be an `array` of `objects` of length 1. We can use the first `object` to get our template and then proceed to select the proper `subTemplateType` from the `subTemplates` property. The `subTemplateType` we are interested in is determined by:
- If there is a `ServiceAppointment` associated with this report and the `parentRecordType` is `WorkOrder` then our `subTemplateType` is **`WO_SA`**. If the `parentRecordType` is `WorkOrderLineItem` then our `subTemplateType` is **`WO_LISA`**.
- If there is no `ServiceAppointment` associated with this report, then the `subTemplateType` is the type of the object provided -- either `WorkOrder` or `WorkOrderLineItem`.

**The `regions` property of the `subtemplate` that has the correct `subTemplateType` is our service report layout.**