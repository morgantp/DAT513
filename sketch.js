// Create a new Mappa instance using Leaflet.
const mappa = new Mappa('Leaflet');

let myMap;
let mapLoaded;

//Position of User is stored in this
let userMarker;

let targetMarker;

let thehoe;

let thehoeLet;

let statePoints;
var stateArray = [];

let startActive = true;

function preload() {
  // This parses the JSON text file into a Javascript Object
  statePoints = loadJSON("data/LocationPoints.json");
  thehoe = loadJSON("data/thehoe.json");
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
  constructor(active, coordinates) {
    this.active = active;
    this.coords = coordinates;
    this.nextStates = [];
    this.marker = null;
    //clues store
    this.clues = [];
  }
  
  addState (state) {
    this.nextStates.push(state);
  }
  
  addStates (states) {
    for (var i = 0; i < states.length; i++) {
      this.nextStates.push(states[i]);
    }
  }
  
  setActive () {
    if(this.active == true) return;
    this.active = true;
    this.marker = L.marker([this.coords[1], this.coords[0]]);
    
  }
  
  arrivedAt () {
    this.active = false;
    this.marker.remove();
    for(var i = 0; i < this.nextStates.length; i++){
      this.nextStates[i].setActive();
    }
    
  }
  
  addClues (clue) {
    this.clues.push(clue);
  }
}

function setup() {
 
  let canvas = createCanvas(windowWidth, windowHeight);
  
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas, onMapLoaded);
  
  if(navigator.geolocation) {
    navigator.geolocation.watchPosition(gotPosition);
  } 
}


//in class it was keyPressed() - now using overlay callback
function onMapLoaded(){
  mapLoaded = true;
  
  /*
  //storinging all locations/states in single variables
  var state01 = new State(true, statePoints.features[0].geometry.coordinates);
  var state02 = new State(false, statePoints.features[1].geometry.coordinates);
  state01.addState(state02);
  
  print(state01.coords);
  print(state02.coords);
  print(state01.nextStates);
  */
  
//storing all locations/states in an array
  stateArray = [];
  for (var i = 0; i < statePoints.features.length; i++) {
    var state = new State(false, statePoints.features[i].geometry.coordinates);
    stateArray.push(state);
  }
  
  //set next LocationPoints
  stateArray[0].addStates([stateArray[1], stateArray[2]]);
  stateArray[1].addStates([stateArray[3], stateArray[4]]);
  stateArray[2].addState(stateArray[3]);
  stateArray[3].addState(stateArray[4]);
  stateArray[4].addStates([stateArray[5], stateArray[6]]);
   
  stateArray[0].setActive(); 
  //print (stateArray[0]);
  //print (stateArray);
}



function gotPosition(position){
  print("Got Position!");
  print(position.coords.latitude);
  print(position.coords.longitude);
  
  
  if (!mapLoaded) return;
  
  if (!userMarker){
      userMarker = L.circleMarker([position.coords.latitude, position.coords.longitude]).addTo(myMap.map);
  } else {
      //MoveMarker
      userMarker.setLatLng([position.coords.latitude, position.coords.longitude]);
  }
}

function draw() {

  if(mapLoaded == true){
    clear();    
    
    var mousePos = [];
    //Store the current latitude and longitude of the mouse position
    var posMem = myMap.pixelToLatLng(mouseX, mouseY);
    mousePos = [posMem.lng, posMem.lat];
    var mousePoint = turf.point(mousePos);
    var mouseChecker = turf.pointsWithinPolygon(mousePoint, thehoe.features[0]);
    var isMouseIn = mouseChecker.features.length;
    print (isMouseIn);
    
    function enableMarker(enable) {
      for (let i = 0; i < stateArray.length; i++) {
        if (stateArray[i].marker) {
          if(enable && stateArray[i].active) {
           stateArray[i].marker.addTo(myMap.map);   
          } else if (!enable) {
            stateArray[i].marker.remove();
          }
        }   
      }
    }
    
    if (!isMouseIn) {
      fill(0, 0, 0);
      ellipse(mouseX, mouseY, 20);
      enableMarker(false);
    }
    if (!isMouseIn && startActive) {
      startActive = false;
      //Set Zone for the first time
      thehoeLet = L.geoJSON(thehoe).addTo(myMap.map);
      let i = L.marker(thehoeLet.getBounds().getCenter()).addTo(myMap.map);
      i.bindPopup('<b>Hello world!</b><br>I am a popup.').openPopup();
    } else if (isMouseIn) {
      //If the Mouse is inside the Zone delete the border.
      startActive = true;
      fill(255, 0, 0);
      ellipse(mouseX, mouseY, 20);
      thehoeLet.remove();       
      enableMarker(true);
    }
    
//whenever an active location is reached, the next state is activated
    for (var i = 0; i < stateArray.length; i++) {
      if(stateArray[i].active == true){
        distance = 1000 * turf.distance(mousePoint, turf.point(stateArray[i].coords));
        //print(distance);
        if(distance < 30) {
          stateArray[i].arrivedAt();
        }
      }
    }
  }
    
  
}