// Create a new Mappa instance using Leaflet.
const mappa = new Mappa('Leaflet');

let myMap;
let mapLoaded;

//Position of User is stored in this
let userMarker;

let targetMarker;

let thehoe;
let thebb;
let zonePoly;

let statePoints;
var stateArray = [];

let zoneCheck = true;
let zoneActive;
let zoneChange = false;

let draggableCirc = [];
let debugLoc;

let startActive = true;

let startingMarker;

let dingsound = new Audio('ding.wav');


function preload() {
  // This parses the JSON text file into a Javascript Object
  statePoints = loadJSON("data/LocationPoints.json");
  thehoe = loadJSON("data/thehoe.json");
  thebb = loadJSON("data/thebarbican.json");
}

// Lets put all our map options in a single object
const options = {
  lat: 50.36544851633019,
  lng: -4.142467975616455,
  zoom: 16,
  style: //"http://{s}.tile.osm.org/{z}/{x}/{y}.png"
    "http://tile.stamen.com/toner/{z}/{x}/{y}.png"
};


class State {
  constructor(active, coordinates, riddle) {
    this.active = active;
    this.coords = coordinates;
    this.nextStates = [];
    this.marker = null;
    this.clues = riddle;
    this.visited = false;
  }

  addState(state) {
    this.nextStates.push(state);
  }

  addStates(states) {
    for (var i = 0; i < states.length; i++) {
      this.nextStates.push(states[i]);
    }
  }

  setActive() {
    if (this.visited == true) return;
    if (this.active == true) return;
    this.active = true;
    this.marker = L.circle([this.coords[1], this.coords[0]], 25);

  }

  arrivedAt() {
    this.visited = true;
    this.active = false;
    this.marker.remove();
    for (var i = 0; i < this.nextStates.length; i++) {
      this.nextStates[i].setActive();
    }

  }

  addClues(clue) {
    this.clues.push(clue);
  }
}

function setup() {

  let canvas = createCanvas(windowWidth - 1, windowHeight - 1);
  canvas.parent('map');
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas, onMapLoaded);

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(gotPosition);
  }
}


//in class it was keyPressed() - now using overlay callback
function onMapLoaded() {
  mapLoaded = true;

  //storing all locations/states in an array
  stateArray = [];
  for (var i = 0; i < statePoints.features.length; i++) {
    var state = new State(false, statePoints.features[i].geometry.coordinates, statePoints.features[i].properties.rid);
    
    stateArray.push(state);
  }

  //set next LocationPoints/next states
  stateArray[0].addState(stateArray[1]);
  stateArray[1].addState(stateArray[2]);
  stateArray[2].addState(stateArray[3]);
  stateArray[3].addState(stateArray[4]);
  stateArray[4].addStates([stateArray[5], stateArray[10]]);
  stateArray[10].addState(stateArray[11]);
  stateArray[11].addState(stateArray[12]);
  stateArray[5].addStates([stateArray[8],stateArray[6]]);
  stateArray[6].addState(stateArray[7]);
  stateArray[8].addState(stateArray[9]);
  stateArray[12].addState(stateArray[5]);

  stateArray[0].setActive();

  print(stateArray[0]);
  
  zoneActive = thehoe;
  drawZone();

  debugLoc = L.circle([50.3655879, -4.1381954], 20).addTo(myMap.map);
  debugLoc.on({
    mousedown: function() {
      myMap.map.on('mousedown', function(e) {
        debugLoc.setLatLng(e.latlng);
        draggableCirc = [e.latlng.lng, e.latlng.lat]
      });
    }
  });
  myMap.map.on('mouseup', function(e) {
    myMap.map.removeEventListener('mousemove');
  })
}

function drawZone() {
  //Set Zone for the first time
  zonePoly = L.geoJSON(zoneActive, {
    color: 'seagreen',
    opacity: 0.8
  }).addTo(myMap.map);
}

