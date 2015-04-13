function MakeSenseInterface() {
  this.name = "kh";
  this.eat = function(){console.log("EAT");};
  
  this.init = function(){
    enumerateDevices();
    
  }
  
  this.isConnected=function(){
    return (!(connection === -1));
  };
  
  this.digitalOut=function(channelId,outLogic){
    makeSenseDigitalOut(channelId,outLogic);
  };
  
  
  
  var connection = -1;
  var deviceMap = {};
  var pendingDeviceMap = {};
  
  var pendingDeviceEnumerations;
  var enumerateDevices = function() {
    var deviceIds = [];
    var permissions = chrome.runtime.getManifest().permissions;
    for (var i = 0; i < permissions.length; ++i) {
      var p = permissions[i];
      if (p.hasOwnProperty('usbDevices')) {
        deviceIds = deviceIds.concat(p.usbDevices);
      }
    }
    pendingDeviceEnumerations = 0;
    pendingDeviceMap = {};
    makesenseDebugInterfaceDetected = -1;
    for (var i = 0; i < deviceIds.length; ++i) {
      ++pendingDeviceEnumerations;
      chrome.hid.getDevices(deviceIds[i], onDevicesEnumerated);
    }
  };

  var onDevicesEnumerated = function(devices) {
    for (var i = 0; i < devices.length; ++i) {
      pendingDeviceMap[devices[i].deviceId] = devices[i];
    }
    --pendingDeviceEnumerations;
    if (pendingDeviceEnumerations === 0) {	//last getDevices is executed
      deviceMap = pendingDeviceMap;
      for (var k in deviceMap) {
        if (deviceMap[k].vendorId == 1240 && deviceMap[k].productId == 62570){	//this is a IO Board
          for (var collectionIndex in deviceMap[k].collections) {   
            if (deviceMap[k].collections[collectionIndex].usagePage == 65280 && deviceMap[k].collections[collectionIndex].usage == 1 ){
              makesenseDebugInterfaceDetected = deviceMap[k].deviceId;
              //console.log("found "+makesenseDebugInterfaceDetected);
            }
          } 
        }
      }
      
      setTimeout(enumerateDevices, 1000);
      
      if (makesenseDebugInterfaceDetected>=0){
        if (connection === -1){
          var deviceInfo = deviceMap[makesenseDebugInterfaceDetected];
          if (deviceInfo){
            chrome.hid.connect(deviceInfo.deviceId, function(connectInfo) {
              if (!connectInfo) {
                console.warn("Unable to connect to device.");
              }else{
                connection = connectInfo.connectionId;
                console.log("Connected with ID: "+connection);
                makeSenseConnected=true;
                //TODO:some callback
                
                //enablePolling(true);
          	//    ui.makesenseDetected.innerHTML = "IO Board Connected";
              }
              //enableIOControls(true);
            });
          }
        }
      }else{
        if (!(connection === -1)){
          chrome.hid.disconnect(connection, function() {});
          connection = -1;
          console.log("Disconnected with ID: "+connection);
          makeSenseConnected=false;
          //TODO:some callback
          //enablePolling(false);
          //ui.makesenseDetected.innerHTML = "IO Board Disconnected";
          //enableIOControls(false);
        }
      }
    }
  };
  
  var makeSenseDigitalOut = function(channelId,outLogic) {
    var hl = outLogic?"H":"L";
    if (!(connection === -1)){
      var id = 3
      var bytes = new Uint8Array(15);
      bytes[0]="I".charCodeAt(0);
      bytes[1]=hl.charCodeAt(0);
      bytes[2]=channelId+"0".charCodeAt(0);
      chrome.hid.send(connection, id, bytes.buffer, function() {});
    }
  };
  
}

