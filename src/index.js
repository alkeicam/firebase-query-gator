var resolvePath = require('object-resolve-path');

class Query {
    constructor(databseReference, reference, gator) {
        this.tokens = []
        this.db = databseReference;
        this.ref = reference;
        this.gator = gator;
        this.andCount = 0;
        this.orCount = 0;
        this.whereCount = 0;
        this.whereInCount = 0;
        this.orderByCount = 0;
        this.limitCount = 0;
        this.startCount = 0;
        this.DIRECTION = {
            ASC: 'a',
            DESC: 'd'
        }
    }
    toString() {
        return 'Query={ ref: ' + this.ref + ', tokens: ' + this.tokens + ', andCount:'+this.andCount + ', orCount:'+this.orCount + ', whereCount:'+this.whereCount + ', whereInCount:'+this.whereInCount + ', orderByCount:'+this.orderByCount + ', limitCount:'+this.limitCount + ', startCount:'+this.startCount+'}';
    }

    /**
     * @returns Promise that resolves when query performed successfully, or rejects in case of error
     */
    execute() {
        // console.log('Executing: '+this);
        // find orderBy
        // jak nie ma to znaczy ze nie 
        var queriesHandlers = [
            this._singleColumnFilter,
            this._singleColumnFilterWithPagination,
            this._singleColumnSort,
            this._singleColumnSortWithFilterAndPagination,
            this._multiColumnSortWithFilterAndPagination
        ]

        var resultPromise = undefined;
        var promisesArray = [];

        queriesHandlers.forEach(handler => {
            var handlerResult = handler.apply(this, this.tokens);
            promisesArray.push(handlerResult);                       
        })

        return Promise.all(promisesArray).then(results=>{
            console.log('Got results', results);
            var returnValue = undefined;
            results.some(result=>{
                console.log('Processing result', result);
                if(result.m.e){                    
                    returnValue = result;
                    return true;
                }
                return false;                    
            })
            
            return returnValue;
        })            
    }

    _getToken(type, which) {
        var tokensMatching = [];
        var tokensMatching = this.tokens.filter(element => {
            return element.kind == type;
        })
        if (tokensMatching.length > 0 && tokensMatching.length >= which)
            return tokensMatching[which];
    }

    _singleColumnFilter(tokens) {
        var that = this;

        var result = {
            d: [],
            m: {
                e: false, // whether the result is an execution result
                s: undefined, // size of d
                r: undefined, // query reference generated
                n: undefined // next element (for pagination)
            }
        };
        if (this.whereCount == 1 && this.limitCount==0 && this.orderByCount == 0 && this.whereInCount == 0) {
            console.log('Using _singleColumnFilter');
            var fReference = this.gator._page({
                r: that.ref,
                o: that._getToken('WHERE', 0).operands[0],
                v: that._getToken('WHERE', 0).operands[1]
            }, this.db);

            result.m.r = fReference;

            return fReference.once('value').then(elements => {
                var data = [];
                if (elements.exists()) {
                    elements.forEach(snap => {
                        data.push({
                            v: snap.val(),
                            k: snap.ref
                        })
                    });
                }

                result.d = data;
                result.m.s = data.length;
                result.m.e = true;
                return result;
            })
        } else {
            return new Promise(function (resolve, reject) {
                resolve(result);
            });
        }
    }
    _singleColumnFilterWithPagination(tokens) {
        var that = this;

        var result = {
            d: [],
            m: {
                e: false,
                s: undefined, // size of d
                r: undefined, // query reference generated
                n: undefined // next element (for pagination)
            }
        };
        if (this.whereCount == 1 && this.limitCount==1 && this.orderByCount == 0 && this.whereInCount == 0) {
            console.log('Using _singleColumnFilterWithPagination');
            var limit = that._getToken('LIMIT', 0).operands[0]+1 ;
            var dto = {
                r: that.ref,
                o: that._getToken('WHERE', 0).operands[0],
                v: that._getToken('WHERE', 0).operands[1],
                s: limit               
            }
            
            if(this.startCount == 1){
                dto.n = that._getToken('START', 0).operands[0];
            }  

            var fReference = this.gator._page(dto, this.db);               
            result.m.r = fReference;

            return fReference.once('value').then(elements => {
                var data = [];
                if (elements.exists()) {
                    elements.forEach(snap => {
                        data.push({
                            v: snap.val(),
                            k: snap.ref
                        })
                    });
                }
                if(data.length == limit)
                    result.m.n = data.pop().v;
                result.d = data;
                result.m.s = data.length;
                result.m.e = true;
                return result;
            })
        } else {
            return new Promise(function (resolve, reject) {
                resolve(result);
            });
        }
    }

