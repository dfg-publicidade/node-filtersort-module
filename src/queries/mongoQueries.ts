import { Param } from '@dfgpublicidade/node-params-module';

/* Module */
interface FSField {
    name: string;
    type: string;
    complName: string;
}

class MongoQueries {
    public static inOrEq(param: Param, query: any, field: FSField, options?: {
        filter?: (value: any) => boolean;
        parse?: (value: any) => any;
    }): any {
        options = this.getOptions(options);

        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            // eslint-disable-next-line no-null/no-null
            query[this.getFieldName(field)] = null;
        }
        else if (param.value) {
            if (param.value.indexOf(',') > -1) {
                query[this.getFieldName(field)] = {
                    $in: param.value.split(',').filter(options.filter).map(options.parse)
                };
            }
            else {
                if (options.filter(param.value)) {
                    query[this.getFieldName(field)] = options.parse(param.value);
                }
            }
        }

        return query;
    }

    public static eqOrNull(param: Param, query: any, field: FSField, options?: {
        parse?: (value: any) => any;
    }): any {
        options = this.getOptions(options);

        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            // eslint-disable-next-line no-null/no-null
            query[this.getFieldName(field)] = null;
        }
        else if (param.value) {
            query[this.getFieldName(field)] = options.parse(param.value);
        }

        return query;
    }

    public static betweenOrEq(param: Param, query: any, field: FSField, options?: {
        parse?: (value: any) => any;
    }): any {
        options = this.getOptions(options);

        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            // eslint-disable-next-line no-null/no-null
            query[this.getFieldName(field)] = null;
        }
        else if (param.value) {
            if (Array.isArray(param.value)) {
                query[this.getFieldName(field)] = {
                    $gte: options.parse(param.value[0]),
                    $lte: options.parse(param.value[1])
                };
            }
            else {
                query[this.getFieldName(field)] = options.parse(param.value);
            }
        }

        return query;
    }

    public static trueOrNull(param: Param, query: any, field: FSField): any {
        if (param.value !== undefined) {
            if (param.value === true) {
                query[this.getFieldName(field)] = true;
            }
            // eslint-disable-next-line no-null/no-null
            else if (param.value === null) {
                // eslint-disable-next-line no-null/no-null
                query[this.getFieldName(field)] = null;
            }
            else {
                const value: any = {};
                value[this.getFieldName(field)] = param.value;

                const value2: any = {};
                // eslint-disable-next-line no-null/no-null
                value2[this.getFieldName(field)] = null;

                query.$or = [value, value2];
            }
        }

        return query;
    }

    private static getFieldName(field: FSField): string {
        return field.name + (field.complName ? '.' + field.complName : '');
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

export default MongoQueries;
export { FSField };