function gotPosition(position) {
  print("Got Positiona!");
  print(position.coords.latitude);
  print(position.coords.longitude);


  if (!mapLoaded) return;

  if (!userMarker) {
    userMarker = L.circleMarker([position.coords.latitude, position.coords.longitude]).addTo(myMap.map);
  } else {
    //MoveMarker
    userMarker.setLatLng([position.coords.latitude, position.coords.longitude]);
  }
}

function buttonPressed() {
  
  for (var i = 0; i < stateArray.length; i++) {
    if (stateArray[i].active == true) {
      let distance2 = 1000 * turf.distance(turf.point(draggableCirc), turf.point(stateArray[i].coords));
      print(distance2);
      if (distance2 < 30) {
          dingsound.play();
        stateArray[i].arrivedAt();
      }
    }
  }
}

function draw() {


  if (mapLoaded == true) {

    clear();

    //checks if first Zone is done
    zoneCheck = true;
    for (i = 0; i < 5; i++) {
      if (stateArray[i].visited == false) {
        zoneCheck = false;
      }
    }

    //if first zone is done, changes which zone is active
    if (zoneCheck) {
      if (!zoneChange) {
        zoneChange = true;
        zonePoly.remove();
        zoneActive = thebb;
        drawZone();
      }
    } else {
      zoneActive = thehoe;
    }


    var mousePos = [];
    //Store the current latitude and longitude of the mouse position
    var posMem = myMap.pixelToLatLng(mouseX, mouseY);
    mousePos = [posMem.lng, posMem.lat];
    // print(mousePos);
    var mousePoint = turf.point(mousePos);
    var mouseChecker = turf.pointsWithinPolygon(mousePoint, zoneActive.features[0]);
    var isMouseIn = mouseChecker.features.length;

    //draws and removes the markers
    function enableMarker(enable) {
      for (let i = 0; i < stateArray.length; i++) {
        if (stateArray[i].marker) {
          if (enable && stateArray[i].active) {
            stateArray[i].marker.addTo(myMap.map);
          } else if (!enable) {
            stateArray[i].marker.remove();
          }
        }
      }
    }
    
    let popupRiddle = [];
    for (let i = 0; i < stateArray.length; i++){
      if(stateArray[i].active){
        
        popupRiddle.push(stateArray[i].clues);
        // popupRiddle = stateArray[i].clues[0];
        print(popupRiddle);
        // print(popupRiddle);
    }
    }
  
    
    if (!isMouseIn) {
      // fill(255, 0, 0);
      ellipse(mouseX, mouseY, 20);
      enableMarker(false);
    }
    if (!isMouseIn && startActive) {
      startActive = false;
      startingMarker = L.marker(zonePoly.getBounds().getCenter()).addTo(myMap.map);
      startingMarker.bindPopup('<b>Please walk in this area to begin your journey!</b>').openPopup();
    } else if (isMouseIn) {
      //If the Mouse is inside the zone
      startActive = true;
      fill(255, 40, 60);
      ellipse(mouseX, mouseY, 20);
      startingMarker.remove();
      enableMarker(true);
      
      if (popupRiddle.length == 1){
        debugLoc.bindPopup(popupRiddle[0]).openPopup();
      } else if (popupRiddle.length == 2) {
        debugLoc.bindPopup(popupRiddle[0] + "</br>" + popupRiddle[1]).openPopup();
      } else if (popupRiddle.length == 3) {
        debugLoc.bindPopup(popupRiddle[0] + "</br>" + popupRiddle[1] + "</br>" + popupRiddle[2]).openPopup();
    }

    }

    // whenever an active location is reached, the next state is activated
    
    // for (var i = 0; i < stateArray.length; i++) {
    //   if (stateArray[i].active == true) {
    //     distance = 1000 * turf.distance(mousePoint, turf.point(stateArray[i].coords));
    //     if (distance < 30) {
    //       stateArray[i].arrivedAt();
    //     }
    //   }
    // }
  }




}