var data;
var forcastData;

var offset = 0;

//const apiURL = "http://api.openweathermap.org/data/2.5/weather";
// To host on github, use API Proxy
//const apiURL = "https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/weather";
const apiURL = "https://uwpce-weather-proxy.herokuapp.com/data/2.5/weather";
const appID = "a90133976c46059fee7922fcf02e5dba";

//const apiForcastURL = "http://api.openweathermap.org/data/2.5/forecast";
const apiForcastURL = "https://uwpce-weather-proxy.herokuapp.com/data/2.5/forecast";

// BEGIN Converstion functions -------------------------------------------------
function kelvinToFarenhheit(k) {
  return (((k - 273.15) * 1.8) + 32).toFixed(1);
}

function getTempUnit() {
  return '°F';
}

function mpsToMPH(s) {
  // 1 mps = 2.23694 mph
  return (s * 2.23694).toFixed(2);
}

function convertSpeed(s) {
  return mpsToMPH(s) + ' MPH';
}
// END conversion functions ----------------------------------------------------


// WEATHER API -----------------------------------------------------------------
function getWeatherFromAPI(lat, lon) {
  params = {
    "lat": lat,
    "lon": lon,
    "APPID": appID
  };
  let query = queryBuilder(params);

  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", weatherAPILoad);
  oReq.addEventListener("error", weatherAPIError);
  let apiCall = apiURL + query;
  oReq.open("GET", apiCall, true);
  oReq.send();

  document.body.classList.add("wait");
}

// callback for api request
function weatherAPILoad() {
  //console.log(this.responseText);
  if (this.readyState == 4 && this.status == 200) {
    //data = JSON.parse(this.responseText); // old response
    data = JSON.parse(this.responseText).body; // new response
    document.body.classList.remove("wait");
    showUI(data);
  }
}

function weatherAPIError() {
  console.log("OpenWeatherMap API Failed");
}
// END WEATHER API -------------------------------------------------------------

// show wind direction as an arrow showing the direction (versus showing degrees)
function setDirection() {
  // set arrow
  let direction = document.getElementById('windDegrees');

  // may not have degree data, so reset every time and check for existence
  direction.innerText = "";

  if (data.wind.deg) {
    direction.innerText = "↑";

    // rotate
    let degreeContainer = document.getElementById("degreeContainer");
    degreeContainer.style.transform = `rotate(${data.wind.deg}deg)`;
    degreeContainer.style.transition = "1s ease-in-out";
  }
}

