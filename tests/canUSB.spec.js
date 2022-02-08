'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');

const canUSB = require('./../canUSB.js');

const NET_PORT = 5550;
const NET_ADDRESS = "127.0.0.1"
const USB_PORT = "MOCK_PORT"

function decToHex(num, len) {return parseInt(num).toString(16).toUpperCase().padStart(len, '0');}

    var clients = [];
    let messagesIn = []


    var server = net.createServer(function (socket) {
        var socket=socket;
        clients.push(socket);
        winston.info({message: 'TEST: canUSB connected at IP port : ' + socket.remotePort});

        socket.setKeepAlive(true,60000);
        socket.on('data', function (data) {
            winston.info({message: 'TEST: Receive  <<<< Port ' + socket.remotePort + ' Data: ' + data});
            const msgArray = data.toString().split(";");
            for (var msgIndex = 0; msgIndex < msgArray.length - 1; msgIndex++) {
                var message = msgArray[msgIndex].concat(";");				// add back the ';' terminator that was lost in the split
                messagesIn.push(message);					// store the incoming messages so the test can inspect them
                winston.info({message: 'TEST: <<< messageIn[' + msgIndex + '] ' +  message + " <<< "});
                var cbusMsg = cbusLib.decode(message)      // decode into cbus message
            }
        }.bind(this));

        socket.on('end', function () {
            clients.splice(clients.indexOf(socket), 1);
            winston.info({message: 'TEST: Client Disconnected at port : ' + socket.remotePort});
        }.bind(this));
        
        socket.on('error', function(err) {
            winston.info({message: 'TEST: Port ' + socket.remotePort + ' Socket error ' + err});
            clients.splice(clients.indexOf(socket), 1);
            socket.end();
            winston.info({message: 'TEST: Port ' + socket.remotePort + ' Socket ended '});
        }.bind(this));
        
    }.bind(this));

    server.listen(NET_PORT);

    function broadcast(msgData) {
        clients.forEach(function (client) {
            client.write(msgData);
            winston.debug({message: 'TEST: Transmit >>>> Port: ' + client.remotePort + ' Data: ' + msgData});
        });
    }




describe('canUSB tests', function(){

    var mockSerialPort;
    

	before(function() {
		winston.info({message: ' '});
		winston.info({message: '======================================================================'});
		winston.info({message: '----------------------- canUSB tests -------------------'});
		winston.info({message: '======================================================================'});
		winston.info({message: ' '});

        mockSerialPort = canUSB.canUSB(USB_PORT, NET_PORT, NET_ADDRESS)
        winston.info({message: 'TEST: canUSB returned ' + JSON.stringify(mockSerialPort.path)});

	})
    
    beforeEach (function() {
        messagesIn = [];
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
   		winston.info({message: ' '});                       // blank line to separate tests
   		winston.info({message: 'TEST: tests finished '});
        // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
            setTimeout(function(){
                done();
            }, 100);
		}, 100);
    });
	

    //
	it("QNN test", function (done) {
		winston.info({message: 'TEST: BEGIN QNN test'});
        var msgData = cbusLib.encodeQNN();
        broadcast(msgData);
		setTimeout(function(){
            winston.info({message: 'TEST QNN - lastWrite: '+ mockSerialPort.binding.lastWrite});
            expect(mockSerialPort.binding.lastWrite.toString()).to.equal(msgData);
			done();
		}, 10);
	})

	it("ACK test", function (done) {
		winston.info({message: 'TEST: BEGIN ACK test'});
        var msgData = cbusLib.encodeACK();
        mockSerialPort.binding.emitData(msgData);
        winston.info({message: 'TEST ACK - mockSerialPort emitData: '+ msgData});
		setTimeout(function(){
            winston.info({message: 'TEST ACK - message in: '+ messagesIn[0]});
            expect(messagesIn[0]).to.equal(msgData);
			done();
		}, 10);
	})



})