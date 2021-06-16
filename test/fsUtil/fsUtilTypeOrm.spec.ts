import App from '@dfgpublicidade/node-app-module';
import Dates from '@dfgpublicidade/node-dates-module';
import Security from '@dfgpublicidade/node-security-module';
import { DefaultService, TypeOrmManager } from '@dfgpublicidade/node-typeorm-module';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { Column, Connection, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, SelectQueryBuilder } from 'typeorm';
import { FSUtilTypeOrm } from '../../src';

/* Tests */
@Entity({
    name: 'Test'
})
class Test {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({
        type: 'varchar'
    })
    public name: string;

    @Column({
        type: 'varchar'
    })
    public _id: string;

    @Column({
        type: 'varchar'
    })
    public permalink: string;

    @Column({
        type: 'int'
    })
    public qtty: number;

    @Column({
        type: 'float'
    })
    public value: number;

    @Column({
        type: 'date'
    })
    public init: Date;

    @Column({
        type: 'datetime'
    })
    public created_at: Date;

    @Column({
        type: 'boolean'
    })
    public active: boolean;

    @OneToMany((type: Test2): any => Test2, (test2: Test2): Test => test2.test)
    public tests: Test2[];
}

@Entity({
    name: 'Test2'
})
class Test2 {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type: Test): any => Test, (test: Test): Test2[] => test.tests)
    @JoinColumn({ name: 'test', referencedColumnName: 'id' })
    public test: Test;

    @OneToMany((type: Test3): any => Test3, (test3: Test3): Test2 => test3.test)
    public tests: Test3[];
}

@Entity({
    name: 'Test3'
})
class Test3 {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type: Test2): any => Test2, (test: Test2): Test3[] => test.tests)
    @JoinColumn({ name: 'test', referencedColumnName: 'id' })
    public test: Test2;
}

class TypeOrmManagerTest extends TypeOrmManager {
    protected static entities: any[] = [
        Test,
        Test2,
        Test3
    ];
}

class TestService extends DefaultService<Test> {
    private static instances: TestService;

    protected defaultSorting: any = {
        '$alias.name': 'ASC'
    };

    private constructor(connectionName: string) {
        super(Test, connectionName);

        this.parentEntities = [];

        this.childEntities = [{
            name: 'tests',
            alias: 'Test2',
            service: TestService2
        }];
    }

    public static getInstance(connectionName: string): TestService {
        let instance: TestService = this.instances;

        if (!instance) {
            instance = new TestService(connectionName);
            this.instances = instance;
        }

        return instance;
    }
}

class TestService2 extends DefaultService<Test2> {
    private static instance: TestService2;

    public deletedAtField: string = undefined;

    private constructor(connectionName: string) {
        super(Test2, connectionName);

        this.parentEntities = [{
            name: 'test',
            alias: 'Test',
            service: TestService
        }];

        this.childEntities = [{
            name: 'tests',
            alias: 'Test3',
            service: TestService3
        }];
    }

    public static getInstance(connectionName: string): TestService2 {
        let instance: TestService2 = this.instance;

        if (!instance) {
            instance = new TestService2(connectionName);
            this.instance = instance;
        }

        return instance;
    }
}

class TestService3 extends DefaultService<Test3> {
    private constructor(connectionName: string) {
        super(Test3, connectionName);

        this.parentEntities = [{
            name: 'test',
            alias: 'Test2',
            service: TestService2
        }];

        this.childEntities = [];
    }

    public static getInstance(connectionName: string): TestService3 {
        return new TestService3(connectionName);
    }
}

class InvalidService extends DefaultService<Test> {
    private constructor(connectionName: string) {
        super(Test, connectionName);
    }

    public static getInstance(connectionName: string): InvalidService {
        return new InvalidService(connectionName);
    }

    public translateParams(param: string, alias?: string): string {
        return undefined;
    }
}

