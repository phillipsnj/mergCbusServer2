//const net = require('net')
//const jsonfile = require('jsonfile')
//const serialport = require('serialport')
//const winston = require('./config/winston.js')
//const parsers = serialport.parsers
const cbusServer = require('./cbusServer')
const jsonServer = require('./jsonServer')
const socketServer = require('./socketServer')
const canUSB = require('./canUSB')
const {SerialPort} = require("serialport");

//const config = jsonfile.readFileSync('./config/config.json')

const USB_PORT = "/dev/tty.usbmodem213301"
const NET_PORT = 5550
const NET_ADDRESS = "localhost"
const JSON_PORT = 5551
const SERVER_PORT=5552
const LAYOUT_NAME="Default"


// use command line to suppress starting cbusServer, so network port can be used
// command line arguments will be 'node' <javascript file started> '--' <arguments starting at index 3>
if ( process.argv[3] != 'network') {
  cbusServer.cbusServer(USB_PORT, NET_PORT, NET_ADDRESS)
  console.log('\nStarting cbusServer...\n');
} else { console.log('\nUsing network...\n'); }

jsonServer.jsonServer(NET_PORT, JSON_PORT, NET_ADDRESS)
socketServer.socketServer(NET_ADDRESS, LAYOUT_NAME,JSON_PORT, SERVER_PORT)

SerialPort.list().then(ports => {

    ports.forEach(function(port) {
        if (port.vendorId != undefined && port.vendorId.toString().toUpperCase() == '04D8' && port.productId.toString().toUpperCase() == 'F80C') {
            // CANUSB4
            canUSB.canUSB(port.path, NET_PORT, NET_ADDRESS)
        } else if (port.vendorId != undefined && port.vendorId.toString().toUpperCase() == '0403' && port.productId.toString().toUpperCase() == '6001') {
            // Old CANUSB
            canUSB.canUSB(port.path, NET_PORT, NET_ADDRESS)
        } else {
            console.log("Cannot connect to port path="+port.path+
                        " vendorId="+port.vendorId+" productId="+port.productId+
                       " serialNumber="+port.serialNumber+" manufacturer="+port.manufacturer);
        }
    })
})