    _singleColumnSort(tokens) {
        var that = this;

        var result = {
            d: [],
            m: {
                e: false,
                s: undefined, // size of d
                r: undefined, // query reference generated
                n: undefined // next element (for pagination)
            }
        };
        if (this.orderByCount == 1 && this.limitCount == 0 && this.whereCount == 0 && this.whereInCount == 0) {
            console.log('Using _singleColumnSort');
            var direction = that._getToken('ORDER_BY', 0).operands[1];
            
            var fReference = this.gator._page({
                r: that.ref,
                o: that._getToken('ORDER_BY', 0).operands[0],
                d: that._getToken('ORDER_BY', 0).operands[1]
            }, this.db);

            result.m.r = fReference;

            return fReference.once('value').then(elements => {
                var data = [];
                if (elements.exists()) {
                    elements.forEach(snap => {
                        data.push({
                            v: snap.val(),
                            k: snap.key
                        })
                    });
                }
                
                result.d = direction == 'a' ? data : data.reverse();
                result.m.s = data.length;
                result.m.e = true;
                return result;
            })
        } else {
            return new Promise(function (resolve, reject) {
                resolve(result);
            });
        }
    }
    _singleColumnSortWithFilterAndPagination(tokens) {
        var that = this;

        var result = {
            d: [],
            m: {
                e: false,
                s: undefined, // size of d
                r: undefined, // query reference generated
                n: undefined // next element (for pagination)
            }
        };

        if (
            this.orderByCount == 1 
            && this.whereCount == 1 
            && that._getToken('ORDER_BY', 0).operands[0] == that._getToken('WHERE', 0).operands[0] // same column
            && this.whereInCount == 0) {
            console.log('Using _singleColumnSortWithFilterAndPagination');
            var direction = that._getToken('ORDER_BY', 0).operands[1];
            
            var dto = {
                r: that.ref,
                o: that._getToken('ORDER_BY', 0).operands[0],
                d: that._getToken('ORDER_BY', 0).operands[1],                
                v: that._getToken('WHERE', 0).operands[1]
            };
            var sortField = that._getToken('ORDER_BY', 0).operands[0].replace(/\//g,'.'); // replace "/" to object dot notation
            if(this.limitCount>0){
                dto.s = that._getToken('LIMIT', 0).operands[0]+1;
            }
            if(this.startCount>0){
                dto.n = that._getToken('START', 0).operands[0];
            } 

            var fReference = this.gator._page(dto, this.db);
            result.m.r = fReference;

            return fReference.once('value').then(elements => {
                var data = [];
                if (elements.exists()) {
                    elements.forEach(snap => {
                        data.push({
                            v: snap.val(),
                            k: snap.key
                        })
                    });
                }
                var workingData = direction == 'a' ? data : data.reverse();

                if(this.limitCount>0){
                    //if(workingData.length == limit)
                        result.m.n = resolvePath(workingData.pop().v,sortField);
                }
                    
                result.d = workingData;
                
                result.m.s = workingData.length;
                result.m.e = true;
                return result;
            })
        } else {
            return new Promise(function (resolve, reject) {
                resolve(result);
            });
        }
    }
    _debugArray(array, howMany){
        var debugString = '[';
        for(var i=0; i < array.length && i < howMany;i++){
            debugString += array[i]+','
        }
        debugString += ']';
        return debugString;
    }
    _multiColumnSortWithFilterAndPagination(tokens) {
        var that = this;

        var result = {
            d: [],
            m: {
                e: false,
                s: undefined, // size of d
                r: undefined, // query reference generated
                n: undefined // next element (for pagination)
            }
        };

        if (
            this.orderByCount == 1 
            && this.whereCount == 1 
            && that._getToken('ORDER_BY', 0).operands[0] != that._getToken('WHERE', 0).operands[0] // different columns used in orderBy and where
            && this.whereInCount == 0) {
            console.log('Using _multiColumnSortWithFilterAndPagination');
            var direction = that._getToken('ORDER_BY', 0).operands[1];
            
            // start with a where Firebase query
            var dto = {
                r: that.ref,
                o: that._getToken('WHERE', 0).operands[0],                
                v: that._getToken('WHERE', 0).operands[1]
            };
            console.log('DTO ', dto); 
            var fReference = this.gator._page(dto, this.db);
            result.m.r = fReference;
            console.log('Reference ', fReference);
            return fReference.once('value').then(elements => {
                var data = [];
                if (elements.exists()) {
                    elements.forEach(snap => {
                        data.push({
                            v: snap.val(),
                            k: snap.key
                        })
                    });
                }
                console.log('Got elements from Firebase', data.length);
                
                console.log('data is: ', that._debugArray(data, 10));
                                
                
                // need to apply sorting and pagination
                // here goes sorting
                var sortField = that._getToken('ORDER_BY', 0).operands[0].replace(/\//g,'.'); // replace "/" to object dot notation
                data.sort((a,b)=>{
                    var aValue = resolvePath(a.v, sortField);
                    var bValue = resolvePath(b.v, sortField);
                    var typeOfValue = typeof aValue;
                    
                    var ascResult = aValue > bValue ? 1 : -1;

                    var result = direction == 'a' ? ascResult : -1 * ascResult;
                    return result;
                })

                console.log('data is: ', that._debugArray(data, 10));

                

                // now lets tackle pagination
                var limit = -1;
                if(this.limitCount>0){
                    limit = that._getToken('LIMIT', 0).operands[0]+1;
                }
                var startElement = undefined;
                if(this.startCount>0){
                    startElement = that._getToken('START', 0).operands[0];
                } 
                var index = 0;
                if(startElement!=undefined){
                    index = data.findIndex(element=>{
                        var value = resolvePath(element.v, sortField);
                        return value == startElement;
                    })
                }
                

                var returnArray = data.slice(index, limit == -1 ? undefined : limit);
                console.log('data is: ', that._debugArray(returnArray, 10));
                
                if(this.limitCount>0){
                    if(returnArray.length==limit)
                        result.m.n = resolvePath(returnArray.pop().v, sortField);
                }
                    
                console.log('data is: ', that._debugArray(returnArray, 10));
                result.d = returnArray;                
                result.m.s = returnArray.length;
                result.m.e = true;
                console.log('result is: ', result);
                return result;
            })
        } else {
            return new Promise(function (resolve, reject) {
                resolve(result);
            });
        }
    }

    where(column, value) {
        if(column!=null){
            this.tokens.push({
                kind: 'WHERE',
                operands: [column, value]
            })
            this.whereCount++;
        }        
        return this;
    }
    whereIn(column, array) {
        this.tokens.push({
            kind: 'IN',
            operands: [column, array]
        })
        this.whereInCount++;
        return this;
    }
    or() {
        this.tokens.push({
            kind: 'OR'
        })
        this.orCount++;
        return this;
    }
    and() {
        this.tokens.push({
            kind: 'AND'
        })
        this.andCount++;
        return this;
    }
    orderBy(column, direction) {  
        if(column!=null){
            this.tokens.push({
                kind: 'ORDER_BY',
                operands: [column, direction==undefined ? 'a' : direction]
            })
            this.orderByCount++;
        }              
        return this;
    }
    limit(value) {
        if(value!=null){
            this.tokens.push({
                kind: 'LIMIT',
                operands: [value]
            })
            this.limitCount++;
        }        
        return this;
    }
    start(value) {
        if(value!=null){
            this.tokens.push({
                kind: 'START',
                operands: [value]
            })
            this.startCount++;
        }
        
        return this;
    }


}
class FirebaseGator {

    constructor(options) {
        this.options = {};
        this.options.DEFAULT_DIRECTION = 'a';
        this.options.DEFAULT_PAGE_SIZE = 20;
        Object.assign(this.options, options);
        this.db = undefined;
    }

    init(db) {
        this.db = db;
    }

    query(reference, database) {
        var query = new Query(database ? database : this.db, reference, this);
        return query;
    }

    /**
     * 
     * @param {*} db 
     * @param {SingleColumnQueryDTO} queryDTO 
     */
    _page(singleColumnQueryDTO, database) {

        var query = this._parseQuery(singleColumnQueryDTO);

        var queryReference = database.ref(query.reference);
        queryReference = query.orderBy ? queryReference.orderByChild(query.orderBy) : queryReference;
        queryReference = query.filter ? queryReference.equalTo(query.filter) : queryReference;

        if (query.pageSize) {
            queryReference = query.direction == 'a' ? queryReference.limitToFirst(query.pageSize) : queryReference.limitToLast(query.pageSize);
        }
        if (query.next) {
            queryReference = query.direction == 'a' ? queryReference.startAt(query.next) : queryReference.endAt(query.next);
        }

        return queryReference;

    }

    _parseQuery(queryDTO) {
        var result = {
            reference: queryDTO.r,
            orderBy: queryDTO.o,
            pageSize: queryDTO.s,
            next: queryDTO.n,
            filter: queryDTO.v,
            direction: queryDTO.d || this.options.DEFAULT_DIRECTION
        }
        return result;
    }
}

module.exports =
    new FirebaseGator({});