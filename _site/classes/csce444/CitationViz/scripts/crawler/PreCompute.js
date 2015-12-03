var authorLists = {};
var keywordLists = {};

// Take cache of metadata and create graph
function PreCompute() {
    createAuthorLists();
    createKeyWordLists();
    return createGraph();
}

// Make a map < author , list of metadata that has author >
function createAuthorLists() {
    for ( var m in metadataCache ) {
        var metadata = metadataCache[m];
        var authors = metadata.authors;
        if ( !authors ) {
            continue;
        }
        for (var a in authors) {
            // TODO is the right kade?
            var authorKey = authors[a].location;
            if ( !authorLists[authorKey] ) {
                authorLists[authorKey] = [];
            }
            authorLists[authorKey].push(metadata.location);
        }
    }
}

// Make a map < keyword , list of metadata that has keyword >
function createKeyWordLists() {
    for ( var m in metadataCache ) {
        var metadata = metadataCache[m];
        var keywords = metadata.text_keywords;
        if ( !keywords ) {
            continue;
        }
        keywords = keywords.split(' ');
        for (var k in keywords) {
            // TODO is the right kade?
            var keyWord = keywords[k];
            if ( !keywordLists[keyWord] ) {
                keywordLists[keyWord] = [];
            }
            keywordLists[keyWord].push(metadata.location);
        }
    }
}


function createGraph() {
    var graphMap = {};
    for ( var m in metadataCache ) {
        graphMap[m] = createNode(metadataCache[m]);
    }
    return graphMap;
}

function createNode(metadata) {
    var node = {};
    // Set all the nodes attributes
    node.citation_count = parseInt( metadata.citation_count );
    if ( !node.citation_count ) {
        if ( metadata.citations ) {
            node.citation_count = metadata.citations.length;
        }
        node.citation_count = 0;

    }
    node.title = metadata.title;
    node.year = parseInt( metadata.year);

    // Create all the lists of different kinds of connections a node can have
    createNodeRelations(node , metadata);
    return node;
}

function createNodeRelations(node , metadata) {
    node.citations  = getCitations(metadata);
    node.references = getReferences(metadata);
    node.sharedAuthorPeeps = getSharedAuthorPeeps(metadata);
    // This one is a list per word
    node.sharedKeyWordPeeps = getSharedKeyWordPeeps(metadata);
}

function getCitations(metadata) {
    var citations = [];
    if ( !metadata.citations ) {
        return citations;
    }
    for ( var index in metadata.citations) {
        if ( metadata.citations[index].acm_portal) {
            citations.push( metadata.citations[index].acm_portal.location);
        }
    }
    return citations;
}

function getReferences(metadata) {
    var references = [];
    if ( !metadata.references ) {
        return references;
    }
    for ( var index in metadata.references ) {
        if ( metadata.references[index].acm_portal ) {
            references.push ( metadata.references[index].acm_portal.location);
        }
    }
    return references;
}

function getSharedAuthorPeeps(metadata) {
    var peeps = [];
    var authors = metadata.authors;
    if ( !authors ) {
        return peeps;
    }
    for ( a in authors ) {
        var authorKey = authors[a].location;
        for ( var m in authorLists[authorKey]) {
            peeps.push( authorLists[authorKey][m]);
        }
    }
    return peeps;
}

function getSharedKeyWordPeeps(metadata) {
    var peepLists = {};
    if ( !metadata.text_keywords ) {
        return peepLists;
    }
    var keywords = metadata.text_keywords.split(' ');
    for ( k in keywords ) {
        var keyWord = keywords[k];
        peepLists[keyWord] = [];
        for ( m in keywordLists[keyWord]) {
            peepLists[keyWord].push( keywordLists[keyWord][m]);
        }
    }
    return peepLists;
}