"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_params_module_1 = __importDefault(require("@dfgpublicidade/node-params-module"));
const node_security_module_1 = __importDefault(require("@dfgpublicidade/node-security-module"));
const debug_1 = __importDefault(require("debug"));
const mongodb_1 = require("mongodb");
const typeOrmQueries_1 = __importDefault(require("../queries/typeOrmQueries"));
const fsUtil_1 = __importDefault(require("./fsUtil"));
/* Module */
const debug = (0, debug_1.default)('module:fsutil-typeorm');
class FSUtilTypeOrm extends fsUtil_1.default {
    static parseFilter(app, alias, from, fields, service, qb) {
        if (!app || !alias || !from || !fields || !service || !qb) {
            return;
        }
        const params = new node_params_module_1.default(from, service);
        for (const field of Object.keys(fields)) {
            if (typeof fields[field] === 'object') {
                this.parseFilter(app, `${alias}.${field}`, from, fields[field], service, qb);
            }
            else {
                switch (fields[field]) {
                    case 'id': {
                        const param = params.getString(`${alias}.${field}`);
                        if (param) {
                            typeOrmQueries_1.default.inOrEq(param, qb, {
                                parse: (value) => node_security_module_1.default.decodeId(app.config.security, value),
                                filter: (value) => node_security_module_1.default.isId(app.config.security, value)
                            });
                        }
                        else {
                            debug(`Param named ${alias}.${field} is undefined.`);
                        }
                        break;
                    }
                    case 'objectId': {
                        let param = params.getString(`${alias}.${field}`);
                        param = (param === null || param === void 0 ? void 0 : param.value) ? param : params.getString(`${alias}.${field.replace(/_/ig, '')}`);
                        if (param) {
                            typeOrmQueries_1.default.inOrEq(param, qb, {
                                filter: mongodb_1.ObjectId.isValid
                            });
                        }
                        else {
                            debug(`Param named ${alias}.${field} is undefined.`);
                        }
                        break;
                    }
                    case 'permalink': {
                        const param = params.getString(`${alias}.${field}`);
                        if (param) {
                            typeOrmQueries_1.default.inOrEq(param, qb);
                        }
                        else {
                            debug(`Param named ${alias}.${field} is undefined.`);
                        }
                        break;
                    }
                    case 'string': {
                        const param = params.getString(`${alias}.${field}`);
                        if (param) {
                            typeOrmQueries_1.default.like(param, qb);
                        }
                        else {
                            debug(`Param named ${alias}.${field} is undefined.`);
                        }
                        break;
                    }
                    case 'integer': {
                        const param = params.getInt(`${alias}.${field}`);
                        if (param) {
                            typeOrmQueries_1.default.betweenOrEq(param, qb);
                        }
                        else {
                            debug(`Param named ${alias}.${field} is undefined.`);
                        }
                        break;
                    }
                    case 'float': {
                        const param = params.getFloat(`${alias}.${field}`);
                        if (param) {
                            typeOrmQueries_1.default.betweenOrEq(param, qb);
                        }
                        else {
                            debug(`Param named ${alias}.${field} is undefined.`);
                        }
                        break;
                    }
                    case 'date': {
                        const param = params.getDate(`${alias}.${field}`);
                        if (param) {
                            typeOrmQueries_1.default.betweenOrEq(param, qb);
                        }
                        else {
                            debug(`Param named ${alias}.${field} is undefined.`);
                        }
                        break;
                    }
                    case 'datetime': {
                        const param = params.getDateTime(`${alias}.${field}`);
                        if (param) {
                            typeOrmQueries_1.default.betweenOrEq(param, qb);
                        }
                        else {
                            debug(`Param named ${alias}.${field} is undefined.`);
                        }
                        break;
                    }
                    case 'boolean': {
                        const param = params.getBoolean(`${alias}.${field}`);
                        if (param) {
                            typeOrmQueries_1.default.trueOrNull(param, qb);
                        }
                        else {
                            debug(`Param named ${alias}.${field} is undefined.`);
                        }
                        break;
                    }
                }
            }
        }
    }
    static parseSorting(alias, fields, sortParam, service) {
        const sort = {};
        if (sortParam) {
            for (const item of sortParam.split(',')) {
                const sortValues = item.split(':');
                const sortValueLength = 2;
                let key = sortValues[0];
                const field = service ? service.translateParams(key) : key;
                if (field) {
                    const keyRegex = new RegExp(`^${alias}\\.`, 'ig');
                    key = key.replace(keyRegex, '');
                    if (this.getAcceptedFields(fields).indexOf(key) !== -1) {
                        sort[field] = sortValues.length === sortValueLength
                            ? (sortValues[1] === 'desc' || sortValues[1] === 'DESC' ? 'DESC' : 'ASC')
                            : 'ASC';
                    }
                }
            }
        }
        return sort;
    }
}
exports.default = FSUtilTypeOrm;
