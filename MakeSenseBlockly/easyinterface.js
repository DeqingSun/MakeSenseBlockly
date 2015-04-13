
    
(function() {
  var ui = {
    makeSenseConnected: null,
    buttonPlaceholder: null,
    led0High: null,
    led0Low: null,
    
  };
  
  var makeSenseInterface;

  var initializeWindow = function() {
    for (var k in ui) {
      var str=k;
      str = str.replace(/([A-Z])/g, '-$1');
      var id = str.toLowerCase();
      var element = document.getElementById(id);
      if (!element) {
        throw "Missing UI element: " + k + "with id: " + id;
      }
      ui[k] = element;
    }
    
    makeSenseInterface = new MakeSenseInterface();
    makeSenseInterface.init();
   
    ui.makeSenseConnected.addEventListener('click', onMakeSenseConnectedClicked);
    ui.buttonPlaceholder.addEventListener('click', onButtonPlaceholderClicked);
    ui.led0High.addEventListener('click', onLed0HighClicked);
    ui.led0Low.addEventListener('click', onLed0LowClicked);
    
  };
  
  var onMakeSenseConnectedClicked = function() {
    if (makeSenseInterface.isConnected()) {
        console.log("MakeSense is connected");
    }else{
        console.log("MakeSense is disconnected");
    }
  };
  
  var onButtonPlaceholderClicked = function() {
    
  };
  
  var onLed0HighClicked = function() {
    makeSenseInterface.digitalOut(0,true);
  };
  
  var onLed0LowClicked = function() {
    makeSenseInterface.digitalOut(0,false);
  };
  
  window.addEventListener('load', initializeWindow);
}());
