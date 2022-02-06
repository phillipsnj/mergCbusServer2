//const net = require('net')
//const jsonfile = require('jsonfile')
//const serialport = require('serialport')
//const winston = require('./config/winston.js')
//const parsers = serialport.parsers
const cbusServer = require('./cbusServer')
const jsonServer = require('./jsonServer')
const socketServer = require('./socketServer')
const canUSB = require('./canUSB')

//const config = jsonfile.readFileSync('./config/config.json')

const USB_PORT = "COM4"
const NET_PORT = 5550
const NET_ADDRESS = "localhost"
const JSON_PORT = 5551
const SERVER_PORT=5552
const LAYOUT_NAME="Default"

cbusServer.cbusServer(USB_PORT, NET_PORT, NET_ADDRESS)
jsonServer.jsonServer(NET_PORT, JSON_PORT, NET_ADDRESS)
socketServer.socketServer(NET_ADDRESS, LAYOUT_NAME,JSON_PORT, SERVER_PORT)
canUSB.canUSB(USB_PORT,NET_PORT, NET_ADDRESS)

