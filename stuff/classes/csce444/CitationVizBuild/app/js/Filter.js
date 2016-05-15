/* jshint -W004, browser: true, devel: true */

function Filter(nodeGraph , filters) {
    // Init everything to false
    for ( var key in nodeGraph ) {
        nodeGraph[key].inFilter = false;
    }

    for ( var nodeKey  in nodeGraph ) {
        var node = nodeGraph[nodeKey];

        var nodeInWholeFilter = true;
        for ( var f = 0; f <  filters.length; f++) {
            var filter = filters[f];
            var field = filter.field;
            var nodeInPartialFilter = false;
            switch (filter.fieldType ) {
                case 'object': {
                    for ( var v = 0; v  < filter.values.length; v++) {
                        if ( filter.values[v] in node[field] ) {
                            nodeInPartialFilter = true;
                            break;
                        }
                    }
                    break;
                }
                case 'scalar':
					break;
                default: {
                    // Check to see if the node's value for this field is any of the ones in the filter values
                    for ( var v in filter.values) {
                        if ( filter.values[v] == node[field] ) {
                            nodeInPartialFilter = true;
                            break;
                        }
                    }
                }
            }

            if ( !nodeInPartialFilter ) {
                // Node doesnt meet the requirement for this filter field
                // So it doesn't meet the whole filter requirements
                nodeInWholeFilter = false;
                // Dont check anymore filter fields
                break;
            }
        }
        if ( nodeInWholeFilter ) {
            // The node met each filter field requirment
            node.inFilter = true;
        }
        // Check the next node
    }
}


function getAllInFilter(nodeGraph) {
    var result = {};
    for ( var n in nodeGraph ) {
        if ( nodeGraph[n].inFilter ) {
            result[n] = nodeGraph[n];
        }
    }
    return result;
}
