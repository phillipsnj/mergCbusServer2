const { SerialPort } = require("serialport")

// list serial ports:
SerialPort.list().then(ports => {
  ports.forEach(function(port) {
    //const vendorId = port.vendorId
    //const productId = toString(port.productId)
    if (port.vendorId != undefined && port.vendorId.toString().toUpperCase() == '04D8' && port.productId.toString().toUpperCase() == 'F80C') {
      console.log('PORT :' + port.path);
      console.log('PNP  :' + port.pnpId);
      console.log('Manufacturer  :' + port.manufacturer);
      console.log('COM  :' + port.path);
      console.log('Vender  :' + port.vendorId + ' : '+ port.vendorId.toString().toUpperCase());
      console.log('Product  :' + port.productId);
      console.log('Serial  :' + port.serialNumber);
    }
  });
});
