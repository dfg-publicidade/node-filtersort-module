"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MongoQueries {
    static inOrEq(param, query, field, options) {
        options = this.getOptions(options);
        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            // eslint-disable-next-line no-null/no-null
            query[this.getFieldName(field)] = null;
        }
        else if (param.value) {
            if (param.value.indexOf(',') > -1) {
                query[this.getFieldName(field)] = {
                    $in: param.value.split(',').filter(options.filter).map(options.parse)
                };
            }
            else {
                if (options.filter(param.value)) {
                    query[this.getFieldName(field)] = options.parse(param.value);
                }
            }
        }
        return query;
    }
    static eqOrNull(param, query, field, options) {
        options = this.getOptions(options);
        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            // eslint-disable-next-line no-null/no-null
            query[this.getFieldName(field)] = null;
        }
        else if (param.value) {
            query[this.getFieldName(field)] = options.parse(param.value);
        }
        return query;
    }
    static betweenOrEq(param, query, field, options) {
        options = this.getOptions(options);
        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            // eslint-disable-next-line no-null/no-null
            query[this.getFieldName(field)] = null;
        }
        else if (param.value) {
            if (Array.isArray(param.value)) {
                query[this.getFieldName(field)] = {
                    $gte: options.parse(param.value[0]),
                    $lte: options.parse(param.value[1])
                };
            }
            else {
                query[this.getFieldName(field)] = options.parse(param.value);
            }
        }
        return query;
    }
    static trueOrNull(param, query, field) {
        if (param.value !== undefined) {
            if (param.value === true) {
                query[this.getFieldName(field)] = true;
            }
            // eslint-disable-next-line no-null/no-null
            else if (param.value === null) {
                // eslint-disable-next-line no-null/no-null
                query[this.getFieldName(field)] = null;
            }
            else {
                const value = {};
                value[this.getFieldName(field)] = param.value;
                const value2 = {};
                // eslint-disable-next-line no-null/no-null
                value2[this.getFieldName(field)] = null;
                query.$or = [value, value2];
            }
        }
        return query;
    }
    static getFieldName(field) {
        return field.name + (field.complName ? '.' + field.complName : '');
    }
    static getOptions(options) {
        if (!options) {
            options = {};
        }
        if (!options.filter) {
            options.filter = this.filter;
        }
        if (!options.parse) {
            options.parse = this.bypass;
        }
        return options;
    }
    static filter(value) {
        return true;
    }
    static bypass(value) {
        return value;
    }
}
exports.default = MongoQueries;
