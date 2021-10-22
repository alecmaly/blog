/// <reference path="JSProvider.d.ts" />

// .scriptunload C:\Users\User\Desktop\windbg_script.js; .scriptload C:\Users\User\Desktop\windbg_script.js; !chelp


'use strict';

const PADDING = 10

// VARIABLES
const IS_x86 = true
const ADDR_PADDING = IS_x86 ? 8 : 16
const ADDR_SIZE = IS_x86 ? 4 : 8


function printLn(str) {
    host.diagnostics.debugLog(str)
}

function initializeScript() {
    return [
        new host.apiVersionSupport(1, 2),
        new host.functionAlias(
            chelp,
            'chelp'
        ),new host.functionAlias(
            state,
            's'
        ),
        new host.functionAlias(
            TTDFindCalls,
            'TTDFindCalls'
        ),
        new host.functionAlias(
            TTDHeapReads,
            'TTDHeapReads'
        ),
        new host.functionAlias(
            printAddressInfo,
            'ai'
        ),
        new host.functionAlias(
            printDerefAddressInfo,
            'dai'
        )
    ];
}


function printAddressInfo(addr) {
    if(addr == undefined) {
        printLn('!pai "ADDRESS"\n')
        return;
    }

    printLn(getAddressInfo(addr) + '\n')
}
function printDerefAddressInfo(addr) {
    if(addr == undefined) {
        printLn('!padi "ADDRESS"\n')
        return;
    }
    
    printLn(getAddressDerefInfo(addr) + '\n')
}




// **** MAIN FUNCTIONS  **** //

function chelp() {
    let NUM_STACK_ADDRESSES = 20

    let esp = host.currentThread.Registers.User.esp
    
    printLn(`!s\t\t\t\t-\tshow state\n`)
    printLn(`!TTDFindCalls\t-\tshow calls of 'module!function'\n`)
    printLn(`!TTDHeapReads\t-\tshow [ASCII] reads from heap memory\n`)
    printLn(`\n`)
    printLn(`Util:\n`)
    printLn(`!ai\t-\tprintAddressInfo\n`)
    printLn(`!dai\t-\tprintDerefAddressInfo\n`)
}

function state() {
    let NUM_STACK_ADDRESSES = 20

    let esp = host.currentThread.Registers.User.esp
    
    printLn(`eax: ${getAddressInfo(host.currentThread.Registers.User.eax)}\n`)
    printLn(`ebx: ${getAddressInfo(host.currentThread.Registers.User.ebx)}\n`)
    printLn(`ecx: ${getAddressInfo(host.currentThread.Registers.User.ecx)}\n`)
    printLn(`edx: ${getAddressInfo(host.currentThread.Registers.User.edx)}\n`)
    printLn(`esi: ${getAddressInfo(host.currentThread.Registers.User.esi)}\n`)
    printLn(`edi: ${getAddressInfo(host.currentThread.Registers.User.edi)}\n`)
    printLn(`eip: ${getAddressInfo(host.currentThread.Registers.User.eip)}\n`)
    
    
    printLn('\n\n\n')
    printLn(`esp: ${getAddressInfo(esp)}\n`)
    printLn(`Address\t\t\tDeref hex|Value\t\t\tDeref [Symbol/Module Offset]\t\t\tDeref 'String'\n`)
    
    
    for (let i = 0; i < NUM_STACK_ADDRESSES; i++) {
        // dereferece
        let addr = esp + (ADDR_SIZE * i)   
        printLn(getAddressDerefInfo(addr) + '\n')
    }
    
    // parameters??
    printLn('\n\nParameters / Local Variables\n\n')
    for (let i = -1; i >= -4; i--) {
        // dereferece
        let addr = esp + (ADDR_SIZE * i)    
        printLn(getAddressDerefInfo(addr) + '\n')
    }
    
    // print properties of object
    // printLn(Object.getOwnPropertyNames(addr))

    // ln 0x764f24fc   | recv() address
}


