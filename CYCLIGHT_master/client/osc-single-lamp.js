/*
Lad os prøve at lave et program som modtager to variable til at styre lysstyrke og temperatur med osc variablene lys og varme

BEMÆRK for at et javascript kan modtage OSC skal det køre filen bridge.js med node. Find din terminal og find mappen som projektet ligger i. Her ligger der en fil ved navn bridge.js 

Skriv denne kommando i terminalen:

node bridge.js
*/

var lys = 0;
var varme = 0;
/*Vi deklare CurrentTemperature og endTemperature. Det er den kelvin skala som går fra 
5000 kelvin til 2000 kelvin
*/
let currentTemperature, endTemperature;
sunrise;
sunset;
// Bridge ip-adresse. Find den fx i hue app'en
var url = '192.168.0.100';
// Hent dit brugernavn - find det ved at følge installationsguiden her: 
// https://developers.meethue.com/develop/get-started-2/#

var username = 'i5HJnW3IiamT4InBYK-7TlwuMA1MFeVMAqHslSfj';

//Slidere
var dimmer, temper;

//Den pære du vil kontrollere
var lightNumber = 10;

//Den osc besked du vil modtage fra Wekinator
var osc_address = "/wek/outputs";
//p5 speech instans & timer
var myRec
//SpeechDiv er den variabel som viser hvad der bliver sagt
var speechDiv;

//Div til geodata
var geoDiv;

var i;

var mainTimer;

/*
Dette er vores timer variabler. Counter er den der tæller ned og timeLeft er den tid vi har tilbage.
 Timer starter intervalet og timeDiv er den der viser timeren. 
 timerSet bliver brugt til at se om der er blevet registeret en timer eller ej, hvilket er grundet til at den er sat til false

*/
var counter = 0;
var timeleft = 0;
var timer;
var timeDiv;
var timerSet = false;
//Funktionen convertSeconds ændre sekunder til minutter som indholder variablen s som er sat til 60. Var min hvor vi omregner det til minutter og i sec omregner det til sec.
function convertSeconds(s) {
    var min = floor(s / 60);
    var sec = s % 60;
    //Her for vi returnet vores minuter og sekunder med seks decimaler.
    return nf(min, 3) + ':' + nf(sec, 3);
}
/*timeIt er hvor den udregner counteren. 
Her stiger counteren med 1. Derefter laver vi et skala fra counter og timeleft som begge er 0 til current og endtemperature. 
TimeTemp er den skala mellem kelvin skalaen til current temperature og end temperatur.
changeTemperatue ændre temperaturen til vores variabler. Math.floor returnerer den største heltal eller lig med et givet nummer. 
Map funktionen vil returner en array med kvadrat rod af den alle værdier.  

//Simon: Map funktionen er smart fordi den kan omregne en variabels værdi fra én skala til en anden. 
//I dette tilfælde har vi en variabel som viser hvor mange milisekunder der er tilbage, før alarmen er sat (timeLeft - counter).
//Den variabel går altså på en skala fra antallet af millisekunder da alarmen blev sat, til 0;
//Det tal vil vi gerne omregne til vores Kelvin skala - fra 5000 til 2000; 
//I nedenstående bruges map funktionen først til at finde den aktuelle Kelvin temperatur, og derefter til at sætte slideren på sin skala. 
*/

function timeIt() {
    counter++;
    timeDiv.html(convertSeconds(timeleft - counter));
    var kelvin = map(timeleft - counter, timeleft, 0, currentTemperature, endTemperature);
    var timeTemp = Math.floor(map(kelvin, currentTemperature, endTemperature, 153, 454));
    changeTemperature(timeTemp);  
  
}
function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }

  function showPosition(position) {
    console.log("Latitude: " + position.coords.latitude + 
    "<br>Longitude: " + position.coords.longitude); 
    let apiUrl = "http://api.openweathermap.org/data/2.5/weather?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&APPID=996349f23ea1639b228c2ec07458a750";
    console.log(apiUrl);

    loadJSON(apiUrl ,function(data){
        console.log(data);
        let t = getDate();
        sunrise = data.sys.sunrise * 1000;
        sunset = data.sys.sunset * 1000;
        var sunR = new Date(sunrise);
        var sunS = new Date(sunset);
        str = "<h5>Tid: </h5>" + t.getHours() + ":" + t.getMinutes() + ":" + t.millis()/1000;
        str += "<h5>Solnedgang: </h5>" + sunS.getHours() + ":" + sunS.getMinutes()
        str += "<h5>Solnedgang: </h5>" + sunS.getHours() + ":" + sunS.getMinutes()
        geoDiv.html(str);
    });
  }