describe('fsUtilTypeOrm', (): void => {
    const connectionName: string = 'mysql';
    let connection: Connection;

    const options: any = {
        disabled: false,
        type: 'mysql',
        name: connectionName,
        host: process.env.MYSQL_TEST_HOST,
        port: 3306,
        username: process.env.MYSQL_TEST_USER,
        password: process.env.MYSQL_TEST_PASSWORD,
        database: process.env.MYSQL_TEST_DB,
        timezone: 'local',
        pool: {
            min: 0,
            max: 1
        },
        entities: [],
        synchronize: false
    };

    let app: App;

    let testService: TestService;
    let testService3: TestService3;
    let invalidService: InvalidService;

    before(async (): Promise<void> => {
        if (!process.env.MYSQL_TEST_HOST) {
            throw new Error('MYSQL_TEST_HOST must be set');
        }
        if (!process.env.MYSQL_TEST_USER) {
            throw new Error('MYSQL_TEST_USER must be set');
        }
        if (!process.env.MYSQL_TEST_PASSWORD) {
            throw new Error('MYSQL_TEST_PASSWORD must be set');
        }
        if (!process.env.MYSQL_TEST_DB) {
            throw new Error('MYSQL_TEST_DB must be set');
        }

        connection = await TypeOrmManagerTest.connect(options, connectionName);

        await connection.manager.query(`
            CREATE TABLE IF NOT EXISTS Test (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(10),
                _id CHAR(24),
                permalink VARCHAR(20),
                qtty INT,
                value FLOAT,
                init DATE,
                created_at DATETIME,
                active BOOLEAN
            )
        `);
        await connection.manager.query(`
            CREATE TABLE IF NOT EXISTS Test2 (
                id INT PRIMARY KEY AUTO_INCREMENT,
                test INT,
                CONSTRAINT FOREIGN KEY (test) REFERENCES Test(id)
            )
        `);
        await connection.manager.query(`
            CREATE TABLE IF NOT EXISTS Test3 (
                id INT PRIMARY KEY AUTO_INCREMENT,
                test INT,
                CONSTRAINT FOREIGN KEY (test) REFERENCES Test2(id)
            )
        `);

        await connection.manager.query(`
            INSERT INTO Test(name) VALUES ('test')
        `);
        await connection.manager.query(`
            INSERT INTO Test2(test) VALUES (1)
        `);
        await connection.manager.query(`
            INSERT INTO Test3(test) VALUES (1)
        `);

        await connection.manager.query(`
            INSERT INTO Test(_id) VALUES ('6095a263d84040d247c3cc2f')
        `);
        await connection.manager.query(`
            INSERT INTO Test(permalink) VALUES ('test')
        `);
        await connection.manager.query(`
            INSERT INTO Test(qtty) VALUES (2)
        `);
        await connection.manager.query(`
            INSERT INTO Test(value) VALUES (2.0)
        `);
        await connection.manager.query(`
            INSERT INTO Test(init) VALUES (DATE('2021-01-01'))
        `);
        await connection.manager.query(`
            INSERT INTO Test(created_at) VALUES (DATE('2021-01-01 10:00:00'))
        `);
        await connection.manager.query(`
            INSERT INTO Test(active) VALUES (true)
        `);

        app = new App({
            appInfo: {
                name: 'test',
                version: 'v1'
            },
            config: {
                security: {
                    encodeId: '123456',
                    encodingLength: 10
                }
            }
        });

        testService = TestService.getInstance(connectionName);
        testService3 = TestService3.getInstance(connectionName);
        invalidService = InvalidService.getInstance(connectionName);
    });

    after(async (): Promise<void> => {
        await connection.manager.query('DROP TABLE Test3');
        await connection.manager.query('DROP TABLE Test2');
        await connection.manager.query('DROP TABLE Test');

        await TypeOrmManagerTest.close(options.name);
    });

    it('1. parseFilter', async (): Promise<void> => {
        FSUtilTypeOrm.parseFilter(undefined, undefined, undefined, undefined, undefined, undefined);
    });

    it('2. parseFilter', async (): Promise<void> => {
        FSUtilTypeOrm.parseFilter(app, undefined, undefined, undefined, undefined, undefined);
    });

    it('3. parseFilter', async (): Promise<void> => {
        FSUtilTypeOrm.parseFilter(app, 'test', undefined, undefined, undefined, undefined);
    });

    it('4. parseFilter', async (): Promise<void> => {
        FSUtilTypeOrm.parseFilter(app, 'test', {}, undefined, undefined, undefined);
    });

    it('5. parseFilter', async (): Promise<void> => {
        FSUtilTypeOrm.parseFilter(app, 'test', {}, {}, undefined, undefined);
    });

    it('6. parseFilter', async (): Promise<void> => {
        FSUtilTypeOrm.parseFilter(app, 'test', {}, {}, testService, undefined);
    });

    it('7. parseFilter', async (): Promise<void> => {
        const test: string = 'test';
        const test2: string = `${test}Test2`;

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb, {
            subitems: ['tests']
        });

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.tests.id': 1
        }, {
            tests: {
                id: 'integer'
            }
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT
            '${test}'.'id'   AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active',

            '${test2}'.'id'         AS '${test2}_id',
            '${test2}'.'test'       AS '${test2}_test'
            
            FROM 'Test' '${test}'
            LEFT JOIN 'Test2' '${test2}' ON '${test2}'.'test'='${test}'.'id'

            WHERE '${test2}'.'id' = ?
        `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test2}.id`] = 1;

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('8. parseFilter', async (): Promise<void> => {
        const test3: string = 'test3';
        const test2: string = `${test3}Test2`;
        const test: string = `${test2}Test`;

        const qb: SelectQueryBuilder<Test3> = testService3.getRepository().createQueryBuilder(test3);

        testService3.setJoins(test3, qb);

        FSUtilTypeOrm.parseFilter(app, test3, {
            'test3.test.test.id': 1
        }, {
            test: {
                test: {
                    id: 'integer'
                }
            }
        }, testService3, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test3}'.'id'         AS '${test3}_id', 
            '${test3}'.'test'       AS '${test3}_test',

            '${test2}'.'id'         AS '${test2}_id',
            '${test2}'.'test'       AS '${test2}_test',

            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'
            
            FROM 'Test3' '${test3}'
            INNER JOIN 'Test2' '${test2}' ON '${test2}'.'id'='${test3}'.'test'
            INNER JOIN 'Test' '${test}' ON '${test}'.'id'='${test2}'.'test'

            WHERE '${test}'.'id' = ?
        `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.id`] = 1;

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('9. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.id': 'null'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'
            
            WHERE '${test}'.'id' IS NULL
        `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        expect(await qb.getCount()).to.be.eq(0);
    });

    it('10. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {}, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'
            
            FROM 'Test' '${test}'
        `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(8);
    });

    it('11. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.id': `${Security.encodeId(app.config.security, 1)},other`
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'
            
            FROM 'Test' '${test}'

            WHERE '${test}'.'id' IN (?)
        `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.id`] = [1];

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('12. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.id': `${Security.encodeId(app.config.security, 1)}`
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'
            
            FROM 'Test' '${test}'

            WHERE '${test}'.'id' = ?
        `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.id`] = 1;

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('13. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.id': 'invalid id'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'
        `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(8);
    });

    it('14. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.permalink': 'null'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'permalink' IS NULL
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(7);
    });

    it('15. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.permalink': 'test,test2'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'permalink' IN (?)
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.permalink`] = ['test', 'test2'];

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('16. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.permalink': 'test'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'permalink' = ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.permalink`] = 'test';

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('17. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.name': 'null'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'name' IS NULL
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(7);
    });

    it('18. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.name': 'te'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'name' LIKE ? COLLATE utf8_general_ci
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.name`] = '%te%';

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('19. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.name': undefined
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(8);
    });

    it('20. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.qtty': undefined
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());
    });

    it('21. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.qtty': '1;2'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'qtty' BETWEEN ? AND ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.qtty0`] = 1;
        params[`${test}.qtty1`] = 2;

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('22. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.qtty': '1'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'qtty' = ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.qtty`] = 1;

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(0);
    });

    it('23. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.qtty': 'null'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'qtty' IS NULL
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};

        expect(qb.getParameters()).to.be.deep.eq(params);

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(7);
    });

    it('24. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.value': undefined
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(8);
    });

    it('25. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.value': '1.0;2.0'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'value' BETWEEN ? AND ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.value0`] = 1.0;
        params[`${test}.value1`] = 2.0;

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('26. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.value': '1.0'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'value' = ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.value`] = 1.0;

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(0);
    });

    it('27. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.value': 'null'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'value' IS NULL
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};

        expect(qb.getParameters()).to.be.deep.eq(params);

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(7);
    });

    it('28. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.init': undefined
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(8);
    });

    it('29. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.init': '01/01/2021;31/12/2021'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'init' BETWEEN ? AND ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.init0`] = Dates.toDate('01/01/2021');
        params[`${test}.init1`] = Dates.toDate('01/01/2022');

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('30. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            'test.init': '01/01/2021'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'init' = ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.init`] = Dates.toDate('01/01/2021');

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('31. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.created_at': 'null'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'created_at' IS NULL
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(7);
    });

    it('32. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.created_at': undefined
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(8);
    });

    it('33. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.created_at': '01/01/2021 10:00;01/01/2021 11:00'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'created_at' BETWEEN ? AND ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.created_at0`] = Dates.toDateTime('01/01/2021 10:00');
        params[`${test}.created_at1`] = Dates.toDateTime('01/01/2021 11:00');

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(0);
    });

    it('34. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.created_at': '01/01/2021 10:00'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'created_at' = ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.created_at`] = Dates.toDateTime('01/01/2021 10:00');

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(0);
    });

    it('35. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.created_at': '01/01/2021 10:00'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'created_at' = ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.created_at`] = Dates.toDateTime('01/01/2021 10:00');

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(0);
    });

    it('36. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.created_at': 'null'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'created_at' IS NULL
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};

        expect(qb.getParameters()).to.be.deep.eq(params);

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(7);
    });

    it('37. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.active': undefined
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        expect(qb.getParameters()).to.be.deep.eq(params);

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(8);
    });

    it('38. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.active': 'true'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'active' = ?
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.active`] = true;

        expect(qb.getParameters()).to.be.deep.eq(params);

        expect(await qb.getCount()).to.be.eq(1);
    });

    it('39. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.active': 'null'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE '${test}'.'active' IS NULL
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};

        expect(qb.getParameters()).to.be.deep.eq(params);

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(7);
    });

    it('40. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = testService.getRepository().createQueryBuilder(test);

        testService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.active': 'false'
        }, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, testService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'

            WHERE ('test'.'active' = ? OR 'test'.'active' IS NULL)
            `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        const params: any = {};
        params[`${test}.active`] = false;

        expect(qb.getParameters()).to.be.deep.eq(params);

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(7);
    });

    it('41. parseFilter', async (): Promise<void> => {
        const test: string = 'test';

        const qb: SelectQueryBuilder<Test> = invalidService.getRepository().createQueryBuilder(test);

        invalidService.setJoins(test, qb);

        FSUtilTypeOrm.parseFilter(app, test, {}, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, invalidService, qb);

        expect(qb.getSql().replace(/\s+/ig, ' ')).to.be.eq(`
            SELECT 
            '${test}'.'id'          AS '${test}_id',
            '${test}'.'name'        AS '${test}_name',
            '${test}'.'_id'         AS '${test}__id',
            '${test}'.'permalink'   AS '${test}_permalink',
            '${test}'.'qtty'        AS '${test}_qtty',
            '${test}'.'value'       AS '${test}_value',
            '${test}'.'init'        AS '${test}_init',
            '${test}'.'created_at'  AS '${test}_created_at',
            '${test}'.'active'      AS '${test}_active'

            FROM 'Test' '${test}'
        `.replace(/[\r|\n|\t]/ig, '').replace(/\s+/ig, ' ').replace(/'/ig, '`').trim());

        expect(qb.getParameters()).to.be.deep.eq({});

        // eslint-disable-next-line no-magic-numbers
        expect(await qb.getCount()).to.be.eq(8);
    });

    it('42. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, undefined);

        expect(sort).to.be.deep.eq({});
    });

    it('43. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, 'id');

        expect(sort).to.be.deep.eq({
            id: 'ASC'
        });
    });

    it('44. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, 'invalid');

        expect(sort).to.be.deep.eq({});
    });

    it('45. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, 'id:ASC');

        expect(sort).to.be.deep.eq({
            id: 'ASC'
        });
    });

    it('46. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, 'id:desc');

        expect(sort).to.be.deep.eq({
            id: 'DESC'
        });
    });

    it('47. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, 'id:DESC');

        expect(sort).to.be.deep.eq({
            id: 'DESC'
        });
    });

    it('48. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, 'test.id:ASC');

        expect(sort).to.be.deep.eq({
            'test.id': 'ASC'
        });
    });

    it('49. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, 'other.id:ASC');

        expect(sort).to.be.deep.eq({});
    });

    it('50. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean'
        }, 'id:ASC,permalink:DESC,name');

        expect(sort).to.be.deep.eq({
            id: 'ASC',
            permalink: 'DESC',
            name: 'ASC'
        });
    });

    it('51. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            tests: {
                id: 'id',
                permalink: 'permalink',
                name: 'string',
                qtty: 'integer',
                value: 'float',
                init: 'date',
                created_at: 'datetime',
                active: 'boolean'
            }
        }, 'test.tests.id:ASC', testService);

        expect(sort).to.be.deep.eq({
            'testTest2.id': 'ASC'
        });
    });

    it('52. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            tests: {
                tests: {
                    id: 'id',
                    permalink: 'permalink',
                    name: 'string',
                    qtty: 'integer',
                    value: 'float',
                    init: 'date',
                    created_at: 'datetime',
                    active: 'boolean'
                }
            }
        }, 'test.tests.tests.id:ASC', testService);

        expect(sort).to.be.deep.eq({
            'testTest2Test3.id': 'ASC'
        });
    });

    it('52. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilTypeOrm.parseSorting(test, {
            tests: {
                tests: {
                    id: 'id',
                    permalink: 'permalink',
                    name: 'string',
                    qtty: 'integer',
                    value: 'float',
                    init: 'date',
                    created_at: 'datetime',
                    active: 'boolean'
                }
            }
        }, 'test.tests.tests.id:ASC', invalidService);

        expect(sort).to.be.deep.eq({});
    });
});
