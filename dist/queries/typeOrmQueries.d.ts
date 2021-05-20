import { Param } from '@dfgpublicidade/node-params-module';
import { SelectQueryBuilder } from 'typeorm';
declare class TypeOrmQueries {
    static inOrEq(param: Param, qb: SelectQueryBuilder<any>, options?: {
        filter?: (value: any) => boolean;
        parse?: (value: any) => any;
    }): void;
    static like(param: Param, qb: SelectQueryBuilder<any>, options?: {
        parse?: (value: any) => any;
    }): void;
    static betweenOrEq(param: Param, qb: SelectQueryBuilder<any>, options?: {
        parse?: (value: any) => any;
    }): void;
    static trueOrNull(param: Param, qb: SelectQueryBuilder<any>): void;
    private static getOptions;
    private static filter;
    private static bypass;
}
export default TypeOrmQueries;