function setup() {
      
    mainTimer = setInterval(getLocation, 1000);
    timeDiv = createDiv();
    timeDiv.position(300, 140);
    timeDiv.html(convertSeconds('timeleft - counter'));
    timeDiv.hide();    

    geoDiv = createDiv();
    geoDiv.position(300, 180);

    createCanvas(500, 500);
    setupOsc(12000, 6448); //Begynd at lytte efter OSC

    oscDiv = createDiv('OSC response'); // a div for the Hue hub's responses
    oscDiv.position(10, 200); // position it

    resultDiv = createDiv('Hub response'); // a div for the Hue hub's responses
    resultDiv.position(10, 260); // position it

    speechDiv = createDiv('OSC response'); // a div for the Hue hub's responses
    speechDiv.position(10, 140); // position it

    dimmer = createSlider(1, 254, 127) // createslider(min, max, default,step)
    dimmer.position(10, 10); // position it
    dimmer.mouseReleased(changeBrightness); // mouseReleased callback function

    temper = createSlider(153, 454, 250) // a slider to dim one light
    temper.position(10, 40); // position it
    temper.mouseReleased(changeTemperature); // mouseReleased callback function

    text("Lysstyrke", dimmer.x * 2 + dimmer.width, 14);
    text("Temperatur", temper.x * 2 + temper.width, 44);
    textSize(144);
    text(lightNumber, 300, 100);
    connect(); // connect to Hue hub; it will show all light states

    //P5
    //P5 Speech objekter
    myRec = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
    myRec.continuous = true; // do continuous recognition
    myRec.interimResults = true; // allow partial recognition (faster, less accurate)
    myRec.onResult = parseResult; // now in the constructor
    myRec.onEnd = genStart;
    myRec.start(); // start engine
}


//Speech handling functions
//Funktion genStart genstarter speech recognition for at den bliver ved med at lytte
function genStart() {
    console.log("Genstarter webspeech");
    myRec.start();
}
//bedTime er false fordi så ved den hvornår bliver den kaldt
let bedTime = false;
//timeCommands er elementer af arrays der beskriver kommandoerne og deres forskellige måder de kan blive sagt
let timeCommands = [{
        "1": ["one", "1", "en"]
    },
    {
        "2": ["two", "2", "to"]
    },
    {
        "3": ["three", "free", "3"]
    },
];


function parseResult() {
    // recognition system will often append words into phrases.
    // so hack here is to only use the last word:
    //Laver mostrecentword til en string
    var mostrecentword = myRec.resultString.split(' ').pop();
    speechDiv.html(mostrecentword);
    if (bedTime) {
        console.log("Bedtime set, waiting for hours...");
        //Hvis du siger 1 får du tallet '0' og ta bliver tilagt så vi får den korrekte placering.
        //ta lægger plus 1 til din array så den får den korrekte rækkefølge. Indx er det sammen som ta
        let ta = 1;
        let indx = 1;
        //Her begynder vores timer
        /*For hver begivenhed(e) af timeCommands vil den returnere  værdiene af arrayet af k som er lige med e. 
        Hvis mostrecent indkludrer k vil det gedanne timeren og logge til konsolen at den fandt timeren + vil den 
        printe navnerne for arrayet og printe indexet ud. Så vil timeren sætte den lig med indekset gange det med en time
        til at få den nye tid. Det vil den vise i browseren ved at vise en countdown.    
        Object.keys metoden returner navnene  for elementerne af arrayet og Object.values vil give værdierne af arrayet*/ 
        for (e of timeCommands) {
            for (k of Object.values(e)[0]) {
                if (mostrecentword.includes(k)) {
                    clearInterval(timer);
                    console.log("Fandt timer: " + Object.keys(e) + "Med index: " + ta);
                    indx = ta;
                    timerSet = true;
                    currentTemperature = 5000;
                    endTemperature = 2000;
                    timeleft = indx * 60; //indx værdien bliver ganget med 3600 til at give det i timere
                    timer = setInterval(timeIt, 1000);
                    timeDiv.show();    



                }
            }
            ta++;
        }
    }
    //Hvis der bliver sagt bedtime er funktioen sat til true;

    if (mostrecentword.indexOf("bedtime") !== -1) {
        bedTime = true;
     
    }

}


