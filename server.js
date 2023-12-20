//const net = require('net')
//const jsonfile = require('jsonfile')
//const serialport = require('serialport')
const winston = require('./config/winston.js')
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

run_main()

// have to wrap top level code in async function in order to use await function
// 
async function run_main(){

  // use command line to suppress starting cbusServer, so network port can be used
  // command line arguments will be 'node' <javascript file started> '--' <arguments starting at index 3>
  if ( CommandLineArgument('network')) {
    winston.info({message: '\nUsing network...\n'});
  }
  else{
    var serialPorts = await getSerialPorts()
    if (serial = CommandLineArgument('serialport')){
			const myArray = serial.split("=");
      winston.info({message: 'Using serial port ' + myArray[1]});
      if (serialPorts.find(({ path }) => path === myArray[1]) ){
        canUSB.canUSB(myArray[1], NET_PORT, NET_ADDRESS)
      } else {
        await terminateApp('serial port ' + myArray[1] + ' not found \n');
      }
    } else {
      winston.info({message: 'Finding CANUSBx...'});
      if ( await connectCANUSBx() ) {
      } else {
        await terminateApp('CANUSBx not found \n');
      }
    }
    cbusServer.cbusServer(USB_PORT, NET_PORT, NET_ADDRESS)  //USB_PORT not used....
    winston.info({message: 'Starting cbusServer...\n'});
  }

  jsonServer.jsonServer(NET_PORT, JSON_PORT, NET_ADDRESS)
  socketServer.socketServer(NET_ADDRESS, LAYOUT_NAME,JSON_PORT, SERVER_PORT)
/*
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
  */

}

async function connectCANUSBx(){
	return new Promise(function (resolve, reject) {
    SerialPort.list().then(ports => {
      ports.forEach(function(port) {
        if (port.vendorId != undefined && port.vendorId.toString().toUpperCase() == '04D8' && port.productId.toString().toUpperCase() == 'F80C') {
          // CANUSB4
          winston.info({message: 'CANUSB4 : ' + port.path});
          canUSB.canUSB(port.path, NET_PORT, NET_ADDRESS)
          resolve(true);
        } else if (port.vendorId != undefined && port.vendorId.toString().toUpperCase() == '0403' && port.productId.toString().toUpperCase() == '6001') {
          // Old CANUSB
          winston.info({message: 'CANUSB : ' + port.path});
          canUSB.canUSB(port.path, NET_PORT, NET_ADDRESS)
          resolve(true);
        }
      })
      resolve(false);
    })
  })
}

async function getSerialPorts() {
	return new Promise(function (resolve, reject) {
    var serialports= [];
    var portIndex = 0;
    SerialPort.list().then(ports => {
      ports.forEach(function(port) {
        serialports[portIndex] = port
        winston.info({message: 'serial port ' + portIndex + ': ' + serialports[portIndex].path});
        winston.debug({message: 'serial port ' + portIndex + ': ' + JSON.stringify(serialports[portIndex])});
        portIndex++
      })
      if (portIndex == 0){
        winston.info({message: 'No active serial ports found...\n'});
      }
      resolve(serialports);
    })
  })
}


function CommandLineArgument(argument){
	// command line arguments will be 'node' <javascript file started> '--' <arguments starting at index 3>
	for (var item in process.argv){
//    winston.info({message: 'main: argv ' + item + ' ' + process.argv[item]});
    if (process.argv[item].toLowerCase().includes(argument)){
      return process.argv[item];
    }
	}
  return undefined;
}

async function terminateApp(message){
  winston.info({message: "App terminate : " + message});
  sleep(500);   // allow time for logs to catch up
  process.exit()
}

function sleep(timeout) {
	return new Promise(function (resolve, reject) {
		//here our function should be implemented 
		setTimeout(()=>{
			resolve();
			;} , timeout
		);
	});
};
