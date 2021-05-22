"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_params_module_1 = __importDefault(require("@dfgpublicidade/node-params-module"));
const node_security_module_1 = __importDefault(require("@dfgpublicidade/node-security-module"));
const node_strings_module_1 = __importDefault(require("@dfgpublicidade/node-strings-module"));
const bson_1 = require("bson");
const mongoQueries_1 = __importDefault(require("../queries/mongoQueries"));
const fsUtil_1 = __importDefault(require("./fsUtil"));
/* Module */
class FSUtilMongoDb extends fsUtil_1.default {
    static parseFilter(app, alias, from, fields) {
        if (!app || !alias || !from || !fields) {
            return;
        }
        const params = new node_params_module_1.default(from);
        let query = {};
        for (const field of Object.keys(fields)) {
            const fieldObj = this.getField(fields, field);
            if (typeof fieldObj.type === 'object') {
                const subquery = this.parseFilter(app, `${alias}.${field}`, from, fields[field]);
                for (const key of Object.keys(subquery)) {
                    query[`${field}.${key}`] = subquery[key];
                }
            }
            else {
                switch (fieldObj.type) {
                    case 'objectId': {
                        let param = params.getString(`${alias}.${field}`);
                        param = param.value ? param : params.getString(`${alias}.${field.replace(/_/ig, '')}`);
                        if (param) {
                            query = mongoQueries_1.default.inOrEq(param, query, fieldObj, {
                                filter: bson_1.ObjectId.isValid,
                                parse: (value) => new bson_1.ObjectId(value)
                            });
                        }
                        break;
                    }
                    case 'id': {
                        const param = params.getString(`${alias}.${field}`);
                        if (param) {
                            query = mongoQueries_1.default.inOrEq(param, query, fieldObj, {
                                filter: (value) => node_security_module_1.default.isId(app.config.security, value),
                                parse: (value) => node_security_module_1.default.decodeId(app.config.security, value)
                            });
                        }
                        break;
                    }
                    case 'permalink': {
                        const param = params.getString(`${alias}.${field}`);
                        if (param) {
                            query = mongoQueries_1.default.inOrEq(param, query, fieldObj);
                        }
                        break;
                    }
                    case 'string': {
                        const param = params.getString(`${alias}.${field}`);
                        if (param) {
                            query = mongoQueries_1.default.eqOrNull(param, query, fieldObj, {
                                parse: (value) => ({ $regex: node_strings_module_1.default.createFindRegex(value) })
                            });
                        }
                        break;
                    }
                    case 'integer': {
                        const param = params.getInt(`${alias}.${field}`);
                        if (param) {
                            query = mongoQueries_1.default.betweenOrEq(param, query, fieldObj);
                        }
                        break;
                    }
                    case 'float': {
                        const param = params.getFloat(`${alias}.${field}`);
                        if (param) {
                            query = mongoQueries_1.default.betweenOrEq(param, query, fieldObj);
                        }
                        break;
                    }
                    case 'date': {
                        const param = params.getDate(`${alias}.${field}`);
                        if (param) {
                            query = mongoQueries_1.default.betweenOrEq(param, query, fieldObj);
                        }
                        break;
                    }
                    case 'datetime': {
                        const param = params.getDateTime(`${alias}.${field}`);
                        if (param) {
                            query = mongoQueries_1.default.betweenOrEq(param, query, fieldObj);
                        }
                        break;
                    }
                    case 'boolean': {
                        const param = params.getBoolean(`${alias}.${field}`);
                        if (param) {
                            query = mongoQueries_1.default.trueOrNull(param, query, fieldObj);
                        }
                        break;
                    }
                }
            }
        }
        return query;
    }
    static parseSorting(alias, fields, sortParam) {
        const sort = {};
        if (sortParam) {
            for (const item of sortParam.split(',')) {
                const sortValues = item.split(':');
                const sortValueLength = 2;
                let key = sortValues[0];
                if (key.indexOf('.') !== -1 && key.startsWith(alias)) {
                    key = key.substring(alias.length + 1);
                }
                if (this.getAcceptedFields(fields).indexOf(key) !== -1) {
                    const field = this.getFieldValue(fields, key.split('.'));
                    if (Array.isArray(field)) {
                        key = `${key}.${field[1]}`;
                    }
                    sort[key] = sortValues.length === sortValueLength
                        ? (sortValues[1] === 'desc' || sortValues[1] === 'DESC' ? -1 : 1)
                        : 1;
                }
            }
        }
        return sort;
    }
    static getField(fields, field) {
        let type;
        let complName;
        const arrayFieldLength = 2;
        if (Array.isArray(fields[field]) && fields[field].length === arrayFieldLength) {
            type = fields[field][0];
            complName = fields[field][1];
        }
        else {
            type = fields[field];
        }
        return {
            name: field,
            type, complName
        };
    }
    static getFieldValue(fields, fieldName) {
        for (const field of Object.keys(fields)) {
            let fieldValue;
            if (typeof fields[field] === 'object' && !Array.isArray(fields[field])) {
                fieldValue = this.getFieldValue(fields[field], fieldName.slice(1));
            }
            else {
                if (field === fieldName[0]) {
                    fieldValue = fields[field];
                }
            }
            if (fieldValue) {
                return fieldValue;
            }
        }
    }
}
exports.default = FSUtilMongoDb;
