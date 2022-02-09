const net = require('net');
const serialport = require("serialport");
const MockBinding = require('@serialport/binding-mock')
const winston = require('winston');
const parsers = serialport.parsers


exports.canUSB = function (USB_PORT, NET_PORT, NET_ADDRESS) {

    const parser = new parsers.Readline({
        delimiter: ';'
    })
    
    if(USB_PORT == "MOCK_PORT"){
        MockBinding.createPort('MOCK_PORT', { echo: false, record: true })
        serialport.Binding = MockBinding;
        var serialPort = new serialport('MOCK_PORT');
    }
    else 
    {
        var serialPort = new serialport(USB_PORT, {
            baudRate: 115200,
            dataBits: 8,
            parity: 'none',
            stopBits: 1
        })
    }

    serialPort.pipe(parser)

    const client = new net.Socket()

    client.connect(NET_PORT, NET_ADDRESS, function () {
        winston.info({message: `CbusServer : Client Connected to ${USB_PORT}`})
    })

    client.on('data', function (data) {
        var outMsg = data.toString().split(";")
        for (var i = 0; i < outMsg.length - 1; i++) {
            var message = getValidMessage(outMsg[i]);    // rebuild message as string
            if (message) {
                serialPort.write(message)
                winston.info({message: `${USB_PORT} -> CbusServer Message Received : ${message}`})
            }
        }
    })

    serialPort.on("open", function () {
        winston.info({message: `Serial Port : ${USB_PORT} Open`})
    })
    
    parser.on('data', function (data) {
        var message = getValidMessage(data);    // rebuild message as string
        if (message) {
            winston.info({message: `${USB_PORT} -> Message Parsed : ${message}`})
            client.write(message)
        }
    })

    serialPort.on("error", function (err) {
        winston.error({message: `Serial port ERROR:  : ${err.message}`})
    });
    
    return serialPort;
};


/**
* @desc check & return a valid message<br>
* @param {Object} message - a message up to but NOT including the terminating character ';'
* @return {Object} returns a validated message or 'undefined' if message is invalid in any way
*
*/
function getValidMessage(data) {
    data = data.toString() + ';';       // replace lost terminator
    
    // now split up by the starting character - if there's just one starting character as expected we'll get two elements
    // with the expected message in the second element
    var array = data.split(':');
    
    if (array.length == 1) {
        // no starting character found
        // so incomplete message - can't return a valid message
        winston.error({message: `message rejected - missing starting character: ${data.toString()}`})
        return undefined;
    }
    
    if (array.length == 2) {
        if (array[0].length > 0) {
            // unexpected characters before starting character
            // these will be ignored later - but post error anyway
            winston.error({message: `unexpected characters in message: ${data.toString()}`})
        }
    }
    
    // if more than one element, then there is at least one starting character
    if (array.length > 2) {
        // more than one starting character, so potentially two (or more) messages merged
        // can still use the last message, but generate an error log anyway
        winston.error({message: `multiple starting characters in message: ${data.toString()}`})
    }
    
    // get the last array element
    // need to replace the starting character lost in the 'split' operation
    var message = ':' + array[array.length - 1].toString()


    // now check that it's either an 'S' or 'X' type of message
    if ( (message[1] != 'S') && (message[1] != 'X') ) {
        winston.error({message: `message rejected - unknown Identifier type: ${message}`})
        return undefined;
    }

    // there are only two transmission types defined, 'N' & 'R'
    // use regex to split on either N or R
    var splitMessage = message.split(/N|R/);

    if (splitMessage.length == 1) {
        // if 1 then not N or R - unknown transmission type - so reject message
        winston.error({message: `message rejected - unknown Transmission type: ${message}`})
        return undefined;
    }

    if (splitMessage.length > 2) {
        winston.error({message: `message rejected - unexpected N or R characters in message: ${message}`})
        return undefined;
    }
    
    // First element of split contains the type and Identifier - we've already tested type above, so check identifier
    if (message.includes('S')) {
        // Standard identifier - 11 bits, so 4 characters, plus start & type gives 6 characters
        if ( splitMessage[0].length != 6 ) {
            winston.error({message: `message rejected - Standard Identifier field wrong length: ${message}`})
            return undefined;
        }
    }
    if (message.includes('X')) {
        // eXtended identifier - 29 bits, so 8 characters, plus start & type gives 10 characters
        if ( splitMessage[0].length != 10 ) {
            winston.error({message: `message rejected - Extended Identifier field wrong length: ${message}`})
            return undefined;
        }
    }

    // 2nd element is data field of 0 to 16 hex characters (8 bytes) plus the terminator - so 1 to 17 characters
    // we add the terminator, and test for it earlier, so only test for maximum value
    if ( splitMessage[1].length > 17 ) {
        winston.error({message: `message rejected - Data field too long: ${message}`})
        return undefined;
    }


    return message;
}




