// hook original object getter+setter
// make enable/disable toggle
function hook(obj, prop, mode = 'read/write', callback = () => { debugger }) {
    var enabled = true
    // save in another property                        
    obj._someProp = obj[prop]

    // overwrite with accessor
    Object.defineProperty(obj, prop, {
        get: function () {
            if (enabled && (mode == 'read' || mode == 'read/write')) callback()
            return obj._someProp;
        },

        set: function (value) {
            if (enabled && (mode == 'write' || mode == 'read/write')) callback() 
            obj._someProp = value;
        }
    })

    return {
        enable: function() {
            enabled = true
        },
        disable: function() {
            enabled = false
        }
    }
}