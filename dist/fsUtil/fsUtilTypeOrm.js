"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_params_module_1 = __importDefault(require("@dfgpublicidade/node-params-module"));
const node_security_module_1 = __importDefault(require("@dfgpublicidade/node-security-module"));
const typeOrmQueries_1 = __importDefault(require("../queries/typeOrmQueries"));
const fsUtil_1 = __importDefault(require("./fsUtil"));
/* Module */
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
                        typeOrmQueries_1.default.inOrEq(param, qb, {
                            parse: (value) => node_security_module_1.default.decodeId(app.config.security, value),
                            filter: (value) => node_security_module_1.default.isId(app.config.security, value)
                        });
                        break;
                    }
                    case 'permalink': {
                        const param = params.getString(`${alias}.${field}`);
                        typeOrmQueries_1.default.inOrEq(param, qb);
                        break;
                    }
                    case 'string': {
                        const param = params.getString(`${alias}.${field}`);
                        typeOrmQueries_1.default.like(param, qb);
                        break;
                    }
                    case 'integer': {
                        const param = params.getInt(`${alias}.${field}`);
                        typeOrmQueries_1.default.betweenOrEq(param, qb);
                        break;
                    }
                    case 'float': {
                        const param = params.getFloat(`${alias}.${field}`);
                        typeOrmQueries_1.default.betweenOrEq(param, qb);
                        break;
                    }
                    case 'date': {
                        const param = params.getDate(`${alias}.${field}`);
                        typeOrmQueries_1.default.betweenOrEq(param, qb);
                        break;
                    }
                    case 'datetime': {
                        const param = params.getDateTime(`${alias}.${field}`);
                        typeOrmQueries_1.default.betweenOrEq(param, qb);
                        break;
                    }
                    case 'boolean': {
                        const param = params.getBoolean(`${alias}.${field}`);
                        typeOrmQueries_1.default.trueOrNull(param, qb);
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
