import App from '@dfgpublicidade/node-app-module';
import { DefaultService } from '@dfgpublicidade/node-typeorm-module';
import { DefaultService as DefaultService2 } from '@dfgpublicidade/node-typeorm-module-2';
import { SelectQueryBuilder } from 'typeorm';
import FSUtil from './fsUtil';
declare class FSUtilTypeOrm extends FSUtil {
    static parseFilter(app: App, alias: string, from: any, fields: any, service: DefaultService<any> | DefaultService2<any>, qb: SelectQueryBuilder<any>): void;
    static parseSorting(alias: string, fields: any, sortParam: string, service?: DefaultService<any>): any;
}
export default FSUtilTypeOrm;
