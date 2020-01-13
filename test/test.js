const chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);

const assert = chai.assert;
const expect = chai.expect;

// Sinon is a library used for mocking or verifying function calls in JavaScript.
const sinon = require('sinon');

// we gonna stub some functions here
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const test = require('firebase-functions-test')();
const {ReferenceMock, DatabaseMock, SnapshotMock} = require('paytip-mocks');

describe('Gator', () => {
    describe('_parseQuery', () => {
        beforeEach(() => {            
            theModule = require('../');
            
        });
        afterEach(() => {            
        });
        
        it('pageSize is set when provided', () => {
            dto = {
                s: 120
            }
            query = theModule._parseQuery(dto);
            return expect(query.pageSize).equal(dto.s);
        })
        
        it('direction is set when provided', () => {
            dto = {
                d: 'd'
            }
            query = theModule._parseQuery(dto);            
            return expect(query.direction).equal(dto.d);
        })
        it('direction default is used when not provided', () => {
            dto = {                
            }
            query = theModule._parseQuery(dto);
            return expect(query.direction).equal(theModule.options.DEFAULT_DIRECTION);
        })
    });
    describe('_page', () => {
        let REFERENCE = 'some/reference';

        beforeEach(() => {            
            theModule = require('../');
            ref = new ReferenceMock();
            obcStub = ref.stubOrderByChild();
            etStub = ref.stubEqualTo();
            ltlStub = ref.stubLimitToLast();
            ltfStub = ref.stubLimitToFirst();
            saStub = ref.stubStartAt();
            eaStub = ref.stubEndAt();
            dbMock = new DatabaseMock();
            dbMock.stubRefWithMatcher(ref, sinon.match(REFERENCE));
            theModule.init(dbMock);
        });
        afterEach(() => {   
            dbMock.stubsRestore();         
            obcStub.restore();
            etStub.restore();
            ltlStub.restore();
            ltfStub.restore();
            saStub.restore();
            eaStub.restore();
        });
        
        it('orderBy', () => {
            dto = {
                r: REFERENCE,
                o: 'property',
                d: 'd',
                s: 100,
                n: 'startEl',
                v: 'value'
            }
            queryRef = theModule._page(dto, dbMock);            
            return assert(obcStub.called, 'orderBy not called');           
        })   
        it('equalTo', () => {
            dto = {
                r: REFERENCE,
                
                d: 'd',
                s: 100,
                n: 'startEl',
                v: 'value'
            }
            queryRef = theModule._page(dto, dbMock);            
            return assert(etStub.called,'equalTo not called');
        })                
        it('pagination ascending 1', () => {
            dto = {
                r: REFERENCE,
                o: 'property',
                d: 'a',
                s: 100,
                n: 'startEl',
                v: 'value'
            }
            queryRef = theModule._page(dto, dbMock);            
            return assert(ltfStub.called, 'limitToFirst not called');           
        }) 
        it('pagination ascending 2', () => {
            dto = {
                r: REFERENCE,
                o: 'property',
                d: 'a',
                s: 100,
                n: 'startEl',
                v: 'value'
            }
            queryRef = theModule._page(dto, dbMock);            
            return assert(saStub.called, 'startAt not called');           
        }) 
        it('pagination descending 1', () => {
            dto = {
                r: REFERENCE,
                o: 'property',
                d: 'd',
                s: 100,
                n: 'startEl',
                v: 'value'
            }
            queryRef = theModule._page(dto, dbMock);            
            return assert(ltlStub.called, 'limitToLast not called');           
        }) 
        it('pagination descending 2', () => {
            dto = {
                r: REFERENCE,
                o: 'property',
                d: 'd',
                s: 100,
                n: 'startEl',
                v: 'value'
            }
            queryRef = theModule._page(dto, dbMock);            
            return assert(eaStub.called, 'endAt not called');           
        }) 
    });
    describe('single where query', () => {
        let REFERENCE = 'some/reference';
        let VALUE = 'malina';
        let COLUMN = 'property/field';

        beforeEach(() => {            
            theModule = require('../');
            ref = new ReferenceMock();
            obcStub = ref.stubOrderByChild();
            etStub = ref.stubEqualTo();
            ltlStub = ref.stubLimitToLast();
            ltfStub = ref.stubLimitToFirst();
            saStub = ref.stubStartAt();
            eaStub = ref.stubEndAt();
            
            dbMock = new DatabaseMock();
            dbMock.stubRefWithMatcher(ref, sinon.match(REFERENCE));
            theModule.init(dbMock);
        });
        afterEach(() => {   
            dbMock.stubsRestore();         
            obcStub.restore();
            etStub.restore();
            ltlStub.restore();
            ltfStub.restore();
            saStub.restore();
            eaStub.restore();
            oStub.restore();
        });
        
        it('where condition (1)', () => {
            snap = new SnapshotMock();
            snap.stubExists(false);
            oStub = ref.stubOnce(new Promise(function(resolve, reject){
                resolve(snap);
            }))

            query = theModule.query(REFERENCE); 
            
            query = query.where('col1/a','malina');
            console.log(""+query);
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.m.s).equal(0);
            })            
        })    

        it('where condition (2)', () => {
            snap = new SnapshotMock();
            snap.stubExists(false);
            oStub = ref.stubOnce(new Promise(function(resolve, reject){
                resolve(snap);
            }))

            query = theModule.query(REFERENCE); 
            
            query = query.where(COLUMN,VALUE);
            console.log(""+query);
            promise = query.execute();
            return promise.then(result=>{                
                return assert(etStub.called, 'equalTo was not called');
            })            
        })    
        it('where condition (3)', () => {
            snap = new SnapshotMock();
            snap.stubExists(false);
            oStub = ref.stubOnce(new Promise(function(resolve, reject){
                resolve(snap);
            }))

            query = theModule.query(REFERENCE); 
            
            query = query.where(COLUMN,VALUE);
            console.log(""+query);
            promise = query.execute();
            return promise.then(result=>{   
                call = etStub.getCall(0);             
                return expect(call.args[0]).equal(VALUE)
            })            
        })  
        it('where condition (4)', () => {
            snap = new SnapshotMock();
            snap.stubExists(false);
            oStub = ref.stubOnce(new Promise(function(resolve, reject){
                resolve(snap);
            }))

            query = theModule.query(REFERENCE); 
            
            query = query.where(COLUMN,VALUE);
            console.log(""+query);
            promise = query.execute();
            return promise.then(result=>{   
                call = obcStub.getCall(0);             
                return expect(call.args[0]).equal(COLUMN)
            })            
        })     
    });
    describe('single where query with pagination', () => {
        let REFERENCE = 'some/reference';
        let VALUE = 'malina';
        let COLUMN = 'property/field';
        let LIMIT = 2;
        let START_ELEMNT = 'wisnia';
        let LAST = {
            name: 'Zieg',
            surname: 'Ziegler'
        }

        beforeEach(() => {            
            theModule = require('../');
            ref = new ReferenceMock();
            obcStub = ref.stubOrderByChild();
            etStub = ref.stubEqualTo();
            ltlStub = ref.stubLimitToLast();
            ltfStub = ref.stubLimitToFirst();
            saStub = ref.stubStartAt();
            eaStub = ref.stubEndAt();

            s1 = new SnapshotMock();
            s1.stubVal({
                name: 'John',
                surname: 'Pawlak'
            });
            s2 = new SnapshotMock();
            s2.stubVal({
                name: 'Chris',
                surname: 'September'
            });
            s3 = new SnapshotMock();
            s3.stubVal(LAST);
            snapArray = [ s1, s2, s3];
            snap = new SnapshotMock();
            snap.stubExists(true);
            snap.stubForEach(snapArray);
            oStub = ref.stubOnce(new Promise(function(resolve, reject){
                resolve(snap);
            }))
            
            dbMock = new DatabaseMock();
            dbMock.stubRefWithMatcher(ref, sinon.match(REFERENCE));
            theModule.init(dbMock);
        });
        afterEach(() => {   
            dbMock.stubsRestore();         
            obcStub.restore();
            etStub.restore();
            ltlStub.restore();
            ltfStub.restore();
            saStub.restore();
            eaStub.restore();
            oStub.restore();            
        });
        
        it('where condition with limit (1)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.where(COLUMN,VALUE).limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.m.s).equal(2);
            })            
        })    
        it('where condition with limit (2)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.where(COLUMN,VALUE).limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                call = ltfStub.getCall(0);
                return expect(call.args[0]).equal(LIMIT+1);
            })            
        })
        it('where condition with limit (3)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.where(COLUMN,VALUE).limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                
                return expect(result.m.n).equal(LAST);
            })            
        })
        it('where condition with limit (4)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.where(COLUMN,VALUE).limit(LIMIT).start(START_ELEMNT);
            
            promise = query.execute();
            return promise.then(result=>{
                call = saStub.getCall(0);
                return expect(call.args[0]).equal(START_ELEMNT);
            })            
        })     

    
    });
    describe('single orderBy query', () => {
        let REFERENCE = 'some/reference';
        let DIRECTION = 'a';
        let COLUMN = 'property/field';
        let LIMIT = 250;
        let START_ELEMNT = 'wisnia';
        let START = {
            name: 'John',
            surname: 'Pawlak'
        }
        let END = {
            name: 'Zieg',
            surname: 'Ziegler'
        }

        beforeEach(() => {            
            theModule = require('../');
            ref = new ReferenceMock();
            obcStub = ref.stubOrderByChild();
            etStub = ref.stubEqualTo();
            ltlStub = ref.stubLimitToLast();
            ltfStub = ref.stubLimitToFirst();
            saStub = ref.stubStartAt();
            eaStub = ref.stubEndAt();

            s1 = new SnapshotMock();
            s1.stubVal(START);
            s2 = new SnapshotMock();
            s2.stubVal({
                name: 'Chris',
                surname: 'September'
            });
            s3 = new SnapshotMock();
            s3.stubVal(END);
            snapArray = [ s1, s2, s3];
            snap = new SnapshotMock();
            snap.stubExists(true);
            snap.stubForEach(snapArray);
            oStub = ref.stubOnce(new Promise(function(resolve, reject){
                resolve(snap);
            }))
            
            dbMock = new DatabaseMock();
            dbMock.stubRefWithMatcher(ref, sinon.match(REFERENCE));
            theModule.init(dbMock);
        });
        afterEach(() => {   
            dbMock.stubsRestore();         
            obcStub.restore();
            etStub.restore();
            ltlStub.restore();
            ltfStub.restore();
            saStub.restore();
            eaStub.restore();
            oStub.restore();            
        });
        
        it('simplest order by', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,DIRECTION);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.m.s).equal(3);
            })            
        })    
        it('simplest order by with default direction (1)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[0].v).equal(START);
            })            
        })   
        it('simplest order by with default direction (2)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[2].v).equal(END);
            })            
        })  
        it('simplest order by with ascending direction (1)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN, query.DIRECTION.ASC);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[0].v).equal(START);
            })            
        })   
        it('simplest order by with ascending direction (2)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN, query.DIRECTION.ASC);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[2].v).equal(END);
            })            
        }) 
        it('simplest order by with descending direction (1)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN, query.DIRECTION.DESC);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[0].v).equal(END);
            })            
        })   
        it('simplest order by with descending direction (2)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN, query.DIRECTION.DESC);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[2].v).equal(START);
            })            
        }) 
    

    
    });
    describe('orderBy with where query', () => {
        let REFERENCE = 'some/reference';
        let DIRECTION = 'a';
        let VALUE = 'malina';
        let COLUMN = 'property/field';
        let LIMIT = 250;
        let START_ELEMNT = 'wisnia';
        let START = {
            name: 'John',
            surname: 'Pawlak'
        }
        let END = {
            name: 'Zieg',
            surname: 'Ziegler'
        }

        beforeEach(() => {            
            theModule = require('../');
            ref = new ReferenceMock();
            obcStub = ref.stubOrderByChild();
            etStub = ref.stubEqualTo();
            ltlStub = ref.stubLimitToLast();
            ltfStub = ref.stubLimitToFirst();
            saStub = ref.stubStartAt();
            eaStub = ref.stubEndAt();

            s1 = new SnapshotMock();
            s1.stubVal(START);
            s2 = new SnapshotMock();
            s2.stubVal({
                name: 'Chris',
                surname: 'September'
            });
            s3 = new SnapshotMock();
            s3.stubVal(END);
            snapArray = [ s1, s2, s3];
            snap = new SnapshotMock();
            snap.stubExists(true);
            snap.stubForEach(snapArray);
            oStub = ref.stubOnce(new Promise(function(resolve, reject){
                resolve(snap);
            }))
            
            dbMock = new DatabaseMock();
            dbMock.stubRefWithMatcher(ref, sinon.match(REFERENCE));
            theModule.init(dbMock);
        });
        afterEach(() => {   
            dbMock.stubsRestore();         
            obcStub.restore();
            etStub.restore();
            ltlStub.restore();
            ltfStub.restore();
            saStub.restore();
            eaStub.restore();
            oStub.restore();            
        });
        
        it('orderBy and where', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,DIRECTION);
            query = query.where(COLUMN, VALUE);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.m.s).equal(3);
            })            
        })    
        it('where and orderBy', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.where(COLUMN, VALUE);
            query = query.orderBy(COLUMN,DIRECTION);
            
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.m.s).equal(3);
            })            
        })  
        it('make sure equalTo condition will be applied', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.where(COLUMN, VALUE);
            query = query.orderBy(COLUMN,DIRECTION);
                        
            promise = query.execute();
            return promise.then(result=>{
                call = etStub.getCall(0);
                return expect(call.args[0]).equal(VALUE);
            })            
        })  
        
    

    
    });
    describe('orderBy with where and pagination query', () => {
        let REFERENCE = 'some/reference';
        let DIRECTION = 'a';
        let VALUE = 'malina';
        let COLUMN = 'name';
        let LIMIT = 2;
        let START_ELEMNT = 'wisnia';
        let START = {
            name: 'John',
            surname: 'Pawlak'
        }
        let MID = {
            name: 'Chris',
            surname: 'September'
        }
        let END = {
            name: 'Zieg',
            surname: 'Ziegler'
        }

        beforeEach(() => {            
            theModule = require('../');
            ref = new ReferenceMock();
            obcStub = ref.stubOrderByChild();
            etStub = ref.stubEqualTo();
            ltlStub = ref.stubLimitToLast();
            ltfStub = ref.stubLimitToFirst();
            saStub = ref.stubStartAt();
            eaStub = ref.stubEndAt();

            s1 = new SnapshotMock();
            s1.stubVal(START);
            s2 = new SnapshotMock();
            s2.stubVal(MID);
            s3 = new SnapshotMock();
            s3.stubVal(END);
            snapArray = [ s1, s2, s3];
            snap = new SnapshotMock();
            snap.stubExists(true);
            snap.stubForEach(snapArray);
            oStub = ref.stubOnce(new Promise(function(resolve, reject){
                resolve(snap);
            }))
            
            dbMock = new DatabaseMock();
            dbMock.stubRefWithMatcher(ref, sinon.match(REFERENCE));
            theModule.init(dbMock);
        });
        afterEach(() => {   
            dbMock.stubsRestore();         
            obcStub.restore();
            etStub.restore();
            ltlStub.restore();
            ltfStub.restore();
            saStub.restore();
            eaStub.restore();
            oStub.restore();            
        });
        
        it('make sure that returned array size matches limit', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,DIRECTION);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.m.s).equal(LIMIT);
            })            
        })   
        it('ascending - make sure that proper elements are returned (1)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.ASC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[0].v).equal(START);
            })            
        })  
        it('ascending - make sure that proper elements are returned (2)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.ASC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[1].v).equal(MID);
            })            
        }) 
        it('ascending - make sure that proper next element is returned', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.ASC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.m.n).equal(END.name);
            })            
        }) 
        it('descending - make sure that proper elements are returned (1)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.DESC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[0].v).equal(END);
            })            
        })  
        it('descending - make sure that proper elements are returned (2)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.DESC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.d[1].v).equal(MID);
            })            
        }) 
        it('descending - make sure that proper next element is returned', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.DESC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                return expect(result.m.n).equal(START.name);
            })            
        }) 
        it('descending - make sure that calls will be made (1)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.DESC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                call = ltlStub.getCall(0);
                return expect(call.args[0]).equal(LIMIT+1);
            })            
        }) 
        it('descending - make sure that calls will be made (2)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.ASC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                call = ltfStub.getCall(0);
                return expect(call.args[0]).equal(LIMIT+1);
            })            
        }) 
        it('descending - make sure that calls will be made (3)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.ASC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT).start(START_ELEMNT);
            
            promise = query.execute();
            return promise.then(result=>{
                call = saStub.getCall(0);
                return expect(call.args[0]).equal(START_ELEMNT);
            })            
        }) 
        it('descending - make sure that calls will be made (4)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(COLUMN,query.DIRECTION.DESC);
            query = query.where(COLUMN, VALUE);
            query = query.limit(LIMIT).start(START_ELEMNT);
            
            promise = query.execute();
            return promise.then(result=>{
                call = eaStub.getCall(0);
                return expect(call.args[0]).equal(START_ELEMNT);
            })            
        })
         
        
    

    
    });
    describe('multi column orderBy with where and pagination query', () => {
        let REFERENCE = 'some/reference';
        let DIRECTION = 'a';
        let VALUE = 'malina';
        let FILTER_COLUMN = 'prop2/field3';
        let ORDER_BY_COLUMN = 'address/city';
        let LIMIT = 2;
        let START_ELEMENT = 'Warsaw';
        let START = {
            name: 'John',
            surname: 'Pawlak',
            address: {
                city: 'Warsaw'
            }
        }
        let MID = {
            name: 'Chris',
            surname: 'September',
            address: {
                city: 'Gdansk'
            }
        }
        let END = {
            name: 'Zieg',
            surname: 'Ziegler',
            address: {
                city: 'Poznań'
            }
        }

        beforeEach(() => {            
            theModule = require('../');
            ref = new ReferenceMock();
            obcStub = ref.stubOrderByChild();
            etStub = ref.stubEqualTo();
            ltlStub = ref.stubLimitToLast();
            ltfStub = ref.stubLimitToFirst();
            saStub = ref.stubStartAt();
            eaStub = ref.stubEndAt();

            s1 = new SnapshotMock();
            s1.stubVal(START);
            s2 = new SnapshotMock();
            s2.stubVal(MID);
            s3 = new SnapshotMock();
            s3.stubVal(END);
            snapArray = [ s1, s2, s3];
            snap = new SnapshotMock();
            snap.stubExists(true);
            snap.stubForEach(snapArray);
            oStub = ref.stubOnce(new Promise(function(resolve, reject){
                resolve(snap);
            }))
            
            dbMock = new DatabaseMock();
            dbMock.stubRefWithMatcher(ref, sinon.match(REFERENCE));
            theModule.init(dbMock);
        });
        afterEach(() => {   
            dbMock.stubsRestore();         
            obcStub.restore();
            etStub.restore();
            ltlStub.restore();
            ltfStub.restore();
            saStub.restore();
            eaStub.restore();
            oStub.restore();            
        });
        
        it('make sure that returned array size matches limit', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(ORDER_BY_COLUMN,DIRECTION);
            query = query.where(FILTER_COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                
                return expect(result.m.s).equal(LIMIT);
            })            
        })   
        it('ascending - make sure that returned array is properly ordered (1)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(ORDER_BY_COLUMN,DIRECTION);
            query = query.where(FILTER_COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                
                return expect(result.d[0].v).equal(MID);
            })            
        })
        it('ascending - make sure that returned array is properly ordered (2)', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(ORDER_BY_COLUMN,DIRECTION);
            query = query.where(FILTER_COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                
                return expect(result.d[1].v).equal(END);
            })            
        })
        it('ascending - make sure that proper next element is returned', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(ORDER_BY_COLUMN,DIRECTION);
            query = query.where(FILTER_COLUMN, VALUE);
            query = query.limit(LIMIT);
            
            promise = query.execute();
            return promise.then(result=>{
                
                return expect(result.m.n).equal(START.address.city);
            })            
        })
        it('ascending - make sure that pagination works', () => {
            query = theModule.query(REFERENCE); 
            
            query = query.orderBy(ORDER_BY_COLUMN,DIRECTION);
            query = query.where(FILTER_COLUMN, VALUE);
            query = query.limit(LIMIT);
            query = query.start(START_ELEMENT);
            
            promise = query.execute();
            return promise.then(result=>{                
                return expect(result.d.length).equal(1);
            })            
        })

         
        
    

    
    });
    

    //dbMock.stubRefWithMatcher(userWalletReferenceMock10, sinon.match('10UserId'));
});