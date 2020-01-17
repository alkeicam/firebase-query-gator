var resolvePath = require('object-resolve-path');
class QueryHandler {
    willHandle(query){
        throw new Error('Subclass Implementation Required!');
    }

    /**
     * 
     * @param {*} query 
     * @returns {*} dto do zapytania
     */
    preQuery(query){
        throw new Error('Subclass Implementation Required!');
    }

    postQuery(dataArray, query){
        throw new Error('Subclass Implementation Required!');
    }  

    /**
     * @returns {*} Promise
     */
    _process(query){
        var firegatorQuery = this.preQuery(query);
        var fReference = query.gator._page(firegatorQuery, query.db);
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
            var processedResultObject = this.postQuery(data, query);

            var result = { 
                m: {}               
            };
            
            result.d = processedResultObject.data;
            result.m.s = processedResultObject.data.length;
            result.m.n = processedResultObject.n;
            result.m.e = true;
            return result;
        });
    }
}
class SingleColumnFilter extends QueryHandler{
    willHandle(query){
        return query.whereCount == 1 && query.limitCount==0 && query.orderByCount == 0 && query.whereInCount == 0
    }

    preQuery(query){
        return {
            r: query.ref,
            o: query._getToken('WHERE', 0).operands[0],
            v: query._getToken('WHERE', 0).operands[1]
        }
    }
    /**
     * 
     * @param {*} resultData {n: next, data: dataArray}
     */
    postQuery(dataArray){
        return {data: dataArray};
    }
}
class SingleColumnFilterWithPagination extends QueryHandler{
    willHandle(query){
        return query.whereCount == 1 && query.limitCount==1 && query.orderByCount == 0 && query.whereInCount == 0
    }

    preQuery(query){
        console.log('Using _singleColumnFilterWithPagination');
        var limit = query._getToken('LIMIT', 0).operands[0] + 1;
        var dto = {
            r: query.ref,
            o: query._getToken('WHERE', 0).operands[0],
            v: query._getToken('WHERE', 0).operands[1],
            s: limit
        }

        if (query.startCount == 1) {
            dto.n = query._getToken('START', 0).operands[0];
        }  

        return dto;
    }
    /**
     * 
     * @param {*} resultData {n: next, data: dataArray}
     */
    postQuery(dataArray, query){
        var n = undefined;
        var limit = query._getToken('LIMIT', 0).operands[0] + 1;

        var resultArray = dataArray;

        if(dataArray.length == limit)
            n  = resultArray.pop().v;
        return {n: n, data: resultArray};
    }
}
class SingleColumnSort extends QueryHandler{
    willHandle(query){
        return query.orderByCount == 1 && query.limitCount == 0 && query.whereCount == 0 && query.whereInCount == 0;
    }

    preQuery(query){
        console.log('Using SingleColumnSort');                
        return {
            r: query.ref,
            o: query._getToken('ORDER_BY', 0).operands[0],
            d: query._getToken('ORDER_BY', 0).operands[1]
        };
    }
    /**
     * 
     * @param {*} resultData {n: next, data: dataArray}
     */
    postQuery(dataArray, query){
        var n = undefined;        
        var resultArray = dataArray;
        var direction = query._getToken('ORDER_BY', 0).operands[1];

        resultArray = direction == 'a' ? resultArray : resultArray.reverse();
        
        return {n: n, data: resultArray};
    }
}

class SingleColumnSortWithPagination extends QueryHandler{
    willHandle(query){
        return query.orderByCount == 1 && query.limitCount == 1 && query.whereCount == 0 && query.whereInCount == 0;
    }

    preQuery(query){
        console.log('Using SingleColumnSortWithPagination');   
        var limit = query._getToken('LIMIT', 0).operands[0] + 1;             
        var dto = {
            r: query.ref,
            o: query._getToken('ORDER_BY', 0).operands[0],
            d: query._getToken('ORDER_BY', 0).operands[1],
            s: limit
        };

        if (query.startCount == 1) {
            dto.n = query._getToken('START', 0).operands[0];
        } 
        return dto;
    }
    /**
     * 
     * @param {*} resultData {n: next, data: dataArray}
     */
    postQuery(dataArray, query){
        var n = undefined;                        
        return {n: n, data: dataArray};
    }
}

class SingleColumnSortWithFilterAndPagination extends QueryHandler{
    willHandle(query){
        return query.orderByCount == 1 
        && query.whereCount == 1 
        && query._getToken('ORDER_BY', 0).operands[0] == query._getToken('WHERE', 0).operands[0] // same column
        && query.whereInCount == 0
    }

    preQuery(query){
        console.log('Using SingleColumnSortWithFilterAndPagination');

        var dto = {
            r: query.ref,
            o: query._getToken('ORDER_BY', 0).operands[0],
            d: query._getToken('ORDER_BY', 0).operands[1],
            v: query._getToken('WHERE', 0).operands[1]
        };
        
        if (query.limitCount > 0) {
            dto.s = query._getToken('LIMIT', 0).operands[0] + 1;
        }
        if (query.startCount > 0) {
            dto.n = query._getToken('START', 0).operands[0];
        } 

        return dto;
    }
    /**
     * 
     * @param {*} resultData {n: next, data: dataArray}
     */
    postQuery(dataArray, query){
        var n = undefined;    
        var direction = query._getToken('ORDER_BY', 0).operands[1];
        var sortField = query._getToken('ORDER_BY', 0).operands[0].replace(/\//g,'.'); // replace "/" to object dot notation
        var workingData = direction == 'a' ? dataArray : dataArray.reverse();

        if (query.limitCount > 0) {
            //if(workingData.length == limit)
            n = resolvePath(workingData.pop().v, sortField);
        }
        
        return {n: n, data: workingData};
    }
}

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
        var that = this;
        // console.log('Executing: '+this);
        // find orderBy
        // jak nie ma to znaczy ze nie 
        var queriesHandlers = [
            new SingleColumnFilter(),
            new SingleColumnFilterWithPagination(),
            new SingleColumnSort(),
            new SingleColumnSortWithPagination(),
            new SingleColumnSortWithFilterAndPagination()
        ];

        var resultPromise = undefined;
        var promisesArray = [];

        queriesHandlers.forEach(handler => {
            var willHandle = handler.willHandle(that);
            if(willHandle){
                promisesArray.push(handler._process(that));                       
            }                        
        })        

        return Promise.all(promisesArray).then(results=>{            
            var returnValue = undefined;
            returnValue = results[0];            
            console.log('Returning result: ', returnValue);
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
            
            var fReference = this.gator._page(dto, this.db);
            //result.m.r = fReference;
            
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
                
                
                if(this.limitCount>0){
                    if(returnArray.length==limit)
                        result.m.n = resolvePath(returnArray.pop().v, sortField);
                }
                    
                console.log('data is: ', that._debugArray(returnArray, 10));
                result.d = returnArray;                
                result.m.s = returnArray.length;
                result.m.e = true;                
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