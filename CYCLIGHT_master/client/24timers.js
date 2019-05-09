// ----- Globale variable ----- //
// dette er nogle variable til vores timer
var counter = 0;
var timeleft = 0;
var timer;
var timeDiv;
var timerSet = false;

//lys varme variabler
var lys = 0;
var varme = 0;

/*
changeTemperatureDuration er en konstandt. 
Konstandten er 30 * 60 * 1000, 
fordi den skal være en 30 min i millisekunder
*/
const changeTemperatureDuration = 30 * 60 * 1000;

//dette er den nuværende temperatur
let CurrentTemperature;

//Variable til solopgang og solnedgang klokkeslet
let sunR, sunS;

//dette er variabler til geolocation
var locationName, locationLon, locationLat, sunrise, sunset;

// Bridge ip-adresse. Find den fx i hue app'en
var url = '192.168.0.100';

// Hent dit brugernavn - find det ved at følge installationsguiden her: 
// https://developers.meethue.com/develop/get-started-2/#
var username = 'S8Ci9upM7Qdo4UnfC9IpjqdY4v5X20FS3UNs840r';

/*
dimmer og temper er sliderne 
som kontrollere lysets farve og styrke.
*/
var dimmer, temper;

//Den pære du vil kontrollere
var lightNumber = 10;

//Div til geodata
var clockDiv, geoDiv;

var timerSet = false;
var timeNow;
var timeDiv;

//Svarer til 1800 Kelvin
const kelvinSliderMax = 555;

//svarer til 6500 Kelvin
const kelvinSliderMin = 153;

/*
covertSeconds funktionen laver millisekunder om til sekunder 
og 60 sekunder om til 1 minut.
funktionen bruges for at gøre det nemmere for brugeren at se/aflæse tiden.
*/
function convertSeconds(s) {
  var min = floor(s / 60);
  var sec = s % 60;

  /*
  Her for vi returnet vores minuter og sekunder.
  tallet efter min og sec er antallet af decimaler
  */
  return nf(min, 2) + ':' + nf(sec, 2);
}

/*
timeBedtime er hvor den udregner counteren. 
Her stiger counteren med 1. 
Derefter laver vi et skala fra counter og timeleft som begge er 0 til current og endtemperature. 
TimeTemp er den skala mellem kelvin skalaen til current temperature og end temperatur.
changeTemperatue ændre temperaturen til vores variabler. Math.floor returnerer den største heltal eller lig med et givet nummer. 
Map funktionen vil returner en array med kvadrat rod af den alle værdier.  

Simon: Map funktionen er smart fordi den kan omregne en variabels værdi fra én skala til en anden. 
I dette tilfælde har vi en variabel som viser hvor mange milisekunder der er tilbage, før alarmen er sat (timeLeft - counter).
Den variabel går altså på en skala fra antallet af millisekunder da alarmen blev sat, til 0;
Det tal vil vi gerne omregne til vores Kelvin skala - fra 5000 til 2000; 
I nedenstående bruges map funktionen først til at finde den aktuelle Kelvin temperatur, og derefter til at sætte slideren på sin skala. 
*/
function timeBedtime() {
  counter++;
  timeDiv.html(convertSeconds(timeleft - counter));

  //sliderValue skalaen er timeleft - counter på en skala fra 0 til timeleft og en skala fra kelvinSliderMax til kelvinSliderMin
  var sliderValue = map(timeleft - counter, 0, timeleft, kelvinSliderMax, kelvinSliderMin);

  ///Så temperaturens værdi skal følge skalaen
  temper.value(sliderValue);

  //Funktionen changeTemperature skal følge skalaen 
  changeTemperature(sliderValue);

  //Når tiden slutter skal betime være false og den clear timeren. Den skal også gemme timeren
  if (counter == timeleft) {
    bedTime = false;
    clearInterval(timer);
    timeDiv.hide();
  }
}

