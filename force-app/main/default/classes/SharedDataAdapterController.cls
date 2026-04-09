public with sharing class SharedDataAdapterController {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> queryRecords(String objectApiName, String querySpecJson) {
        Schema.DescribeSObjectResult describeResult = requireDescribe(objectApiName);
        Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
        Map<String, Object> querySpec = parseJsonMap(querySpecJson);

        List<String> fields = parseFieldList(querySpec.get('fields'), fieldMap);
        if (fields.isEmpty()) {
            fields.add('Id');
        }

        if (!fields.contains('Id') && fieldMap.containsKey('Id')) {
            fields.add(0, 'Id');
        }

        String soql = 'SELECT ' + String.join(fields, ', ')
            + ' FROM ' + objectApiName
            + buildWhereClause(querySpec.get('filters'), fieldMap, querySpec.get('where'))
            + buildOrderByClause((String) querySpec.get('orderBy'), fieldMap)
            + buildLimitClause(querySpec.get('limit'));

        List<SObject> records = Database.query(soql);
        return recordsToMaps(records, fields);
    }

    @AuraEnabled
    public static String createRecord(String objectApiName, String fieldsJson) {
        Schema.DescribeSObjectResult describeResult = requireDescribe(objectApiName);
        SObject record = describeResult.getSObjectType().newSObject();
        applyFieldValues(record, parseJsonMap(fieldsJson), describeResult.fields.getMap(), false);
        insert record;
        return (String) record.get('Id');
    }

    @AuraEnabled
    public static String updateRecord(String objectApiName, String fieldsJson) {
        Schema.DescribeSObjectResult describeResult = requireDescribe(objectApiName);
        Map<String, Object> fieldValues = parseJsonMap(fieldsJson);
        Object idValue = fieldValues.get('Id');
        if (idValue == null || String.isBlank(String.valueOf(idValue))) {
            throw new AuraHandledException('updateRecord requires an Id field.');
        }

        SObject record = describeResult.getSObjectType().newSObject((Id) String.valueOf(idValue));
        applyFieldValues(record, fieldValues, describeResult.fields.getMap(), true);
        update record;
        return (String) record.get('Id');
    }

    @AuraEnabled
    public static String deleteRecord(String objectApiName, String recordId) {
        requireDescribe(objectApiName);
        if (String.isBlank(recordId)) {
            throw new AuraHandledException('deleteRecord requires a recordId.');
        }

        SObject record = Schema.getGlobalDescribe().get(objectApiName).newSObject((Id) recordId);
        delete record;
        return recordId;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getObjectSchema(String objectApiName) {
        Schema.DescribeSObjectResult describeResult = requireDescribe(objectApiName);
        List<Map<String, Object>> fields = new List<Map<String, Object>>();

        for (Schema.SObjectField sObjectField : describeResult.fields.getMap().values()) {
            Schema.DescribeFieldResult fieldDescribe = sObjectField.getDescribe();
            fields.add(new Map<String, Object>{
                'apiName' => fieldDescribe.getName(),
                'label' => fieldDescribe.getLabel(),
                'dataType' => String.valueOf(fieldDescribe.getType()),
                'required' => !fieldDescribe.isNillable() && !fieldDescribe.isDefaultedOnCreate(),
                'nillable' => fieldDescribe.isNillable(),
                'createable' => fieldDescribe.isCreateable(),
                'updateable' => fieldDescribe.isUpdateable(),
                'inlineHelpText' => fieldDescribe.getInlineHelpText(),
                'precision' => fieldDescribe.getPrecision(),
                'scale' => fieldDescribe.getScale(),
                'digits' => fieldDescribe.getDigits(),
                'picklistValues' => picklistValuesToMaps(fieldDescribe.getPicklistValues()),
                'referenceTo' => referenceTypesToNames(fieldDescribe.getReferenceTo()),
                'nameField' => fieldDescribe.isNameField(),
                'extraTypeInfo' => fieldDescribe.getSoapType() == null ? null : String.valueOf(fieldDescribe.getSoapType())
            });
        }

        return new Map<String, Object>{
            'fields' => fields
        };
    }

    private static Schema.DescribeSObjectResult requireDescribe(String objectApiName) {
        if (String.isBlank(objectApiName)) {
            throw new AuraHandledException('objectApiName is required.');
        }

        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectApiName);
        if (sObjectType == null) {
            throw new AuraHandledException('Unknown sObject: ' + objectApiName);
        }

        return sObjectType.getDescribe();
    }

    private static Map<String, Object> parseJsonMap(String rawJson) {
        if (String.isBlank(rawJson)) {
            return new Map<String, Object>();
        }

        Object parsed = JSON.deserializeUntyped(rawJson);
        return parsed == null ? new Map<String, Object>() : (Map<String, Object>) parsed;
    }

    private static List<String> parseFieldList(Object rawFields, Map<String, Schema.SObjectField> fieldMap) {
        List<String> fields = new List<String>();
        if (rawFields == null) {
            return fields;
        }

        for (Object fieldName : (List<Object>) rawFields) {
            String normalizedField = String.valueOf(fieldName);
            validateFieldName(normalizedField, fieldMap);
            fields.add(normalizedField);
        }

        return fields;
    }

    private static String buildWhereClause(Object rawFilters, Map<String, Schema.SObjectField> fieldMap, Object rawWhereClause) {
        if (rawWhereClause != null && !String.isBlank(String.valueOf(rawWhereClause))) {
            throw new AuraHandledException('Raw where clauses are not supported by SharedDataAdapterController.');
        }

        if (rawFilters == null) {
            return '';
        }

        Map<String, Object> filters = (Map<String, Object>) rawFilters;
        List<String> clauses = new List<String>();
        for (String fieldName : filters.keySet()) {
            validateFieldName(fieldName, fieldMap);
            Object value = filters.get(fieldName);
            clauses.add(
                value == null
                    ? fieldName + ' = null'
                    : fieldName + ' = ' + toSoqlLiteral(value)
            );
        }

        return clauses.isEmpty() ? '' : ' WHERE ' + String.join(clauses, ' AND ');
    }

    private static String buildOrderByClause(String rawOrderBy, Map<String, Schema.SObjectField> fieldMap) {
        if (String.isBlank(rawOrderBy)) {
            return '';
        }

        List<String> orderTokens = rawOrderBy.trim().split('\\s+');
        if (orderTokens.isEmpty()) {
            return '';
        }

        String fieldName = orderTokens[0];
        validateFieldName(fieldName, fieldMap);

        String direction = orderTokens.size() > 1 ? orderTokens[1].toUpperCase() : 'ASC';
        if (direction != 'ASC' && direction != 'DESC') {
            throw new AuraHandledException('Unsupported order direction: ' + direction);
        }

        return ' ORDER BY ' + fieldName + ' ' + direction;
    }

    private static String buildLimitClause(Object rawLimit) {
        if (rawLimit == null) {
            return '';
        }

        Integer limitValue = Decimal.valueOf(String.valueOf(rawLimit)).intValue();

        if (limitValue <= 0) {
            throw new AuraHandledException('limit must be a positive integer.');
        }

        return ' LIMIT ' + String.valueOf(limitValue);
    }

    private static void applyFieldValues(
        SObject record,
        Map<String, Object> fieldValues,
        Map<String, Schema.SObjectField> fieldMap,
        Boolean isUpdate
    ) {
        for (String fieldName : fieldValues.keySet()) {
            if (fieldName == 'Id') {
                continue;
            }

            validateFieldName(fieldName, fieldMap);
            Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();

            if (isUpdate && !fieldDescribe.isUpdateable()) {
                continue;
            }

            if (!isUpdate && !fieldDescribe.isCreateable()) {
                continue;
            }

            record.put(fieldName, coerceFieldValue(fieldDescribe, fieldValues.get(fieldName)));
        }
    }

    private static Object coerceFieldValue(Schema.DescribeFieldResult fieldDescribe, Object value) {
        if (value == null) {
            return null;
        }

        Schema.DisplayType fieldType = fieldDescribe.getType();

        if (
            fieldType == Schema.DisplayType.DateTime
        ) {
            return coerceDateTime(value);
        }

        if (fieldType == Schema.DisplayType.Date) {
            return coerceDate(value);
        }

        if (fieldType == Schema.DisplayType.Boolean) {
            return coerceBoolean(value);
        }

        if (
            fieldType == Schema.DisplayType.Integer
            || fieldType == Schema.DisplayType.Long
        ) {
            return Integer.valueOf(String.valueOf(value));
        }

        if (
            fieldType == Schema.DisplayType.Double
            || fieldType == Schema.DisplayType.Currency
            || fieldType == Schema.DisplayType.Percent
        ) {
            return Decimal.valueOf(String.valueOf(value));
        }

        if (fieldType == Schema.DisplayType.Reference || fieldType == Schema.DisplayType.Id) {
            return String.valueOf(value);
        }

        return value;
    }

    private static Datetime coerceDateTime(Object value) {
        if (value instanceof Datetime) {
            return (Datetime) value;
        }

        String text = String.valueOf(value);
        if (String.isBlank(text)) {
            return null;
        }

        String normalized = text.trim().replace('T', ' ');
        Integer dotIndex = normalized.indexOf('.');
        if (dotIndex > -1) {
            normalized = normalized.substring(0, dotIndex);
        }

        if (normalized.endsWith('Z')) {
            normalized = normalized.substring(0, normalized.length() - 1);
            return Datetime.valueOfGmt(normalized);
        }

        return Datetime.valueOfGmt(normalized);
    }

    private static Date coerceDate(Object value) {
        if (value instanceof Date) {
            return (Date) value;
        }

        String text = String.valueOf(value);
        if (String.isBlank(text)) {
            return null;
        }

        if (text.contains('T')) {
            text = text.substring(0, text.indexOf('T'));
        }

        return Date.valueOf(text);
    }

    private static Boolean coerceBoolean(Object value) {
        if (value instanceof Boolean) {
            return (Boolean) value;
        }

        String text = String.valueOf(value).toLowerCase();
        return text == 'true' || text == '1';
    }

    private static List<Map<String, Object>> recordsToMaps(List<SObject> records, List<String> fields) {
        List<Map<String, Object>> rows = new List<Map<String, Object>>();

        for (SObject record : records) {
            Map<String, Object> row = new Map<String, Object>();
            for (String fieldName : fields) {
                row.put(fieldName, record.get(fieldName));
            }
            rows.add(row);
        }

        return rows;
    }

    private static List<Map<String, Object>> picklistValuesToMaps(List<Schema.PicklistEntry> entries) {
        List<Map<String, Object>> values = new List<Map<String, Object>>();
        for (Schema.PicklistEntry entry : entries) {
            values.add(new Map<String, Object>{
                'label' => entry.getLabel(),
                'value' => entry.getValue(),
                'active' => entry.isActive(),
                'defaultValue' => entry.isDefaultValue()
            });
        }
        return values;
    }

    private static List<String> referenceTypesToNames(List<Schema.SObjectType> referenceTypes) {
        List<String> names = new List<String>();
        for (Schema.SObjectType referenceType : referenceTypes) {
            names.add(referenceType.getDescribe().getName());
        }
        return names;
    }

    private static void validateFieldName(String fieldName, Map<String, Schema.SObjectField> fieldMap) {
        if (String.isBlank(fieldName) || !fieldMap.containsKey(fieldName)) {
            throw new AuraHandledException('Unsupported field: ' + fieldName);
        }
    }

    private static String toSoqlLiteral(Object value) {
        if (value instanceof Boolean) {
            return ((Boolean) value) ? 'true' : 'false';
        }

        if (value instanceof Integer || value instanceof Long || value instanceof Decimal || value instanceof Double) {
            return String.valueOf(value);
        }

        return '\'' + String.escapeSingleQuotes(String.valueOf(value)) + '\'';
    }
}
