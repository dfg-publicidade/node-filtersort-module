import App from '@dfgpublicidade/node-app-module';
import FSUtil from './fsUtil';
declare class FSUtilMongoDb extends FSUtil {
    static parseFilter(app: App, alias: string, from: any, fields: any): any;
    static parseSorting(alias: string, fields: any, sortParam: string): any;
    private static getField;
    private static getFieldValue;
}
export default FSUtilMongoDb;
