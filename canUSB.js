const net = require('net');
const serialport = require("serialport");
const winston = require("./config/winston.js");
const SerialPort = serialport.SerialPort;
const parsers = serialport.parsers

//var clients = [];

exports.canUSB = function (USB_PORT, NET_PORT, NET_ADDRESS) {

    const parser = new parsers.Readline({
        delimiter: ';'
    })

    const serialPort = new serialport(USB_PORT, {
        baudRate: 115200,
        dataBits: 8,
        parity: 'none',
        stopBits: 1
    })

    serialPort.pipe(parser)

    const client = new net.Socket()

    client.connect(NET_PORT, NET_ADDRESS, function () {
        winston.info({message: `CbusServer : Client Connected to ${USB_PORT}`})
    })

    client.on('data', function (data) {
        //console.log(USB_PORT+' USB4 Received: ' + data);
        var outMsg = data.toString().split(";")
        for (var i = 0; i < outMsg.length - 1; i++) {
            serialPort.write(outMsg[i].toString() + ';')
            //console.log(USB_PORT + ' USB4 Received: ' + outMsg[i].toString() + ';')
            winston.info({message: `${USB_PORT} -> CbusServer Message Received : ${outMsg[i].toString()}`})
        }
    })

    serialPort.on("open", function () {
        winston.info({message: `PORT : ${USB_PORT} Open`})
        //console.log('Serial Port '+USB_PORT+' Open')
    })

    parser.on('data', function (data) {
        winston.info({message: `${USB_PORT} -> Message Parsed : ${data.toString()}`})
        //console.log('USB Received (Parsed)' + data.toString() + ";")
        client.write(data.toString() + ";")
    })

    serialPort.on("error", function (err) {
        //console.log('Serial port error: ' + err.message)
        winston.error({message: `Serial port ERROR:  : ${err.message}`})
    });
};

