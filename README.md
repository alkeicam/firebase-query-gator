# Fire Query Gator
> This module provides simple API for querying Firebase Realtime Database.

## Table of contents
* [General info](#general-info)
* [Performance Notice](#Performance-Notice)
* [Features](#Features)
* [Module Documentation](#Module-Documentation)  
    * [Initialization](#Initialization)  
    * [Output Specification](#Output-Specification)      
    * [Single column where query with pagination](#Single-column-where-query-with-pagination)   
    * [Single column orderby query with pagination](#Single-column-orderby-query-with-pagination)   
    * [Multi column query](#Multi-column-query)   
    
    
     
* [Contact](#contact)

## General info
This is a user and developer friendly facade for Firebase Realtime Database standard queries. It does as much as possible to utilize built in firebase queries mechanisms, however due to their limitations some heuristics are used in order to provide simple API for developer.

## Performance Notice
> :warning: **Queries Response Time**: Althought as much as possible processing is delegated to the firebase backend some operations will require full read of the database. Please also remember that You **should** add indexes on columns that you plan to use in your queries.

## Features
* Single column where query with sorting and pagination
* Multi column where query with sorting and pagination (_order by_ is on different column than _where_)

## Module Documentation

### Initialization
```javascript
const q = require('firebase-query-gator');
// tell on which database queries should perform
var db = admin.database();
q.init(db);
// from now on one can issue queries
// ...
```
### Output Specification
> Object {d: data, m: metadata} is returned for each of the execute() calls. Please see below for detailed specification of each field

|Kind| Parameter | Type | Description |
| :--- | :--- | :--- | :--- |
|Output| `d` | `array` | Result records array  |
|Output|  `m.s` | `integer` | Size of result records array |
|Output|  `m.n` | `string` | Next page starting element (to be used with start() function ) |

### Single column where query with pagination
> Performs query using the same column/property for filering 
```javascript
var reference = 'course/students'; // from where we make the search
var column = 'nationality';

// create query
var query = q.query(reference); 
// narrow only to certain nationality
query = query.where(column, 'Cuban');

// get 10 elements starting from START_ELEMENT
query = query.limit(10).start(START_ELEMNT);

query.execute().then(result=>{
    // when resolves then operation was success
    // see operations documentation for details    
    var data = result.d;
    var dataLength = result.m.s;
});
```

### Single column orderby query with pagination
> Performs query using the same column/property for sorting  
```javascript
var reference = 'course/students'; // from where we make the search
var column = 'nationality';

// create query
var query = q.query(reference); 
// order by nationality
query = query.orderBy(column,query.DIRECTION.DESC);            
// get 10 elements starting from START_ELEMENT
query = query.limit(10).start(START_ELEMNT);

query.execute().then(result=>{
    // when resolves then operation was success
    // see operations documentation for details    
    var data = result.d;
    var dataLength = result.m.s;
});
```


### Multi column query
> Performs query using the different columns/properties for sorting and filering 
```javascript
var reference = 'course/students'; // from where we make the search

// create query
var query = q.query(reference); 
var columnSort = 'age';
var columnWhere = 'city';
// sort students by age
query = query.orderBy(columnSort,query.DIRECTION.ASC);

// get only students from Warsaw
query = query.where(columnWhere, 'Warsaw');

// get 10 elements
query = query.limit(10).start(START_ELEMNT);

query.execute().then(result=>{
    // when resolves then operation was success
    // see operations documentation for details    
    var data = result.d;
    var dataLength = result.m.s;
});
```

## Operations documentation
### AccountGet
> Retrieves user account

#### Security
|Kind| Value | 
| :--- | :--- | 
|Resource| `account` | 
|Action| `read:any` | 

#### Input and output
|Kind| Parameter | Type | Description |
| :--- | :--- | :--- | :--- |
|Argument| `i` | `string` | **Required**. Target user id - id of the user whose data will be retrieved  |
|Returns|  `d` | `object` | Promise with user data |
|Returns|  `d.firebaseUser` | `object` | User data - data from firebase associated with user |
|Returns|  `d.userData` | `object` | User data - data from UserData entity associated with user |

### AccountBlock
> Sets user account verification status to B-blocked

#### Security
|Kind| Value | 
| :--- | :--- | 
|Resource| `account` | 
|Action| `update:any` | 

#### Input and output
|Kind| Parameter | Type | Description |
| :--- | :--- | :--- | :--- |
|Argument| `i` | `string` | **Required**. Target user id - id of the user whose account verification status will be set to blocked  |
|Returns|   |  | Promise resolves on success |

### AccountReset
> Sets user account verification status to U-Unknown

#### Security
|Kind| Value | 
| :--- | :--- | 
|Resource| `account` | 
|Action| `update:any` | 

#### Input and output
|Kind| Parameter | Type | Description |
| :--- | :--- | :--- | :--- |
|Argument| `i` | `string` | **Required**. Target user id - id of the user whose account verification status will be set to unknown (which shall trigger new verification process)  |
|Returns|   |  | Promise resolves on success |


## Contact
Created by [maciej.grula@xcft](https://www.xcft.pl/) 