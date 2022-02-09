'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const fs = require('fs')

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

    function  getLastErrorLog () {
        
        var array = fs.readFileSync('./tests/logs/errors.log').toString().split("\r\n");
        var lastLine = array.length-1;
        // will always expect the last element to be empty, so decrement lastline if not zero
        if ( (array[lastLine].length == 0) & lastLine > 0) {lastLine--};
        return array[lastLine];
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


//
//              Grid connect ASCII syntax
// : <S | X> <IDENTIFIER> <N> <DATA-0> <DATA-1> … <DATA-7> ;
// ‘S’ for standard 11-bit, or ‘X’ for extended 29-bit identifier type - anything else is invalid
// The ‘IDENTIFIER’ field consists of up to 4 hex digits for 'S' type, or up to 8 hex digits for 'X' type
// Note that if a 29-bit ID is entered and an 11-bit ID was specified, the command is invalid and ignored.
// 0 to 8 data bytes may be present - more than 8 is invalid
//

	function GetTestCase_lengths () {
		var testCases = [];
		testCases.push({'message':':S1234N1;'});
		testCases.push({'message':':S1234N12;'});
		testCases.push({'message':':S1234N123;'});
		testCases.push({'message':':S1234N1234;'});
		testCases.push({'message':':S1234N12345;'});
		testCases.push({'message':':S1234N123456;'});
		testCases.push({'message':':S1234N1234567;'});
		testCases.push({'message':':S1234N12345678;'});
		testCases.push({'message':':S1234N123456789;'});
		testCases.push({'message':':S1234N123456789A;'});
		testCases.push({'message':':S1234N123456789AB;'});
		testCases.push({'message':':S1234N123456789ABC;'});
		testCases.push({'message':':S1234N123456789ABCD;'});
		testCases.push({'message':':S1234N123456789ABCDE;'});
		testCases.push({'message':':S1234N123456789ABCDEF;'});
		testCases.push({'message':':X12345678N1;'});
		testCases.push({'message':':X12345678N12;'});
		testCases.push({'message':':X12345678N123;'});
		testCases.push({'message':':X12345678N1234;'});
		testCases.push({'message':':X12345678N12345;'});
		testCases.push({'message':':X12345678N123456;'});
		testCases.push({'message':':X12345678N1234567;'});
		testCases.push({'message':':X12345678N12345678;'});
		testCases.push({'message':':X12345678N123456789;'});
		testCases.push({'message':':X12345678N123456789A;'});
		testCases.push({'message':':X12345678N123456789AB;'});
		testCases.push({'message':':X12345678N123456789ABC;'});
		testCases.push({'message':':X12345678N123456789ABCD;'});
		testCases.push({'message':':X12345678N123456789ABCDE;'});
		testCases.push({'message':':X12345678N123456789ABCDEF;'});
		return testCases;
	}


    // different length messages
    //
	itParam("length test - message: ${value.message}", GetTestCase_lengths(), function (done, value) {
		winston.info({message: 'TEST: BEGIN length test'});
        mockSerialPort.binding.emitData(value.message);
        winston.info({message: 'TEST length - mockSerialPort emitData: '+ value.message});
		setTimeout(function(){
            winston.info({message: 'TEST length - message in: '+ messagesIn[0]});
            expect(messagesIn[0]).to.equal(value.message);
			done();
		}, 10);
	})


//
// tests that have errors but do include a valid message, so expect to still pass the valid message on
//

	function GetTestCase_errors () {
		var testCases = [];
		testCases.push({'message':'456:S1234N1;', 'result':':S1234N1;', 'error':'unexpected characters'});
		testCases.push({'message':':456:S1234N1;', 'result':':S1234N1;', 'error':'multiple starting characters'});
		testCases.push({'message':'123:456:S1234N1;', 'result':':S1234N1;', 'error':'multiple starting characters'});
		return testCases;
	}

	itParam("error test - message: ${value.message}", GetTestCase_errors(), function (done, value) {
		winston.info({message: 'TEST: BEGIN error test'});
        mockSerialPort.binding.emitData(value.message);
        winston.info({message: 'TEST error - mockSerialPort emitData: '+ value.message});
		setTimeout(function(){
            var result = getLastErrorLog();
            expect (result).to.include(value.error);                    // expect error log
            winston.info({message: 'TEST error - result: '+ result});
            expect(messagesIn[0]).to.equal(value.result);               // expect to received valid message
			done();
		}, 10);
	})


//
// tests that don't include a valid message, so not expected to pass the message on
//

	function GetTestCase_invalid () {
		var testCases = [];
		testCases.push({'message':'S1234N1;', 'error':'missing starting character'});
		testCases.push({'message':':Z1234N1;', 'error':'unknown Identifier type'});
		testCases.push({'message':':S1234Z1;', 'error':'unknown Transmission type'});
		testCases.push({'message':':S1234N1N;', 'error':'unexpected N or R characters in message'});
		testCases.push({'message':':S1234R1R;', 'error':'unexpected N or R characters in message'});
		testCases.push({'message':':S1234N1R;', 'error':'unexpected N or R characters in message'});
		testCases.push({'message':':S1234N0123456789ABCDEF0;', 'error':'Data field too long'});
		testCases.push({'message':':S123N0123456789ABCDEF0;', 'error':'Identifier field wrong length'});
		testCases.push({'message':':S12345N0123456789ABCDEF0;', 'error':'Identifier field wrong length'});
		testCases.push({'message':':X1234567N0123456789ABCDEF0;', 'error':'Identifier field wrong length'});
		testCases.push({'message':':X123456789N0123456789ABCDEF0;', 'error':'Identifier field wrong length'});
		return testCases;
	}

	itParam("invalid test - message: ${value.message}", GetTestCase_invalid(), function (done, value) {
		winston.info({message: 'TEST: BEGIN invalid test'});
        mockSerialPort.binding.emitData(value.message);
        winston.info({message: 'TEST invalid - mockSerialPort emitData: '+ value.message});
		setTimeout(function(){
            var result = getLastErrorLog();
            expect (result).to.include(value.error);
            winston.info({message: 'TEST invalid - result: '+ result});
            expect(messagesIn.length).to.equal(0);                // don't expect any message
			done();
		}, 10);
	})



})