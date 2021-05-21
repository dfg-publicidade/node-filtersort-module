import App from '@dfgpublicidade/node-app-module';
import Params, { Param } from '@dfgpublicidade/node-params-module';
import Security from '@dfgpublicidade/node-security-module';
import { DefaultService } from '@dfgpublicidade/node-typeorm-module';
import { SelectQueryBuilder } from 'typeorm';
import TypeOrmQueries from '../queries/typeOrmQueries';
import FSUtil from './fsUtil';

/* Module */
class FSUtilTypeOrm extends FSUtil {
    public static parseFilter(app: App, alias: string, from: any, fields: any, service: DefaultService<any>, qb: SelectQueryBuilder<any>): void {
        if (!app || !alias || !from || !fields || !service || !qb) {
            return;
        }

        const params: Params = new Params(from, service);

        for (const field of Object.keys(fields)) {
            if (typeof fields[field] === 'object') {
                this.parseFilter(app, `${alias}.${field}`, from, fields[field], service, qb);
            }
            else {
                switch (fields[field]) {
                    case 'id': {
                        const param: Param = params.getString(`${alias}.${field}`);

                        if (param) {
                            TypeOrmQueries.inOrEq(param, qb, {
                                parse: (value: any): any => Security.decodeId(app.config.security, value),
                                filter: (value: any): any => Security.isId(app.config.security, value)
                            });
                        }

                        break;
                    }
                    case 'permalink': {
                        const param: Param = params.getString(`${alias}.${field}`);

                        if (param) {
                            TypeOrmQueries.inOrEq(param, qb);
                        }

                        break;
                    }
                    case 'string': {
                        const param: Param = params.getString(`${alias}.${field}`);

                        if (param) {
                            TypeOrmQueries.like(param, qb);
                        }

                        break;
                    }
                    case 'integer': {
                        const param: Param = params.getInt(`${alias}.${field}`);

                        if (param) {
                            TypeOrmQueries.betweenOrEq(param, qb);
                        }

                        break;
                    }
                    case 'float': {
                        const param: Param = params.getFloat(`${alias}.${field}`);

                        if (param) {
                            TypeOrmQueries.betweenOrEq(param, qb);
                        }

                        break;
                    }
                    case 'date': {
                        const param: Param = params.getDate(`${alias}.${field}`);

                        if (param) {
                            TypeOrmQueries.betweenOrEq(param, qb);
                        }

                        break;
                    }
                    case 'datetime': {
                        const param: Param = params.getDateTime(`${alias}.${field}`);

                        if (param) {
                            TypeOrmQueries.betweenOrEq(param, qb);
                        }

                        break;
                    }
                    case 'boolean': {
                        const param: Param = params.getBoolean(`${alias}.${field}`);

                        if (param) {
                            TypeOrmQueries.trueOrNull(param, qb);
                        }

                        break;
                    }

                }
            }
        }
    }

    public static parseSorting(alias: string, fields: any, sortParam: string, service?: DefaultService<any>): any {
        const sort: any = {};

        if (sortParam) {
            for (const item of sortParam.split(',')) {
                const sortValues: string[] = item.split(':');
                const sortValueLength: number = 2;

                let key: string = sortValues[0];
                const field: string = service ? service.translateParams(key) : key;

                if (field) {
                    const keyRegex: RegExp = new RegExp(`^${alias}\\.`, 'ig');
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

export default FSUtilTypeOrm;
