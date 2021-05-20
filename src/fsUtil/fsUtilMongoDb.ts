import App from '@dfgpublicidade/node-app-module';
import Params, { Param } from '@dfgpublicidade/node-params-module';
import Security from '@dfgpublicidade/node-security-module';
import Strings from '@dfgpublicidade/node-strings-module';
import { ObjectId } from 'bson';
import MongoQueries, { FSField } from '../queries/mongoQueries';
import FSUtil from './fsUtil';

/* Module */
class FSUtilMongoDb extends FSUtil {
    public static parseFilter(app: App, alias: string, from: any, fields: any): any {
        if (!app || !alias || !from || !fields) {
            return;
        }

        const params: Params = new Params(from);

        let query: any = {};

        for (const field of Object.keys(fields)) {
            let param: Param;

            const fieldObj: FSField = this.getField(fields, field);

            if (typeof fieldObj.type === 'object') {
                const subquery: any = this.parseFilter(app, `${alias}.${field}`, from, fields[field]);

                for (const key of Object.keys(subquery)) {
                    query[`${field}.${key}`] = subquery[key];
                }
            }
            else {
                switch (fieldObj.type) {
                    case 'objectid': {
                        param = params.getString(`${alias}.${field}`);
                        param = param.value ? param : params.getString(`${alias}.${field.replace(/_/ig, '')}`);
                        query = MongoQueries.inOrEq(param, query, fieldObj, {
                            filter: ObjectId.isValid,
                            parse: (value: any): any => new ObjectId(value)
                        });

                        break;
                    }
                    case 'id': {
                        param = params.getString(`${alias}.${field}`);
                        query = MongoQueries.inOrEq(param, query, fieldObj, {
                            filter: (value: any): boolean => Security.isId(app.config.security, value),
                            parse: (value: any): any => Security.decodeId(app.config.security, value)
                        });

                        break;
                    }
                    case 'permalink': {
                        param = params.getString(`${alias}.${field}`);
                        query = MongoQueries.inOrEq(param, query, fieldObj);

                        break;
                    }
                    case 'string': {
                        param = params.getString(`${alias}.${field}`);
                        query = MongoQueries.eqOrNull(param, query, fieldObj, {
                            parse: (value: any): any => ({ $regex: Strings.createFindRegex(value) })
                        });

                        break;
                    }
                    case 'integer': {
                        param = params.getInt(`${alias}.${field}`);
                        query = MongoQueries.betweenOrEq(param, query, fieldObj);

                        break;
                    }
                    case 'float': {
                        param = params.getFloat(`${alias}.${field}`);
                        query = MongoQueries.betweenOrEq(param, query, fieldObj);

                        break;
                    }
                    case 'date': {
                        param = params.getDate(`${alias}.${field}`);
                        query = MongoQueries.betweenOrEq(param, query, fieldObj);

                        break;
                    }
                    case 'datetime': {
                        param = params.getDateTime(`${alias}.${field}`);
                        query = MongoQueries.betweenOrEq(param, query, fieldObj);

                        break;
                    }
                    case 'boolean': {
                        param = params.getBoolean(`${alias}.${field}`);
                        query = MongoQueries.trueOrNull(param, query, fieldObj);

                        break;
                    }
                }
            }
        }

        return query;
    }

    public static parseSorting(alias: string, fields: any, sortParam: any): any {
        const sort: any = {};

        if (sortParam) {
            for (const item of sortParam.split(',')) {
                const sortValues: string[] = item.split(':');
                const sortValueLength: number = 2;

                let key: string = sortValues[0];

                if (key.indexOf('.') !== -1 && key.startsWith(alias)) {
                    key = key.substring(alias.length + 1);
                }

                if (this.getAcceptedFields(fields).indexOf(key) !== -1) {
                    const field: any = this.getFieldValue(fields, key.split('.'));

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

    private static getField(fields: any, field: string): FSField {
        let type: string;
        let complName: string;

        const arrayFieldLength: number = 2;

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

    private static getFieldValue(fields: any, fieldName: string[]): any {
        for (const field of Object.keys(fields)) {
            let fieldValue: any;

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

export default FSUtilMongoDb;
