import App from '@dfgpublicidade/node-app-module';
import Dates from '@dfgpublicidade/node-dates-module';
import { DefaultService, MongoManager } from '@dfgpublicidade/node-mongodb-module';
import Security from '@dfgpublicidade/node-security-module';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { Db, MongoClient, ObjectId } from 'mongodb';
import { FSUtilMongoDb } from '../../src';

class Test {
    public _id: ObjectId;
    public code: number;
    public name: string;
    public permalink: string;
    public qtty: number;
    public value: number;
    public init: Date;
    public created_at: Date;
    public active: boolean;
    public text: any;
    public tests: {
        _id: ObjectId;
        permalink: string;
        tests: {
            _id: ObjectId;
            permalink: string;
        }[];
    }[];
}

class TestService extends DefaultService {
    protected static readonly collection: string = 'test';
    protected static readonly query: any = {
        // eslint-disable-next-line no-null/no-null
        deleted_at: null
    };
    protected static readonly sort: any = {
        _id: 1
    };

    public static async listar(db: Db, query: any, options?: {
        sort?: any;
    }): Promise<Test[]> {
        return this.list(db, query, options);
    }

    public static async contar(db: Db, query: any): Promise<number> {
        return this.count(db, query);
    }

    public static async buscarPorId(db: Db, id: ObjectId): Promise<Test> {
        return this.findById(db, id);
    }

    public static async inserir(db: Db, entity: Test): Promise<Test> {
        return this.insert(db, entity);
    }

    public static async atualizar(db: Db, entity: Test, update: any): Promise<Test> {
        return this.update(db, entity, update);
    }

    public static async excluir(db: Db, entity: Test): Promise<Test> {
        return this.delete(db, entity);
    }
}

