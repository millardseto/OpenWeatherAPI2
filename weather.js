var data;
const debug = false;
var offset = 0;

//const apiURL = "http://api.openweathermap.org/data/2.5/weather";
// To host on github, use API Proxy
const apiURL = "https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/weather";
const appID = "a90133976c46059fee7922fcf02e5dba";

// BEGIN Converstion functions --------------------------
function kelvinToFarenhheit(k){
  return (((k-273.15)*1.8)+32).toFixed(1);
}

function getTempUnit(){
    return '°F';
}

function mpsToMPH(s){
  // 1 mps = 2.23694 mph
  return (s * 2.23694).toFixed(2);
}

function convertSpeed(s){
    return mpsToMPH(s) + ' MPH';
}
// END conversion functions


// callback for api request
function reqListener () {
  //console.log(this.responseText);
  if (this.readyState == 4 && this.status == 200) {
        data = JSON.parse(this.responseText);
         showUI(data);
    }
}

// show wind direction as an arrow showing the direction (versus showing degrees)
function setDirection(){
  // set arrow
  let direction = document.getElementById('windDegrees');

  // may not have degree data, so reset every time and check for existence
  direction.innerText = "";

  if (data.wind.deg) {
    direction.innerText = "↑";

    // rotate
    let degreeContainer = document.getElementById("degreeContainer");
    degreeContainer.style.transform=`rotate(${data.wind.deg}deg)`;
    degreeContainer.style.transition="1s ease-in-out";
  }
}

function setIcon(){
  // Set the weather image
  let icon2 = document.createElement('img');
  let iconSource = `./icons/${data.weather[0].icon}.png`;
  icon2.setAttribute("src", iconSource);
  icon2.setAttribute("alt", data.weather[0].description);
  icon2.setAttribute("class", "icon");

  let iconDiv = document.getElementById('iconDiv');
  iconDiv.innerHTML = "";
  iconDiv.appendChild(icon2);
}

function getTimeFromUTC(utc){
  var d = new Date(1000*utc);
  return d.toTimeString();
}

// function to calculate local time
// in a different city
// given the city's UTC offset
function calcTime(utc, offset) {

    // create Date object for current location
    d = new Date(1000*utc);

    // convert to msec
    // add local time zone offset
    // get UTC time in msec
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);

    // create new Date object for different city
    // using supplied offset
    nd = new Date(utc + (3600000*offset));

    // return time as a string
    return nd.toLocaleTimeString();

}

function setSunRiseIcon(){
  let sunrise = document.createElement("img");
  sunrise.setAttribute("src", "./icons/sunrise.png");
  sunrise.setAttribute("class", "sun");
  sunrise.setAttribute("alt", "sunrise image");
  let container = document.getElementById("sunriseContainer");
  container.innerHTML=null;
  container.appendChild(sunrise);

  let riseTime = document.createElement("span");
  riseTime.setAttribute("class", "sunriseTime");
  riseTime.innerText = calcTime(data.sys.sunrise, offset);
  container.appendChild(riseTime);
}

function setSunSetIcon(){
  let sunset = document.createElement("img");

  sunset.setAttribute("src", "./icons/sunset.png");
  sunset.setAttribute("class", "sun");
  sunset.setAttribute("alt", "sunset image");
  let container = document.getElementById("sunsetContainer");
  container.innerHTML=null;
  container.appendChild(sunset);

  let setTime = document.createElement("span");
  setTime.setAttribute("class", "sunsetTime");
  setTime.innerText = calcTime(data.sys.sunset, offset);
  container.appendChild(setTime);
}


// show response data in the UI
function showUI(data){
  document.getElementById('city').innerText=data.name;
  document.getElementById('weatherMain').innerText=data.weather[0].main;
  document.getElementById('tempNow').innerText=kelvinToFarenhheit(data.main.temp);
  document.getElementById('tempUnit').innerText=getTempUnit();
  document.getElementById('windSpeed').innerText=convertSpeed(data.wind.speed);
  document.getElementById('humidity').innerHTML=`Humidity ${data.main.humidity}<sup>%</sup>`;
  //document.getElementById('sunrise').innerText=calcTime(data.sys.sunrise, offset);
  //document.getElementById('sunset').innerText=calcTime(data.sys.sunset, offset);

  setDirection();
  setIcon();
  setSunRiseIcon();
  setSunSetIcon();

}


function getWeatherFromAPI(){
  // debug - use hardcoded data to avoid overusing api and getting blocked.
  /*
  data = JSON.parse('{"coord":{"lon":-122.32,"lat":47.68},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04d"}],"base":"stations","main":{"temp":289.27,"pressure":1015,"humidity":87,"temp_min":288.15,"temp_max":290.15},"visibility":16093,"wind":{"speed":2.6,"deg":180},"clouds":{"all":90},"dt":1498490280,"sys":{"type":1,"id":2949,"message":0.0043,"country":"US","sunrise":1498479191,"sunset":1498536685},"id":7261476,"name":"Inglewood-Finn Hill","cod":200}');
  showUI(data);
  return;
  */

  // get custom attributes from control
  let lat = this.getAttribute("data-lat");
  let lon = this.getAttribute("data-lon");
  offset = this.getAttribute("data-timeOffset");

  params = {"lat":lat, "lon":lon, "APPID": appID};
  let query = queryBuilder(params);

  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);
  let apiCall = apiURL + query;
  oReq.open("GET", apiCall);
  oReq.send();

}

// lookup user location and save it as custom attributes on the button.
function positionSuccess(position){
  let lat = position.coords.latitude;
  let lon = position.coords.longitude;

  const myLocation = document.querySelector('button.myLocation');
  myLocation.setAttribute("data-lat", lat);
  myLocation.setAttribute("data-lon", lon);
  myLocation.disabled = false;
  myLocation.classList.remove("wait");

  // determine offset hours by doing a lookup.
  let myOffset = new Date().getTimezoneOffset();// Seattle = -7 depending on DST
  myOffset = -myOffset/60; // convert to hours
  myLocation.setAttribute("data-timeOffset", myOffset);
}

function positionError(failure){
  console.log("code: " + failure.code);
  console.log("message: " + failure.message);
}

// When the dom is ready, wire up event handlers
document.addEventListener("DOMContentLoaded", function () {
  // button controls
  const london = document.querySelector('button.london');
  const seattle = document.querySelector('button.seattle');
  const myLocation = document.querySelector('button.myLocation');
  myLocation.disabled = true;
  myLocation.classList.add("wait");

  // getCurrentPosition doesnt always work on local machine, hardcode test values
  if (debug){
    // 47.5721227,-121.9972376
    myLocation.setAttribute("data-lat", 47.5721227);
    myLocation.setAttribute("data-lon", -121.9972376);
  } else {
    // get user lat/lon now and set custom attributes on the myLocation button.
    navigator.geolocation.getCurrentPosition(positionSuccess, positionError);
  }

  // event handlers
  london.addEventListener('click', getWeatherFromAPI);
  seattle.addEventListener('click', getWeatherFromAPI);
  myLocation.addEventListener('click', getWeatherFromAPI);
})

// Builds query parameters
// input {name: "elvis", location: "seattle"}
// output: ?name=elvis&location=seattle
function queryBuilder(queryObj){
  let holder = [];

  // loop through key values
  for (let key in queryObj) {

    // make each one into "key=value", encode to handle special characters like &
    let convert = `${encodeURIComponent(key)}=${queryObj[encodeURIComponent(key)]}`

    //console.log(convert);
    holder.push(convert);
  }

  // return value
  return '?'+holder.join("&");
}
