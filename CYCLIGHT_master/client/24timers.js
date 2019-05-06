var lys = 0;
var varme = 0;
/*Vi deklare CurrentTemperature og endTemperature. Det er den kelvin skala som går fra 
5000 kelvin til 2000 kelvin. changeTemperatureDuration er det tidsrum det skal tage i millisekunder, for pæren at skifte temperatur
*/
const endTemperature = 2000;
const maxTemperature = 6000;
const changeTemperatureDuration = 60 * 1000 * 30;
let CurrentTemperature;

//Variable til solopgang og solnedgang klokkeslet
let sunR, sunS;

var locationName, locationLon, locationLat, sunrise, sunset;
// Bridge ip-adresse. Find den fx i hue app'en
var url = '192.168.0.100';
// Hent dit brugernavn - find det ved at følge installationsguiden her: 
// https://developers.meethue.com/develop/get-started-2/#

var username = 'i5HJnW3IiamT4InBYK-7TlwuMA1MFeVMAqHslSfj';

//Slidere
var dimmer, temper;

//Den pære du vil kontrollere
var lightNumber = 10;

//Div til geodata
var clockDiv, geoDiv;

var timerSet = false;
var timeNow;
const kelvinMax = 6000;
const kelvinMin = 2000;
const kelvinSliderMax = 454;
const kelvinSliderMin = 153;

//Denne metode sætter pærens temperatur og henter appens position
function getLocation() {
  timeNow = new Date();
  timeNow.setTime(timeNow.getTime() + (60 * 60 * 1000));
  if (!timerSet) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }
}

function setTemperature(){
  //Sætter pærens temperatur afhængig af timeNow, sunset, sunrise
  console.log("Time Now: ", timeNow.getTime());
  console.log("Sunrise: ", sunR.getTime());
  console.log("Sunset: ", sunS.getTime());
  sunRMillis = sunR.getTime();
  sunSMillis = sunS.getTime();
  timeNowMillis = timeNow.getTime();
  //Er vi i gang med en solopgang?
  if(sunRMillis + changeTemperatureDuration > timeNowMillis && timeNowMillis > sunRMillis){
    var millisSinceSunrise = timeNowMillis - sunRMillis;
    var kelvin = map(millisSinceSunrise, changeTemperatureDuration, 0, kelvinMin, kelvinMax);
    var sliderValue = map(millisSinceSunrise, changeTemperatureDuration, 0, kelvinSliderMin, kelvinSliderMax);
    temper.value(sliderValue);
    oscChangeTemperature(kelvi);
    console.log("Temeratur sat til: " + kelvin);
  }else if(sunSMillis - changeTemperatureDuration < timeNowMillis && timeNowMillis < sunSMillis){
    var millisSinceSunrise = timeNowMillis - sunRMillis;
    var kelvin = map(millisSinceSunrise, changeTemperatureDuration, 0, kelvinMin, kelvinMax);
    var sliderValue = map(millisSinceSunrise, changeTemperatureDuration, 0, kelvinSliderMin, kelvinSliderMax);
    temper.value(sliderValue);
    oscChangeTemperature(kelvin);
    console.log("Temeratur sat til: " + kelvin);
  }else{
    var sliderValue = map(kelvinMax, changeTemperatureDuration, 0, kelvinSliderMin, kelvinSliderMax);
    oscChangeTemperature(kelvinMax);
    console.log("Temeratur sat til: " + kelvinMax);
  }



}

function showPosition(position) {
  console.log("Henter geodata");
  console.log("Latitude: " + position.coords.latitude +
    "<br>Longitude: " + position.coords.longitude);
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
    setTemperature();
  });
}

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


  clockDiv = createDiv("");
  clockDiv.position(300, 180);

  geoDiv = createDiv("Hejsa");
  geoDiv.position(300, 220);

  createCanvas(500, 500);

  oscDiv = createDiv('OSC response'); // a div for the Hue hub's responses
  oscDiv.position(10, 200); // position it
  setupOsc(12000, 6448); //Begynd at lytte efter OSC

  resultDiv = createDiv('Hub response'); // a div for the Hue hub's responses
  resultDiv.position(10, 260); // position it

  speechDiv = createDiv('OSC response'); // a div for the Hue hub's responses
  speechDiv.position(10, 140); // position it

  dimmer = createSlider(1, 254, 127) // createslider(min, max, default,step)
  dimmer.position(10, 10); // position it

  temper = createSlider(153, 454, 250) // a slider to dim one light
  temper.position(10, 40); // position it

  text("Lysstyrke", dimmer.x * 2 + dimmer.width, 14);
  text("Temperatur", temper.x * 2 + temper.width, 44);
  textSize(144);
  text(lightNumber, 300, 100);

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
              receiveOsc(msg[0], msg.splice(1));
          }
      } else {
          receiveOsc(msg[0], msg.splice(1));
      }

  });
}