describe('fsUtilMongoDb', (): void => {
    let app: App;
    let db: Db;

    let test: any;

    before(async (): Promise<void> => {
        if (!process.env.MONGO_TEST_URL) {
            throw new Error('MONGO_TEST_URL must be set.');
        }

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

        test = {
            code: 1,
            name: 'Test A',
            permalink: '0001',
            qtty: 1,
            value: 10.5,
            init: Dates.toDate('01/01/2021'),
            created_at: Dates.toDateTime('01/01/2021 10:00'),
            active: true,
            text: {
                'pt-BR': 'teste'
            },
            tests: [{
                name: 'Test B',
                permalink: '0002',
                tests: [{
                    name: 'Test C',
                    permalink: '0003'
                }]
            }]
        };

        const client: MongoClient = await MongoManager.connect({
            url: process.env.MONGO_TEST_URL,
            options: {
                poolSize: 20,
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        });

        db = client.db();

        test = (await db.collection('test').insertOne(test)).ops[0];
    });

    after(async (): Promise<void> => {
        await db.collection('test').drop();

        await MongoManager.close();
    });

    it('1. parseFilter', async (): Promise<void> => {
        FSUtilMongoDb.parseFilter(undefined, undefined, undefined, undefined);
    });

    it('2. parseFilter', async (): Promise<void> => {
        FSUtilMongoDb.parseFilter(app, undefined, undefined, undefined);
    });

    it('3. parseFilter', async (): Promise<void> => {
        FSUtilMongoDb.parseFilter(app, 'test', undefined, undefined);
    });

    it('4. parseFilter', async (): Promise<void> => {
        FSUtilMongoDb.parseFilter(app, 'test', {}, undefined);
    });

    it('5. parseFilter', async (): Promise<void> => {
        FSUtilMongoDb.parseFilter(app, 'test', {}, {});
    });

    it('7. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            'test.tests.permalink': '0002'
        }, {
            tests: {
                permalink: 'permalink'
            }
        });

        expect(query).to.be.deep.eq({
            'tests.permalink': '0002'
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('8. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            'test.tests.tests.permalink': '0003'
        }, {
            tests: {
                tests: {
                    permalink: 'permalink'
                }
            }
        });

        expect(query).to.be.deep.eq({
            'tests.tests.permalink': '0003'
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('9. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test._id': test._id.toHexString()
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            _id: test._id
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('10. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.id': test._id.toHexString()
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            _id: test._id
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('11. parseFilter', async (): Promise<void> => {
        const objectId: ObjectId = new ObjectId();

        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.id': `${test._id.toHexString()},${objectId.toHexString()}`
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            _id: {
                $in: [test._id, objectId]
            }
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('12. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.id': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            _id: null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('13. parseFilter', async (): Promise<void> => {
        const code: string = Security.encodeId(app.config.security, 1);

        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.code': code
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            code: 1
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('14. parseFilter', async (): Promise<void> => {
        const code: string = Security.encodeId(app.config.security, 1);
        const code2: string = Security.encodeId(app.config.security, 2);

        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.code': `${code},${code2}`
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            code: {
                $in: [1, 2]
            }
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('14. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.code': '123'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({});

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('15. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.code': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            code: null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('16. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.permalink': '0001'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            permalink: '0001'
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('17. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.permalink': '0001,0002'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            permalink: {
                $in: ['0001', '0002']
            }
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('18. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.permalink': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            permalink: null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('17. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.name': 'te'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            name: {
                $regex: /t[eèéëê]/gim
            }
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('18. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.name': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            name: null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('19. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.qtty': '1'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            qtty: 1
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('20. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.qtty': '1;3'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            qtty: {
                $gte: 1,
                $lte: 3
            }
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('21. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.qtty': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            qtty: null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('22. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.value': '10.5'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            value: 10.5
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('23. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.value': '10.5;30.5'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            value: {
                $gte: 10.5,
                $lte: 30.5
            }
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('24. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.value': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            value: null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('25. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.init': '01/01/2021'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            init: Dates.toDate('01/01/2021')
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('26. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.init': '01/01/2021;31/12/2021'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            init: {
                $gte: Dates.toDate('01/01/2021'),
                $lte: Dates.toDate('01/01/2022')
            }
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('27. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.init': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            init: null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('28. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.created_at': '01/01/2021 10:00'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            created_at: Dates.toDateTime('01/01/2021 10:00')
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('29. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.created_at': '01/01/2021 10:00;01/01/2021 11:00'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            created_at: {
                $gte: Dates.toDateTime('01/01/2021 10:00'),
                $lte: Dates.toDateTime('01/01/2021 11:00')
            }
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('30. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.created_at': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            created_at: null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('31. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.active': 'true'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            active: true
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('32. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.active': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            active: null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('33. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.active': 'false'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            $or: [{
                active: false
            }, {
                // eslint-disable-next-line no-null/no-null
                active: null
            }]
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('34. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.text': 'te'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            'text.pt-BR': {
                $regex: /t[eèéëê]/gim
            }
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([test]);
    });

    it('35. parseFilter', async (): Promise<void> => {
        const query: any = FSUtilMongoDb.parseFilter(app, 'test', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'test.text': 'null'
        }, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        });

        expect(query).to.be.deep.eq({
            // eslint-disable-next-line no-null/no-null
            'text.pt-BR': null
        });

        expect(await TestService.listar(db, query)).to.be.deep.eq([]);
    });

    it('36. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilMongoDb.parseSorting(test, {
            _id: 'objectId',
            code: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        }, undefined);

        expect(sort).to.be.deep.eq({});
    });

    it('37. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilMongoDb.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        }, 'id');

        expect(sort).to.be.deep.eq({
            id: 1
        });
    });

    it('38. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilMongoDb.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        }, 'invalid');

        expect(sort).to.be.deep.eq({});
    });

    it('39. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilMongoDb.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        }, 'id:ASC');

        expect(sort).to.be.deep.eq({
            id: 1
        });
    });

    it('40. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilMongoDb.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        }, 'id:desc');

        expect(sort).to.be.deep.eq({
            id: -1
        });
    });

    it('41. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilMongoDb.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        }, 'id:DESC');

        expect(sort).to.be.deep.eq({
            id: -1
        });
    });

    it('42. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilMongoDb.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        }, 'test.id');

        expect(sort).to.be.deep.eq({
            id: 1
        });
    });

    it('43. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilMongoDb.parseSorting(test, {
            id: 'id',
            permalink: 'permalink',
            name: 'string',
            qtty: 'integer',
            value: 'float',
            init: 'date',
            created_at: 'datetime',
            active: 'boolean',
            text: ['string', 'pt-BR']
        }, 'text');

        expect(sort).to.be.deep.eq({
            'text.pt-BR': 1
        });
    });

    it('44. parseSorting', async (): Promise<void> => {
        const test: string = 'test';

        const sort: any = FSUtilMongoDb.parseSorting(test, {
            tests: {
                id: 'id'
            }
        }, 'test.tests.id');

        expect(sort).to.be.deep.eq({
            'tests.id': 1
        });
    });
});
