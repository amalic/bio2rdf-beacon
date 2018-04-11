'use strict';

const sparqlEndpoint = "http://graphdb.dumontierlab.com/repositories/bio2rdf";

const util = require('util');
const unirest = require('unirest');
const deasync = require('deasync');
// README: https://www.npmjs.com/package/sparql-client-2#registering-common-prefixes
const SparqlClient = require('sparql-client-2');
const SPARQL = SparqlClient.SPARQL;

const sparqlClient = new SparqlClient(sparqlEndpoint)
    .registerCommon('rdfs')
    .register({owl: 'http://www.w3.org/2002/07/owl#'})
    .register({skos: 'http://www.w3.org/2004/02/skos/core#'})
    .register({dc: 'http://purl.org/dc/elements/1.1/'});

// mapping swagger-operationId to javascript-function
module.exports = {
    linkedTypes                     : linkedTypes
    , getConceptDetails             : getConceptDetails
    , getConcepts                   : getConcepts
    , getExactMatchesToConcept      : getExactMatchesToConcept
    , getExactMatchesToConceptList  : getExactMatchesToConceptList
    , getStatements                 : getStatements
    , getEvidence                   : getEvidence
};

// /types
function linkedTypes(req, res) {
    //console.log("linkedTypes");

    var result = executeSparql(SPARQL`
    select ?SioType ?Type ?Id ?Count where {
        {
            select ?SioType (count(?Bio2RdfType) as ?Count) where {
                [] a ?Bio2RdfType .
                ?Bio2RdfType skos:mappingRelation ?SioType .
                graph <http://semanticscience.org/resource/> {
                    ?SioType a owl:Class .
                }
                filter not exists {
                    graph <http://semanticscience.org/resource/> {
                        ?Bio2RdfType a owl:Class .
                    }
                }
            }
            group by ?SioType
        }
        ?SioType dc:identifier ?Id;
                rdfs:label ?Type .
    }
    order by desc(?Count)
    `);

    var types = [];
    result.results.bindings.forEach(function(binding){
        var type = binding.Type.value;
        var id = binding.Id.value;
        var count = parseInt(binding.Count.value);
        types.push({id: type , idmap : id, frequency: count})
    });
    
    res.json(types);
}

// /concepts/{conceptId}
function getConceptDetails(req, res) {
    console.log("getConceptDetails");

    var conceptId = req.swagger.params.conceptId.value;
    console.log("  conceptId:" + conceptId);

    // Mock
    var ret = [
        {
            id: "id"
            , name: "name"
            , semanticGroup: "semanticGroup"
            , synonyms: [
                "synonym1"
                , "synonym2"
            ]
            , definition: "definition"
            , details: [
                {tag: "tag", value: "value"}
                , {tag: "tag2", value: "value2"}
            ]
        }
    ]

    res.json(ret);
}

// /concepts
function getConcepts(req, res) {
    console.log("getConcepts");

    var keywords = req.swagger.params.keywords.value;
    var semgroups = req.swagger.params.semgroups.value;
    var pageNumber = req.swagger.params.pageNumber.value;
    var pageSize = req.swagger.params.pageSize.value;
    console.log("  keywords:" + keywords);
    console.log("  semgroups:" + semgroups);
    console.log("  pageNumber:" + pageNumber);
    console.log("  pageSize:" + pageSize);

    // Mock
    var ret = [
        {
            id: "id"
            , name: "name"
            , semanticGroup: "semanticGroup"
            , synonyms: [
                "synonym1"
                , "synonym2"
            ]
            , definition: "definition"
            , details: [
                {tag: "tag", value: "value"}
                , {tag: "tag2", value: "value2"}
            ]
        }
    ]

    res.json(ret);
}

// /exactmatches/{conceptId}
function getExactMatchesToConcept(req, res) {
    console.log("getExactMatchesToConcept");

    var conceptId = req.swagger.params.conceptId.value;
    console.log("  conceptId" + conceptId);

    // Mock
    var ret = ["string1", "string2"];

    res.json(ret);
}

// /exactmatches
function getExactMatchesToConceptList(req, res) {
    console.log("getExactMatchesToConceptList");
    
    var c = req.swagger.params.c.value;
    console.log("  c:" + c);

    // Mock
    var ret = ["string1", "string2"];

    res.json(ret);
}

// /statements
function getStatements(req, res) {
    //console.log("getStatements");

    var c = req.swagger.params.c.value;
    var pageNumber = parseInt(req.swagger.params.pageNumber.value);
    var pageSize = parseInt(req.swagger.params.pageSize.value);
    var keywords = req.swagger.params.keywords.value;
    var semgroups = req.swagger.params.semgroups.value;
    if(isNaN(pageNumber) || pageNumber<1)
        pageNumber = 1;
    if(isNaN(pageSize) || pageSize<1)
        pageSize = 10;
    //console.log("  c:" + c);
    //console.log("  pageNumber:" + pageNumber);
    //console.log("  pageSize:" + pageSize);
    //console.log("  keywords:" + keywords);
    //console.log("  semgroups:" + semgroups);

    var sparql = 'select ?s ?sl ?p ?pl ?o ?ol where {?s ?p ?o . ?s rdfs:label ?sl . ?p rdfs:label ?pl . ?o rdfs:label ?ol . '
        + 'filter(!regex(str(?p), "http://www.w3.org/1999/02/22-rdf-syntax-ns#type")).';
    if(keywords!=undefined) {
        var kw = keywords.toLowerCase().split(' ');
        if(kw.length>0) {
            sparql += ' filter(';
            for(var i=0; i<kw.length; i++)
                sparql+=(i>0?' || ':'') + 'contains(lcase(?sl), "' + kw[i] + '") || contains(lcase(?pl), "' + kw[i] + '") || contains(lcase(?ol), "' + kw[i] + '")';
            sparql += ').';
        }
    }
    sparql+='} offset ' + (pageSize*(pageNumber-1)) + ' limit ' + pageSize;
    // console.log(sparql);

    var result = executeSparql(sparql);
    var statements = [];
    result.results.bindings.forEach(function(binding){
        var s = binding.s.value;
        var sl = binding.sl.value;
        var p = binding.p.value;
        var pl = binding.pl.value;
        var o = binding.o.value;
        var ol = binding.ol.value;
        statements.push({
            id: '<' + s + '> <' + p + '> <' + o + '>'
            , subject: {id: s, name: sl}
            , predicate: {id:p, name:pl}
            , object: {id: o, name: ol}
        })
    });

    res.json(statements);
}

// /evidence/{statementId}
function getEvidence(req, res) {
    console.log("getEvidence");

    var statementId = req.swagger.params.statementId.value;
    var keywords = req.swagger.params.keywords.value;
    var pageNumber = req.swagger.params.pageNumber.value;
    var pageSize = req.swagger.params.pageSize.value;
    console.log("  statementId:" + statementId);
    console.log("  keywords:" + keywords);
    console.log("  pageNumber:" + pageNumber);
    console.log("  pageSize:" + pageSize);

    // Mock
    var ret = [
        {
            id: "id"
            , label: "label"
            , date: "date"
        }
    ]

    res.json(ret);
}

function executeSparql(sparql) {
    var done = false;
    var ret = null;

    sparqlClient.query(sparql)
        .execute()
        .then(function (results) {
            ret = results;
            done = true;
        })
        .catch(function(error) {
            console.log(error);
            done = true;
        });

    while(!done){deasync.sleep(10)}

    return ret;
}