function TTDHeapReads() {
    printLn(`[?] Look for interesting ASCII, sometimes the same first character of buffer\n\n`)

    let allocatedHeaps = host.currentSession.TTD.Data.Heap().Where(c => c.Action == "Alloc")
    
    for (let i = 0; i < allocatedHeaps.Count(); i++) {
        let heap = allocatedHeaps.Skip(i).First()
        
        let memory_found = host.currentSession.TTD.Memory(heap.Address, heap.Address + heap.Size, "r")
        let s = '', hasASCII = false
        for (let j = 0; j < memory_found.Count(); j++) {
            let memory = memory_found.Skip(j).First()
            let c = String.fromCharCode(memory.Value).trim()
            if (memory.Value != 0x0 && isASCII(c)) {
                hasASCII = true
                s += `${c} `
            }
        }
        
        if (hasASCII) {
            printLn(`[heap] ADDR: 0x${decimalToHex(heap.Address)} | SIZE: (0x${stripLeadingZerosFromHex(decimalToHex(heap.Size))} | ${hexToDecimal(heap.Size)})\n`)
            printLn(`VIEW MEMORY:\t dx -g -r1 @$cursession.TTD.Memory(${heap.Address}, ${heap.Address + heap.Size}, "r")\n`)
            printLn(`SET BREAKPOINT:\t ba r1 ${heap.Address}\n`)
            
            printLn(`${s}\n\n`)
        }
    }
}

function TTDFindCalls(param) {
    if(param == undefined) {
        printLn('strcpy()/strncpy() or sprintf()/snprintf() or memcpy() or even gets()\n\n')
        printLn('!TTDFindCalls "*!*cmp"\n');
        printLn('!TTDFindCalls "*!str*cpy"\n');
        printLn('!TTDFindCalls "*!memcpy"\n');
        printLn('!TTDFindCalls "*!str*cmp"\n');
        printLn('!TTDFindCalls "*!memcmp"\n');
        printLn('!TTDFindCalls "*!*printf"\n');
        printLn('!TTDFindCalls "*!*gets"\n');
        printLn('!TTDFindCalls "ws2_32!recv"\n');
        return;
    }

    // dx -r1 @$cursession.TTD.Calls("*!*cmp")
    let cmpCalls = host.currentSession.TTD.Calls(param)

    for (let i = 0; i < cmpCalls.Count(); i++) {
        let call = cmpCalls.Skip(i).First()
        let start = parseInt(call.TimeStart.toString().split(':')[0], 16)
        let end = parseInt(call.TimeStart.toString().split(':')[1], 16)

        let loc = host.createInstance("Debugger.Models.TTD.Position", start, end)
        loc.SeekTo()
        
        // print cmd to go to locaation
        printLn(`\ndx -s @$create("Debugger.Models.TTD.Position", ${start}, ${end}).SeekTo()\n`)

        // print function name
        let addr_hex = "0x" + decimalToHex(call.FunctionAddress)
        let symbol = getSymbol(addr_hex) || getModuleOffset(addr_hex)
        printLn("Function Name: " + symbol + '\n')

        if (IS_x86) {
            // 32 bit target
            let split_val = splitHex64to32(call.Parameters[0])
            printParameter(split_val.lower, 0)
            printParameter(split_val.upper, 1)
            split_val = splitHex64to32(call.Parameters[1])
            printParameter(split_val.lower, 2)
            printParameter(split_val.upper, 3)
        } else {
            // 64 bit target
            printParameter(call.Parameters[0], 0)
            printParameter(call.Parameters[1], 1)
            printParameter(call.Parameters[2], 2)
            printParameter(call.Parameters[3], 3)
        }
        
        printLn(`\n`)
    }

    printLn(`DONE!\n`)
}




// **** SHARED FUNCTIONS  **** //
function printParameter(addr, i) {
    try {
        printLn(`Param ${i}: ${getAddressInfo(addr)}\n`)
    } catch (e) {
        printLn(`Param ${i}: ${addr}\n`)
    }
}

function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

function isHex(str) {
    return /[abcdef]|0x/.test(str.toString().toLowerCase())
}

