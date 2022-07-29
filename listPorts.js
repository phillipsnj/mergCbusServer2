const serialport = require('serialport');

// list serial ports:
serialport.list().then(ports => {
  ports.forEach(function(port) {
    console.log('PORT :'+port.path);
    console.log('PNP  :'+port.pnpId);
    console.log('Manufacturer  :'+port.manufacturer);
    console.log('COM  :'+port.path);
    console.log('Vender  :'+port.vendorId);
    console.log('Product  :'+port.productId);
    console.log('Serial  :'+port.serialNumber);
  });
});
