import { Param } from '@dfgpublicidade/node-params-module';
import { SelectQueryBuilder } from 'typeorm';

/* Module */
class TypeOrmQueries {
    public static inOrEq(param: Param, qb: SelectQueryBuilder<any>, options?: {
        filter?: (value: any) => boolean;
        parse?: (value: any) => any;
    }): void {
        options = this.getOptions(options);

        const pname: string = param.name.replace(/\./ig, '_');

        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            qb.andWhere(`${param.name} IS NULL`);
        }
        else if (param.value) {
            if (param.value.indexOf(',') > -1) {
                const query: any = {};
                query[param.name] = param.value.split(',').filter(options.filter).map(options.parse);

                qb.andWhere(`${param.name} IN (:${pname})`, query);
            }
            else if (options.filter(param.value)) {
                const query: any = {};
                query[param.name] = options.parse(param.value);

                qb.andWhere(`${param.name} = :${pname}`, query);
            }
        }
    }

    public static like(param: Param, qb: SelectQueryBuilder<any>, options?: {
        parse?: (value: any) => any;
    }): void {
        options = this.getOptions(options);

        const pname: string = param.name.replace(/\./ig, '_');

        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            qb.andWhere(`${param.name} IS NULL`);
        }
        else if (param.value) {
            const query: any = {};
            query[param.name] = `%${options.parse(param.value)}%`;

            qb.andWhere(`${param.name} LIKE :${pname} COLLATE utf8_general_ci`, query);
        }
    }

    public static betweenOrEq(param: Param, qb: SelectQueryBuilder<any>, options?: {
        parse?: (value: any) => any;
    }): void {
        options = this.getOptions(options);

        const pname: string = param.name.replace(/\./ig, '_');

        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            qb.andWhere(`${param.name} IS NULL`);
        }
        else if (param.value) {
            if (Array.isArray(param.value)) {
                const query: any = {};
                query[`${param.name}0`] = options.parse(param.value[0]);
                query[`${param.name}1`] = options.parse(param.value[1]);

                qb.andWhere(`${param.name} BETWEEN :${pname}0 AND :${pname}1`, query);
            }
            else {
                const query: any = {};
                query[param.name] = options.parse(param.value);

                qb.andWhere(`${param.name} = :${pname}`, query);
            }
        }
    }

    public static trueOrNull(param: Param, qb: SelectQueryBuilder<any>): void {
        if (param.value !== undefined) {
            const pname: string = param.name.replace(/\./ig, '_');

            const query: any = {};
            query[param.name] = param.value;

            if (param.value === true) {
                qb.andWhere(`${param.name} = :${pname}`, query);
            }
            // eslint-disable-next-line no-null/no-null
            else if (param.value === null) {
                qb.andWhere(`${param.name} IS NULL`);
            }
            else {
                qb.andWhere(`(${param.name} = :${pname} OR ${param.name} IS NULL)`, query);
            }
        }
    }

    private static getOptions(options: any): any {
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

    private static filter(value: any): boolean {
        return true;
    }

    private static bypass(value: any): any {
        return value;
    }
}

export default TypeOrmQueries;
