const mappa = new Mappa('Leaflet');

let myMap;
let mapLoaded;

let userMarker;

let userTurfLocation;
let userCoords;

let thehoe;
let thebb;
let zonePoly;

let statePoints;
var stateArray = [];

let zoneActive;
let zoneCheck = true;
let zoneChange = false;

let draggableCirc = [];
// let userMarker;

let distFromPoint;
let soundStatus = true;
let soundReset = false;
let pointActive = true;

let startActive = true;

let userIcon;
let geoLoc = false;

let riddleCounter = 0;

let tSound = new Audio('data/aud/true.ogg');
let fSound = new Audio('data/aud/false.ogg')

tSound.autoplay = true;
fSound.autoplay = true;

let mapZoomState = false;
let buttonHide = document.getElementById('btn');
buttonHide.style.display = "none";

let introState = true;
let travel = false;


let overWin = document.getElementById('overlayWin');
let moveMe = new Hammer(overWin);

let width = window.innerWidth;
let height = window.innerHeight;


moveMe.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: width / 3 });

var circStyle = {
    fillOpacity: 0,
    weight: 0
}

moveMe.on("panleft",
    function(e) {

        if (!mapLoaded) return;
        if (!introState) return;
        introState = false;
        let logo = document.getElementById('pLogo');
        let title = document.getElementById('section1');
        let sect3 = document.querySelector('.sect3');
        sect3.style.display = "block"

        document.querySelector("h1").innerHTML = "The Aim of the Game";
        document.querySelector("h2").innerHTML = "Venture through the Plymouth Hoe and Barbican and solve the meanings behind the riddles that follow";
        document.querySelector("h3").innerHTML = "Click to continue";

        logo.style.display = "none";
        travel = true;
    });

function preload() {
    // This parses the JSON text file into a Javascript Object
    statePoints = loadJSON("data/LocationPoints.json");
    thehoe = loadJSON("data/thehoe.json");
    thebb = loadJSON("data/thebarbican.json");

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

function overlayWindow() {
    if (!mapLoaded) return;
    if (!geoLoc) return;
    if (!travel) return;

    let overlayWin = document.getElementById('overlayWin');
    let overlay = document.querySelector('.overlayCont');
    let buttonHide = document.getElementById('btn');
    let riddlesCont = document.getElementById('overlayRiddlesCont');
    let overRiddles = document.getElementById('overlayRiddles');


    overlayWin.style.display = "none";
    overlay.style.display = "none";
    buttonHide.style.display = "block";
    riddlesCont.style.display = "block";
    mapZoomState = true;

    myMap.map.setView([50.36544851633019, -4.142467975616455], 17, {
        animate: true,
        duration: 3,

    });
}

// Lets put all our map options in a single object
const options = {
    lat: 50.36544851633019,
    lng: -4.142467975616455,
    zoom: 7,
    style: //"http://{s}.tile.osm.org/{z}/{x}/{y}.png"
        "http://tile.stamen.com/toner/{z}/{x}/{y}.png",

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
        this.marker = L.circle([this.coords[1], this.coords[0]], 25, /*circStyle*/ );
    }

    arrivedAt() {
        this.visited = true;
        this.active = false;
        this.marker.remove();
        riddleCounter++;
        document.querySelector('#hRiddle').innerHTML = riddleCounter + "/13";
        document.querySelector('#riddleText').innerHTML = "Riddle";
        console.log(riddleCounter);
        for (var i = 0; i < this.nextStates.length; i++) {
            this.nextStates[i].setActive();
        }

    }

    addClues(clue) {
        this.clues.push(clue);
    }
}

