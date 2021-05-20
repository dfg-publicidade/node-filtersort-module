import { Param } from '@dfgpublicidade/node-params-module';
interface FSField {
    name: string;
    type: string;
    complName: string;
}
declare class MongoQueries {
    static inOrEq(param: Param, query: any, field: FSField, options?: {
        filter?: (value: any) => boolean;
        parse?: (value: any) => any;
    }): any;
    static eqOrNull(param: Param, query: any, field: FSField, options?: {
        parse?: (value: any) => any;
    }): any;
    static betweenOrEq(param: Param, query: any, field: FSField, options?: {
        parse?: (value: any) => any;
    }): any;
    static trueOrNull(param: Param, query: any, field: FSField): any;
    private static getFieldName;
    private static getOptions;
    private static filter;
    private static bypass;
}
export default MongoQueries;
export { FSField };