function getAddressInfo(addr) {
    if (isHex(addr))
        addr = hexToDecimal(addr)

    let str = '', val_hex, val
    try {
        val = host.evaluateExpression('(unsigned __int32) ' + addr) 
        val_hex = '0x' + decimalToHex(val)
        str = host.memory.readString(val)
    } catch (e) {
    } finally {
        return `${decimalToHex(addr)}:\t${val_hex} | (${centerWithPadding(val.toString(), PADDING)})\t[${centerWithPadding(getSymbol(val_hex) || getModuleOffset(val_hex) || '', PADDING*3)}]\t\t'${str}'`
        // printLn(addr + "" + val_hex  + "\t(" + val + ")\t" + (str ? " '" + str + "' ": '') + "\n")
    }
}

function getAddressDerefInfo(addr) {
    if (isHex(addr))
        addr = hexToDecimal(addr)

    let str = '', derefAddr_hex, derefAddr
    try {
        derefAddr = host.evaluateExpression('*(unsigned __int32*) ' + addr) 
        derefAddr_hex = '0x' + decimalToHex(derefAddr)
        str = host.memory.readString(derefAddr)
    } catch (e) {
    } finally {
        return `0x${decimalToHex(addr)}:\t(${derefAddr_hex} | ${centerWithPadding(derefAddr.toString(), PADDING)})\t\t[${centerWithPadding(getSymbol(derefAddr_hex) || getModuleOffset(derefAddr_hex) || '', PADDING*3)}]\t\t'${str}'`
        // printLn(addr + "" + val_hex  + "\t(" + val + ")\t" + (str ? " '" + str + "' ": '') + "\n")
    }
}

function centerWithPadding(text, padding, padChars = ' ') {
    let p = (padding - text.length)/2 + text.length
    return text.padStart(p, padChars).padEnd(padding, padChars)
}

function stripLeadingZerosFromHex(hex){
    let start
    for (let i = 0; i < hex.length; i++) {
        if (!start && hex[i] !== '0') {
            start = i
        }
    }
    return hex.slice(start)
}

function decimalToHex(val) {
    const Control = host.namespace.Debugger.Utility.Control
    let result = Control.ExecuteCommand('? 0n' + val)[0]
    
    return result.split(' ')[4]
}

function hexToDecimal(val) {
    const Control = host.namespace.Debugger.Utility.Control
    let result = Control.ExecuteCommand(`? ${val}`)[0]

    return result.split(' ')[2]
}

function splitHex64to32(val) {
    const Control = host.namespace.Debugger.Utility.Control
    val = '0x' + val.toString().replace('0x', '').padStart(16, '0')
    let result = Control.ExecuteCommand(`? ${val.toString().padEnd(18, '0')}`)[0],
        data = result.split(' ')[4],
        upper = data.split('`')[0],
        lower = data.split('`')[1]

    
    // handle null
    if (!lower) {
        lower = upper
        upper = '00000000'
    }

    return {
        upper: '0x' + upper,
        lower: '0x' + lower
    }
}

function getSymbol(addr) {
    const Control = host.namespace.Debugger.Utility.Control
    let val = Control.ExecuteCommand('ln ' + addr)
    let ret_val = ''
    try {
        for (let i = 0; i < val.Count(); i++) {
            if (val[i].includes(addr.replace('0x', ''))) 
                ret_val = val[i].split(' ')[3].trim()
            else if (val[i] == 'Exact matches:')
                ret_val =  val[i+1].trim() 
        }
    } catch (e) {
    } finally {
        return ret_val
    }
}

function getModuleOffset(addr) {
    addr = addr.replace('0x', '')
    const Control = host.namespace.Debugger.Utility.Control
    let val = Control.ExecuteCommand('lm a ' + addr)

    if (val.Count() == 3) {
        let data = val[2].trim().split(' ')
        // printLn('addr ' + addr  + ' - start ' + data[0] + '\n')
        let diff = Control.ExecuteCommand('? ' + addr  + ' - ' + data[0])
        return `${data[4]} + 0x${stripLeadingZerosFromHex(diff[0].split(' ').slice(-1)[0])}`
    }

    return ''
}