//in class it was keyPressed() - now using overlay callback
function onMapLoaded() {
    mapLoaded = true;

    //storing all locations/states in an array
    stateArray = [];
    for (var i = 0; i < statePoints.features.length; i++) {
        var state = new State(false, statePoints.features[i].geometry.coordinates, statePoints.features[i].properties.rid);
        print(state);
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
    stateArray[5].addStates([stateArray[8], stateArray[6]]);
    stateArray[6].addState(stateArray[7]);
    stateArray[8].addState(stateArray[9]);
    stateArray[12].addState(stateArray[5]);

    stateArray[0].setActive();

    zoneActive = thehoe;
    drawZone();

    userIcon = L.icon({
        iconUrl: 'data/img/redpin.svg',
        iconSize: [38, 95],
        iconAnchor: [18, 75],
        popupAnchor: [1.5, -35],
    })

    userMarker = L.marker([50.3655879, -4.1381954], { icon: userIcon }).addTo(myMap.map);
    // userMarker.on({
    //     mousedown: function() {
    //         myMap.map.on('mousedown', function(e) {
    //             userMarker.setLatLng(e.latlng);
    //             draggableCirc = [e.latlng.lng, e.latlng.lat]
    //         });
    //     }
    // });
};

function drawZone() {
    //Set Zone for the first time
    zonePoly = L.geoJSON(zoneActive, {
        color: 'seagreen',
        opacity: 0.8
    }).addTo(myMap.map);
}

function gotPosition(position) {
    print("Position Achieved");
    if (!mapLoaded) return;

    if (!userMarker) {
        userMarker = L.marker([position.coords.latitude, position.coords.longitude], { icon: userIcon }).addTo(myMap.map);
    } else {

        userMarker.setLatLng([position.coords.latitude, position.coords.longitude]);
    }
        userCoords = L.GeoJSON.latLngToCoords(userMarker.getLatLng());
        userTurfLocation = turf.point(userCoords);
        geoLoc = true;

}

function buttonPressed() {
    if (soundReset) {
        tSound.pause();
        tSound.currentTime = 0;
        fSound.pause();
        fSound.currentTime = 0;
        soundReset = false;
    }
    soundStatus = true;
    for (var i = 0; i < stateArray.length; i++) {
        //loop through each state array to check whether each state is active
        if (stateArray[i].active == true) {
            distFromPoint = 1000 * turf.distance(userTurfLocation, turf.point(stateArray[i].coords));
            console.log(distFromPoint)
            if (distFromPoint < 30) {
                soundStatus = false;
                stateArray[i].arrivedAt();
            }
        }
    }
    for (let i = 0; i < 1; i++) {
        if (!soundStatus) {
            console.log('test');
            tSound.play();
            pointActive = true;
        } else if (!pointActive || soundStatus) {
                console.log(soundStatus);
            fSound.play();
            soundReset = true;
        }
    }
}

function draw() {

    if (mapLoaded == true) {

        if (!mapZoomState) return;
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

        //Store the current latitude and longitude of the mouse position
        // var posMem = myMap.pixelToLatLng(mouseX, mouseY);
        // var mousePoint = turf.point([posMem.lng, posMem.lat]);
        var mouseChecker = turf.pointsWithinPolygon(userTurfLocation, zoneActive.features[0]);
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
        for (let i = 0; i < stateArray.length; i++) {
            if (stateArray[i].active) {
                popupRiddle.push(stateArray[i].clues);
            }
        }
        zonePoly.bindPopup('<b>Please walk in this area to begin your journey!</b>', { autoPan: false });

        if (!isMouseIn) {
            ellipse(mouseX, mouseY, 20);
            enableMarker(false);
            userMarker.closePopup();
            userMarker.unbindPopup();
        }

        if (!isMouseIn && startActive) {
            startActive = false;
            zonePoly.openPopup();

        } else if (isMouseIn) {
            //If the Mouse is inside the zone
            zonePoly.closePopup();
            zonePoly.unbindPopup();

            startActive = true;

            fill(255, 40, 60);
            ellipse(mouseX, mouseY, 20);
            enableMarker(true);

            userMarker.openPopup();

            if (pointActive) {
                let arr = [];
                for (let i = 0; i < popupRiddle.length; i++) {
                    //populate the array with active points
                    arr.push(popupRiddle[i]);
                    // add a break point after each riddle
                    arr.splice(i + popupRiddle.length, 0, "\</br>\"");
                }
                //convert array into a string and then remove all double quotes
                userMarker.bindPopup(arr.join("").replace(/["]+/g, ''), { autoPan: false, keepInView: true }).openPopup();
                    pointActive = false;
                }
            }
        }
    }