//Denne metode sætter pærens temperatur og henter appens position
function getLocation() {
  timeNow = new Date();

  //timeNow.setTime(timeNow.getTime() + (60 * 60 * 1000));
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

//denne funktion sætter temperaturen
function setTemperature() {
  //Sætter pærens temperatur afhængig af timeNow, sunset, sunrise
  console.log("Time Now: ", timeNow.getTime());
  console.log("Sunrise: ", sunR.getTime());
  console.log("Sunset: ", sunS.getTime());

  sunRMillis = sunR.getTime();
  sunSMillis = sunS.getTime();
  timeNowMillis = timeNow.getTime();

  // ----- Er vi i gang med en solopgang? ----- //  
  /*
  let stopTid = new Date(sunRMillis);
  console.log(stopTid.getHours() + " " + stopTid.getMinutes());
  console.log(sunS.getHours() + " " + timeNow.getMinutes());
  */

  var millisSinceSunrise = timeNowMillis - sunRMillis;
  console.log("Millisekunder siden solopgang: " + millisSinceSunrise);
  console.log("Millisekunder når slut: " + changeTemperatureDuration);
  /*
  Der laves 3 if statements som indholder de tre forskellige scenariorer der kan ske.
  Princippet bag dem er den enten chekcer om der en halvtime efter sunR og der en halvtime før sunS
  */

  //HVIS det er en halv time efter solopganng skrues kelvintemperaturen langsomt op 
  if ((sunRMillis + changeTemperatureDuration > timeNowMillis) && timeNowMillis > sunRMillis) {
    var sliderValue = map(millisSinceSunrise, 0, changeTemperatureDuration, kelvinSliderMin, kelvinSliderMax);
    console.log("Slider value skal så være: " + sliderValue);
    temper.value(sliderValue);
    changeTemperature(sliderValue);
    console.log("Solopgang");

    //HVIS det er en halv time før solnedgang skrues kelvintemperaturen langsomt op 
  } else if (sunSMillis - changeTemperatureDuration < timeNowMillis && timeNowMillis < sunSMillis) {
    var sliderValue = map(millisSinceSunrise, changeTemperatureDuration, 0, kelvinSliderMax, kelvinSliderMin);
    temper.value(sliderValue);
    changeTemperature(sliderValue);
    console.log("Solnedgang");

    //ELLERS sættes kelvintemperaturen til det maksimale - dagen er i gang  
  } else {
    changeTemperature(kelvinSliderMin);
    temper.value(kelvinSliderMin);
    console.log("Dag");
  }
}

/*
I showPosition henter vi data omkring vores koordinater. Vi henter også data omkring
solopgang og solnedgang. Derefter har vi et if-statement der siger hvis der ikke sat en timer skal 
den sætte temperaturen efter solopgang - solnedgang(rutine)
*/
function showPosition(position) {
  console.log("Henter geodata");
  console.log("Latitude: " + position.coords.latitude + "<br>Longitude: " + position.coords.longitude);
  let apiUrl = "http://api.openweathermap.org/data/2.5/weather?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&APPID=996349f23ea1639b228c2ec07458a750";
  console.log(apiUrl);
  loadJSON(apiUrl, function (data) {
    console.log(data);
    sunrise = data.sys.sunrise * 1000;
    sunset = data.sys.sunset * 1000;
    locationName = data.name;
    sunR = new Date(sunrise);
    sunS = new Date(sunset);
    let str = "<h5>Sted: " + locationName + "</h5>"
    str += "<h5>Solopgang: " + sunR.getHours() + ":" + sunR.getMinutes() + "</h5>"
    str += "<h5>Solnedgang: " + sunS.getHours() + ":" + sunS.getMinutes() + "</h5>"
    geoDiv.html(str);
    if (!timerSet) {
      setTemperature();
    }
  });
}

//showTime viser den nuværende tid 
function showTime() {
  timeNow = new Date();
  timeNow.setTime(timeNow.getTime());
  str = "<h5>Klokken er nu: " + timeNow.getHours() + ":" + timeNow.getMinutes() + ":" + timeNow.getSeconds() + "</h5>";
  clockDiv.html(str);
}

function draw() {
  //Opdater klokken en gang i sekundet 
  if (frameCount % 60 == 0) {
    showTime();
  }

  //opdater position hvert tiende minut
  if (frameCount == 1 || (frameCount % (60 * 60 * 10) == 0)) {
    getLocation();
  }
}

function setup() {
  connect();

  timeDiv = createDiv("");
  timeDiv.position(300, 100);
  timeDiv.html(convertSeconds('timeleft - counter'));
  timeDiv.hide();

  clockDiv = createDiv("");
  clockDiv.position(300, 180);

  geoDiv = createDiv("Hejsa");
  geoDiv.position(300, 220);

  createCanvas(500, 500);

  oscDiv = createDiv('OSC response'); // a div for the Hue hub's responses
  oscDiv.position(10, 200); // position it
  setupOsc(12000, 6448); //Begynd at lytte efter OSC

  resultDiv = createDiv('Hub response'); // a div for the Hue hub's responses
  resultDiv.position(10, 400); // position it

  speechDiv = createDiv('OSC response'); // a div for the Hue hub's responses
  speechDiv.position(10, 140); // position it

  dimmer = createSlider(1, 254, 127) // createslider(min, max, default,step)
  dimmer.position(10, 10); // position it
  dimmer.mouseReleased(changeBrightness);

  temper = createSlider(kelvinSliderMin, kelvinSliderMax, 250) // a slider to dim one light
  temper.position(10, 40); // position it
  temper.mouseReleased(changeTemperature); // mouseReleased callback function

  text("Lysstyrke", dimmer.x * 2 + dimmer.width, 14);
  text("Temperatur", temper.x * 2 + temper.width, 44);
  textSize(144);
  text(lightNumber, 300, 100);

  //-----bedtime kommando-----//
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
  /*    
  recognition system will often append words into phrases.
  so hack here is to only use the last word:
  Laver mostrecentword til en string
  */
  var mostrecentword = myRec.resultString.split(' ').pop();
  speechDiv.html(mostrecentword);
  if (bedTime) {
    console.log("Bedtime set, waiting for hours...");

    /*
    Hvis du siger 1 får du tallet '0' og ta bliver tilagt så vi får den korrekte placering.
    ta lægger plus 1 til din array så den får den korrekte rækkefølge. Indx er det sammen som ta
    */
    let ta = 1;
    let indx = 1;

    /*
    For hver begivenhed(e) af timeCommands vil den returnere  værdiene af arrayet af k som er lige med e. 
    Hvis mostrecent indkludrer k vil det gedanne timeren og logge til konsolen at den fandt timeren + vil den 
    printe navnerne for arrayet og printe indexet ud. Så vil timeren sætte den lig med indekset gange det med en time
    til at få den nye tid. Det vil den vise i browseren ved at vise en countdown.    
    Object.keys metoden returner navnene  for elementerne af arrayet og Object.values vil give værdierne af arrayet
        
    Her begynder vores timer
    */
    for (e of timeCommands) {
      for (k of Object.values(e)[0]) {
        if (mostrecentword.includes(k)) {
          clearInterval(timer);
          console.log("Fandt timer: " + Object.keys(e) + "Med index: " + ta);
          indx = ta;
          timerSet = true;
          timeleft = indx * 3600; //indx værdien bliver ganget med 3600 til at give det i timere

          //Opdater hver sekund
          timer = setInterval(timeBedtime, 1000);
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



//_ _ _ _ _ _ OSC __ _ _ _ _ _ _ _ //

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
  if (t > 0) {
    temperature = t;
    console.log("Sætter temp: " + t);
  } else {
    temperature = this.value(); // get the value of this slider
    console.log("Sætter temp: " + this.value());
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



// ----- Nedenstående er OSC funktioner ----- // 

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
        receiveOsc(msg[0], msg.splice(1));
      }
    } else {
      receiveOsc(msg[0], msg.splice(1));
    }

  });
}