/*
this function makes the HTTP GET call to get the light data:
HTTP GET http://your.hue.hub.address/api/username/lights/
*/
function connect() {
    url = "http://" + url + '/api/' + username + '/lights/';
    httpDo(url, 'GET', getLights);
}

/*
this function uses the response from the hub
to create a new div for the UI elements
*/
function getLights(result) {
    resultDiv.html("<hr/>" + result);
}

function changeBrightness() {
    var brightness = this.value(); // get the value of this slider
    var lightState = { // make a JSON object with it
        bri: brightness,
        on: true
    }
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);
}
//Det her vi ændre temperaturen 
function changeTemperature(t) {
    var temperature;
    console.log("Sætter temp: " + t);
    if (t > 0) {
        temperature = t;
        temper.value(t);
    } else {
        temperature = this.value(); // get the value of this slider
    }

    var lightState = { // make a JSON object with it
        ct: temperature,
        on: true
    }
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);
}

function oscChangeBrightness(lys) {
    var lightState = { // make a JSON object with it
        bri: lys,
        on: true
    }
    dimmer.value(lys);
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);
}

function oscChangeTemperature(varme) {
    var lightState = { // make a JSON object with it
        ct: varme,
        on: true
    }
    temper.value(varme);
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);
}

/*
this function makes an HTTP PUT call to change the properties of the lights:
HTTP PUT http://your.hue.hub.address/api/username/lights/lightNumber/state/
and the body has the light state:
{
  on: true/false,
  bri: brightness
}
*/
function setLight(whichLight, data) {
    var path = url + whichLight + '/state/';

    var content = JSON.stringify(data); // convert JSON obj to string
    httpDo(path, 'PUT', content, 'text', getLights); //HTTP PUT the change
}



/*
Nedenstående er OSC funktioner. 
*/


function receiveOsc(address, value) {
    if (address == osc_address) {
        lys = value[0];
        varme = value[1];
    }
    lys = parseInt(map(lys, 0, 1, 1, 254));
    varme = parseInt(map(varme, 0, 1, 153, 500));
    oscDiv.html("OSC Lys: " + lys + " Varme: " + varme + "<hr/>");

    if (frameCount % 5 == 0) {
        oscChangeBrightness(lys);
        oscChangeTemperature(varme);
    }
    //console.log("Received osc : " + address + " " + value);
}

function sendOsc(address, value) {
    socket.emit('message', [address].concat(value));
}

function setupOsc(oscPortIn, oscPortOut) {
    var socket = io.connect('http://127.0.0.1:8081', {
        port: 8081,
        rememberTransport: false
    });
    socket.on('connect', function () {
        socket.emit('config', {
            server: {
                port: oscPortIn,
                host: '127.0.0.1'
            },
            client: {
                port: oscPortOut,
                host: '127.0.0.1'
            }
        });
    });
    socket.on('message', function (msg) {
        if (msg[0] == '#bundle') {
            for (var i = 2; i < msg.length; i++) {
                receiveOsc(msg[i][0], msg[i].splice(1));
            }
        } else {
            receiveOsc(msg[0], msg.splice(1));
        }

    });
}
