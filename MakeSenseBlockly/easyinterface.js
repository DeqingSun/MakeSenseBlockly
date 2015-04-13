
    
(function() {
  var ui = {
    makeSenseConnected: null,
  };
  

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
    
   
    ui.makeSenseConnected.addEventListener('click', onMakeSenseConnectedClicked);
  };
  
  var onMakeSenseConnectedClicked = function() {
    console.log("hello world");
  };
  

  window.addEventListener('load', initializeWindow);
}());
