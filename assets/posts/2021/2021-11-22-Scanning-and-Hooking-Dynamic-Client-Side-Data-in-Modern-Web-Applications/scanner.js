function scanner() {
    var root_nodes = [{
        ele: window,
        path: 'window'
    }]
    var scanning
    // This function is going to return an array of paths
    // that point to the cycles in the object
    const search = (comparison, comparison_type, params) => {
        // Save traversed references here
        const traversedProps = new Set();
        const cycles = [];
        let matches = []

        // Recursive function to go over objects/arrays
        const traverse = function (currentObj, path) {
            // If we saw a node it's a cycle, no need to travers it's entries
            if (traversedProps.has(currentObj)) {
                cycles.push(path);
                return;
            }

            traversedProps.add(currentObj);

            // Traversing the entries
            for (let key in currentObj) {

                // run comparisons
                let parentIsArray = typeof currentObj === 'object' && Array.isArray(currentObj)
                if (comparison(comparison_type, parentIsArray ? `${path}[${key}]` : `${path}['${key}']`, currentObj, key)(...params))
                    matches.push({ ele:currentObj, path: parentIsArray ? `${path}[${key}]` : `${path}['${key}']` })
        

                const value = currentObj[key];
                // We don't want to care about the falsy values
                // Only objects and arrays can produce the cycles and they are truthy
                if (currentObj.hasOwnProperty(key) && value) {
                    try {
                        if (typeof value === 'object' && !Array.isArray(value)) {

                            // We'd like to save path as parent[0] in case when parent obj is an array
                            // and parent.prop in case it's an object
                            let parentIsArray = typeof currentObj === 'object' && Array.isArray(currentObj); // instance of set?
                            traverse(value, parentIsArray ? `${path}[${key}]` : `${path}['${key}']`);
                        } else if (typeof value === 'object' && Array.isArray(value)) {
                            for (let i = 0; i < value.length; i += 1) {
                                traverse(value[i], `${path}['${key}'][${i}]`);
                            }
                        }

                    } catch {}
                    // We don't care of any other values except Arrays and objects.
                }
            
            }
        }

        for (node of root_nodes) {
            traverse(node.ele, node.path)
        }

        root_nodes = matches
        console.log('DONE!')
        return matches  // matches to global variable
    };

    // key comparisons
    function comparison_key(comparison_type, path, obj, key) {
        return function(find_val) {
            let isMatch = false
            try {
                switch (comparison_type) {
                    case 'includes':
                        isMatch = key.toLowerCase().includes(find_val)
                        break
                    case 'lose_equals':
                        isMatch = key.toLowerCase() == find_val
                        break
            }
            if (isMatch) {
                console.log(`Found [key: ${comparison_type}] '${find_val}' at: ${path}\nValue: ${find_val}`)
                return true
            }
            } catch { }
            return false    
        }
    }

    // value comparisons
    function comparison_values(comparison_type, path, obj, key) {
        return function(param1, param2) {
            let isMatch = false, output
            try {
                switch (comparison_type) {
                    case 'includes':
                        isMatch = (obj[key]).toLowerCase().includes(param1)
                        output = `Found [value: ${comparison_type}] '${param1}' at: ${path}\nValue: ${obj[key]}`
                        break
                    case 'loose_equals':
                        isMatch = (obj[key].toLowerCase()) == param1
                        output = `Found [value: ${comparison_type}] '${param1}' at: ${path}\nValue:  ${obj[key]}`
                        break
                    case 'between':
                        parseInt(obj[key]) >= parseInt(param1) && parseInt(obj[key]) <= parseInt(param2)
                        output = `Found [value: ${comparison_type}] '${param1} - ${param2}' at: ${path}\nValue: ${obj[key]}`
                        break

                }

                if (isMatch) {
                    console.log(output)
                    return true
                }
            } catch { }
            return false
        }
    }


    return {
        new: function() {
            root_nodes = [{
                ele: window,
                path: 'window'
            }]
            return this
        },
        scanKeys_includes: (find_str) => {
            return search(comparison_key, 'includes', [find_str])
        },
        scanKeys_loose_equals: (find_str) => {
            return search(comparison_key, 'loose_equals', [find_str])
        },
        scanValues_includes: (find_str) => {
            return search(comparison_values, 'includes', [find_str])
        },
        scanValues_loose_equals: (find_str) => {
            return search(comparison_values, 'loose_equals', [find_str])
        },
        scanValues_between: (min, max) => {
            return search(comparison_values, 'between', [min, max])
        }
    }
}

var s = new scanner()