function setIcon() {
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


// function to calculate local time
// in a different city
// given the city's UTC offset
function calcTime(utc, offset) {

  // create Date object for current location
  d = new Date(1000 * utc);

  // convert to msec
  // add local time zone offset
  // get UTC time in msec
  utc = d.getTime() + (d.getTimezoneOffset() * 60000);

  // create new Date object for different city
  // using supplied offset
  nd = new Date(utc + (3600000 * offset));

  // return time as a string
  return nd.toLocaleTimeString(navigator.language, {
    hour: '2-digit',
    minute: '2-digit'
  });

}

function setSunRiseIcon() {
  let sunrise = document.createElement("img");
  sunrise.setAttribute("src", "./icons/sunrise.png");
  sunrise.setAttribute("class", "sun");
  sunrise.setAttribute("alt", "sunrise image");
  let container = document.getElementById("sunriseContainer");
  container.innerHTML = null;
  container.appendChild(sunrise);

  let riseTime = document.createElement("span");
  riseTime.setAttribute("class", "sunriseTime");
  riseTime.innerText = calcTime(data.sys.sunrise, offset);
  container.appendChild(riseTime);
}

function setSunSetIcon() {
  let sunset = document.createElement("img");

  sunset.setAttribute("src", "./icons/sunset.png");
  sunset.setAttribute("class", "sun");
  sunset.setAttribute("alt", "sunset image");
  let container = document.getElementById("sunsetContainer");
  container.innerHTML = null;
  container.appendChild(sunset);

  let setTime = document.createElement("span");
  setTime.setAttribute("class", "sunsetTime");
  setTime.innerText = calcTime(data.sys.sunset, offset);
  container.appendChild(setTime);
}


// show response data in the UI
function showUI(data) {
  document.getElementById('city').innerText = data.name;
  document.getElementById('weatherMain').innerText = data.weather[0].main;
  document.getElementById('tempNow').innerText = kelvinToFarenhheit(data.main.temp);
  document.getElementById('tempUnit').innerText = getTempUnit();
  document.getElementById('windSpeed').innerText = convertSpeed(data.wind.speed);
  document.getElementById('humidity').innerHTML = `Humidity ${data.main.humidity}<sup>%</sup>`;
  document.body.setAttribute("class", data.name);

  setDirection();
  setIcon();
  setSunRiseIcon();
  setSunSetIcon();

}

function cityClicked() {
  // get custom attributes from control
  let lat = this.getAttribute("data-lat");
  let lon = this.getAttribute("data-lon");
  offset = this.getAttribute("data-timeOffset");

  getWeatherFromAPI(lat, lon);

  showHideForcast(lat, lon);
}


function setTheme() {
  let outerContainer = document.getElementById("outerContainer");
  outerContainer.setAttribute("class", this.value);

  // reset text color, then set again if necessary
  let colorClass = this.getAttribute("data-textColor");

  let innerContainer = document.getElementById("container");
  innerContainer.classList.remove("lightText");

  let innerContainer2 = document.getElementById("container2");
  innerContainer2.classList.remove("lightText");

  if (colorClass) {
    innerContainer.classList.add(colorClass);
    innerContainer2.classList.add(colorClass);
  }
}



// When the dom is ready, wire up event handlers
document.addEventListener("DOMContentLoaded", function() {
      google.charts.load('current', {
        packages: ['corechart', 'line']
      });

      // button controls
      const london = document.querySelector('button.london');
      const seattle = document.querySelector('button.seattle');
      const myLocation = document.querySelector('button.myLocation');
      const updateMyLocation = document.querySelector('button.updateMyLocation');
      const resetMyLocation = document.querySelector('button.resetMyLocation');
      const forcast = document.querySelector('input.forcast');
      const lblForcast = document.getElementById("lblForecast");

      /*
        forcast.disabled = true;
        forcast.style.display = "none";
        lblForcast.style.display = "none";
      */


      const cool = document.querySelector('#cool');
      const warm = document.querySelector('#warm');
      const dark = document.querySelector('#dark');


      // event handlers
      london.addEventListener('click', cityClicked);
      seattle.addEventListener('click', cityClicked);
      myLocation.addEventListener('click', myLocationClicked);
      updateMyLocation.addEventListener('click', updateMyLocationClicked);
      resetMyLocation.addEventListener('click', resetMyLocationClicked);
      forcast.addEventListener('click', getForcastClicked);

      cool.addEventListener('click', setTheme);
      warm.addEventListener('click', setTheme);
      dark.addEventListener('click', setTheme);

      var lat = localStorage.getItem('lat');
      var lon = localStorage.getItem('lon');
      offset = localStorage.getItem('offset');

      if (lat) {
        showUserLatLon(lat, lon);
      }

      // default a city so it looks better.
      seattle.click();
    }); // end add event listener




// MY LOCATION WEATHER ---------------------------------------------------------
function myLocationClicked() {
  // check if we already have user location
  var lat = localStorage.getItem('lat');
  var lon = localStorage.getItem('lon');
  offset = localStorage.getItem('offset');

  if (lat) {
    //bypass get current position (because it is slow and we already have location)
    getWeatherFromAPI(lat, lon);

    showHideForcast(lat, lon);
    return;
  }

  const myLocation = document.querySelector('button.myLocation');
  myLocation.disabled = true;
  myLocation.classList.add("wait");
  navigator.geolocation.getCurrentPosition(positionSuccess, positionError);
}

// lookup user location and save it as custom attributes on the button.
function positionSuccess(position) {
  let lat = position.coords.latitude;
  let lon = position.coords.longitude;

  const myLocation = document.querySelector('button.myLocation');

  myLocation.disabled = false;
  myLocation.classList.remove("wait");

  // determine offset hours by doing a lookup.
  let myOffset = new Date().getTimezoneOffset(); // Seattle = -7 depending on DST
  offset = -myOffset / 60; // convert to hours

  // save to session storage for performance
  localStorage.setItem('lat', lat);
  localStorage.setItem('lon', lon);
  localStorage.setItem('offset', offset);

  showUserLatLon(lat, lon);

  getWeatherFromAPI(lat, lon);

  showHideForcast(lat, lon);
}

function positionError(failure) {
  console.log("code: " + failure.code);
  console.log("message: " + failure.message);
}

// USER LOCATION LAT/LON -------------------------------------------------------
function updateMyLocationClicked() {
  this.classList.add("wait");
  this.disabled = true;
  navigator.geolocation.getCurrentPosition(updatePositionSuccess, positionError);
}

function updatePositionSuccess(position) {
  let lat = position.coords.latitude;
  let lon = position.coords.longitude;
  const updateMyLocation = document.querySelector('button.updateMyLocation');
  updateMyLocation.disabled = false;
  updateMyLocation.classList.remove("wait");

  // determine offset hours by doing a lookup.
  let myOffset = new Date().getTimezoneOffset(); // Seattle = -7 depending on DST
  offset = -myOffset / 60; // convert to hours

  // save to session storage for performance
  localStorage.setItem('lat', lat);
  localStorage.setItem('lon', lon);
  localStorage.setItem('offset', offset);

  showUserLatLon(lat, lon);
}



function showUserLatLon(lat, lon) {
  let lblLat = document.getElementById('myLat');
  lblLat.innerText = `Lat: ${lat}`;

  let lblLon = document.getElementById('myLon');
  lblLon.innerText = `Lon: ${lon}`;
}



function resetMyLocationClicked() {
  localStorage.clear();

  showUserLatLon("", "");
}

// FORCAST -----------------------------------------------------------------

// Call weather API
function getWeatherForcast(lat, lon) {

  params = {
    "lat": lat,
    "lon": lon,
    "APPID": appID,
    "units": "imperial"
  };
  let query = queryBuilder(params);

  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", forecastLoad);
  oReq.addEventListener("error", forecastError);
  let apiCall = apiForcastURL + query;
  oReq.open("GET", apiCall, true);
  oReq.send();

  document.body.classList.add("wait");
}

// Forecast Load event handler
function forecastLoad() {
  if (this.readyState == 4 && this.status == 200) {
    forcastData = JSON.parse(this.responseText).body;
    document.body.classList.remove("wait");
    showForcastUI(forcastData);
  }
}

// Forecast Error event handler
function forecastError() {
  console.log("OpenWeatherMap API Failed calling forcast");
}

// Show forecast in UI
function showForcastUI(forcastData) {
  drawChart(forcastData);

  // for(let i=0; i<forcastData.cnt; i++) {
  //   //console.log(w.weather[0].main);
  //   let div = document.createElement("div");
  //   // xxx
  //   let w = forcastData.list[i];
  //
  //   // Set the weather image
  //
  //   let icon = document.createElement('img');
  //   let iconSource = `./icons/${w.weather[0].icon}.png`;
  //   icon.setAttribute("src", iconSource);
  //   icon.setAttribute("alt", w.weather[0].description);
  //   icon.setAttribute("class", "icon");
  //
  //
  //   let temp = document.createTextNode(w.main.temp);
  //   let date = document.createTextNode(w.dt_txt);
  //
  //   //div.appendChild(icon);
  //   div.appendChild(temp);
  //   div.appendChild(date);
  //
  //   document.body.appendChild(div);
  // }
}

// check if forcast requested and get it if necessary.
function showHideForcast(lat, lon) {
  let includeForcast = document.getElementById('forcast');
  if (includeForcast.checked) {
    getWeatherForcast(lat, lon);
  } else {
    document.getElementById("chart_div").innerHTML = null;
  }
}

// show forcast for current city
function getForcastClicked() {
    // to do
}

// show forcast temperature data as a chart
function drawChart(forcastData) {
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'X');
  data.addColumn('number', 'Temp');

  // build an array of arrays
  var rows = new Array();
  for (var j = 0; j < 7 /*forcastData.cnt*/ ; j++) {
    let w = forcastData.list[j];
    // push an array containing [level description, total count of level]
    rows.push([calcTime(w.dt, offset), w.main.temp]);
  }


  data.addRows(rows);

  var options = {
    hAxis: {
      title: 'Time'
    },
    vAxis: {
      title: 'Temperature'
    },
    colors: ['#a52714', '#097138']
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
  chart.draw(data, options);
  }


  // UTILITY FUNCTIONS -----------------------------------------------------------


  // Builds query parameters
  // input {name: "elvis", location: "seattle"}
  // output: ?name=elvis&location=seattle
  function queryBuilder(queryObj) {
    let holder = [];

    // loop through key values
    for (let key in queryObj) {

      // make each one into "key=value", encode to handle special characters like &
      let convert = `${encodeURIComponent(key)}=${queryObj[encodeURIComponent(key)]}`

      //console.log(convert);
      holder.push(convert);
    }

    // return value
    return '?' + holder.join("&");
  }
