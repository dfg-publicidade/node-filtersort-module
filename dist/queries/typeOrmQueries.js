"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* Module */
class TypeOrmQueries {
    static inOrEq(param, qb, options) {
        options = this.getOptions(options);
        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            qb.andWhere(`${param.name} IS NULL`);
        }
        else if (param.value) {
            if (param.value.indexOf(',') > -1) {
                const query = {};
                query[param.name] = param.value.split(',').filter(options.filter).map(options.parse);
                qb.andWhere(`${param.name} IN (:${param.name})`, query);
            }
            else if (options.filter(param.value)) {
                const query = {};
                query[param.name] = options.parse(param.value);
                qb.andWhere(`${param.name} = :${param.name}`, query);
            }
        }
    }
    static like(param, qb, options) {
        options = this.getOptions(options);
        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            qb.andWhere(`${param.name} IS NULL`);
        }
        else if (param.value) {
            const query = {};
            query[param.name] = `%${options.parse(param.value)}%`;
            qb.andWhere(`${param.name} LIKE :${param.name} COLLATE utf8_general_ci`, query);
        }
    }
    static betweenOrEq(param, qb, options) {
        options = this.getOptions(options);
        // eslint-disable-next-line no-null/no-null
        if (param.value === null) {
            qb.andWhere(`${param.name} IS NULL`);
        }
        else if (param.value) {
            if (Array.isArray(param.value)) {
                const query = {};
                query[`${param.name}0`] = options.parse(param.value[0]);
                query[`${param.name}1`] = options.parse(param.value[1]);
                qb.andWhere(`${param.name} BETWEEN :${param.name}0 AND :${param.name}1`, query);
            }
            else {
                const query = {};
                query[param.name] = options.parse(param.value);
                qb.andWhere(`${param.name} = :${param.name}`, query);
            }
        }
    }
    static trueOrNull(param, qb) {
        if (param.value !== undefined) {
            const query = {};
            query[param.name] = param.value;
            if (param.value === true) {
                qb.andWhere(`${param.name} = :${param.name}`, query);
            }
            // eslint-disable-next-line no-null/no-null
            else if (param.value === null) {
                qb.andWhere(`${param.name} IS NULL`);
            }
            else {
                qb.andWhere(`(${param.name} = :${param.name} OR ${param.name} IS NULL)`, query);
            }
        }
    }
    static getOptions(options) {
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
    static filter(value) {
        return true;
    }
    static bypass(value) {
        return value;
    }
}
exports.default = TypeOrmQueries;
