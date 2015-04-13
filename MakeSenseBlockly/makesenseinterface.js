function MakeSenseInterface() {
  
  this.init = function(){
    enumerateDevices();
    
  }
  
  this.isConnected=function(){
    return (!(connection === -1));
  };
  
  this.digitalOut=function(channelId,outLogic){
    makeSenseDigitalOut(channelId,outLogic);
  };
  
  this.analogIn=function(channelId,callback){
    makeSenseAnalogIn(channelId);
    analogReadCallback=callback;
  };
  
  var debuggingOutput = false;
  
  var analogReadCallback = null;
  
  var connection = -1;
  var deviceMap = {};
  var pendingDeviceMap = {};
  var makesenseDebugInterfaceDetected = -1;
  var keepPolling = false;
  
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
                //TODO:some callback
                
                enablePolling(true);
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
          //TODO:some callback
          enablePolling(false);
          //ui.makesenseDetected.innerHTML = "IO Board Disconnected";
          //enableIOControls(false);
        }
      }
    }
  };
  
  var isReceivePending = false;
  var pollForInput = function() {
    isReceivePending = true;
    chrome.hid.receive(connection, function(reportId, data) {
      isReceivePending = false;
      if (reportId == 3){	//only handle data for debug interface
        logInput(new Uint8Array(data));
      }
      if (keepPolling) {
        setTimeout(pollForInput, 0);
      }
    });
  };

  var enablePolling = function(pollEnabled) {
    keepPolling = pollEnabled;
    if (pollEnabled && !isReceivePending) {
      pollForInput();
    }
  };
  
  var byteToHex = function(value) {
    if (value < 16)
      return '0' + value.toString(16);
    return value.toString(16);
  };
  
  var byteHexToInt = function(value) {
    if (value>=48 && value<=57){
      return (value-48);
    }else if (value>=65 && value<=70){
      return (value-65+10);
    }else if (value>=97 && value<=102){
      return (value-97+10);
    }else{
      return null;
    }	
  }

  var logInput = function(bytes) {
    if (bytes.length == 15 && bytes[0]=="I".charCodeAt(0) && bytes[1]=="R".charCodeAt(0)){
      /*var return_val=byteHexToInt(bytes[3]);
      if (return_val!=null){
        var read_value=return_val;
        var return_val=byteHexToInt(bytes[2]);
        if (return_val!=null){
          read_value=return_val*16+read_value;
          for (var i=0;i<8;i++){
            channels[i].lbl_d_read.innerHTML = ((read_value&(1<<i))!=0)?"HIGH":"low";
          }
        }
      }else if(bytes[3]==72 || bytes[3]==76){
        var return_val=byteHexToInt(bytes[2]);
        if (return_val!=null && return_val>=0 && return_val<8){
          channels[return_val].lbl_d_read.innerHTML = (bytes[3]==72)?"HIGH":"low";
        }
      }*/
    }else if (bytes.length == 15 && bytes[0]=="I".charCodeAt(0) && bytes[1]=="I".charCodeAt(0)){
      var return_val1=byteHexToInt(bytes[2]);
      var return_val2=byteHexToInt(bytes[3]);
      var return_val3=byteHexToInt(bytes[4]);
      if (return_val1!==null & return_val2!==null & return_val3!==null){
        if (return_val1<8){
          if (debuggingOutput) {
            console.log("Channel " + return_val1 + ":" + (return_val2*16+return_val3));
          }
          analogReadCallback(return_val1,(return_val2*16+return_val3));
          //channels[return_val1].lbl_a_read.innerHTML = return_val2*16+return_val3;
        }
      }
    
    }
    
    {
      var log = '';
      for (var i = 0; i < bytes.length; i += 16) {
        var sliceLength = Math.min(bytes.length - i, 16);
        var lineBytes = new Uint8Array(bytes.buffer, i, sliceLength);
        for (var j = 0; j < lineBytes.length; ++j) {
          log += byteToHex(lineBytes[j]) + ' ';
        }
        for (var j = 0; j < lineBytes.length; ++j) {
          var ch = String.fromCharCode(lineBytes[j]);
          if (lineBytes[j] < 32 || lineBytes[j] > 126)
            ch = '.';
          log += ch;
        } 
        //log += '\n';
      }
      //log += "======================================================\n";
      if (debuggingOutput) {
        console.log(log);
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
  
  var makeSenseAnalogIn = function(channelId) {
    if (!(connection === -1)){
      var id = 3
      var bytes = new Uint8Array(15);
      bytes[0]="I".charCodeAt(0);
      bytes[1]="I".charCodeAt(0);
      bytes[2]=channelId+"0".charCodeAt(0);
      chrome.hid.send(connection, id, bytes.buffer, function() {});
    }
  };  
  
}

