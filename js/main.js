// View Swap
var $mainBody = document.querySelector('main');
var $viewNodes = $mainBody.querySelectorAll('[data-view]:not(button)');
var $homeNav = document.querySelector('#home-Nav');
var $calNav = document.querySelector('#cal-Nav');
var $calButton = document.querySelector('#calculate-butt');
var $calMenu = document.querySelector('#cal-menu');

$homeNav.addEventListener('click', viewSwap);
$calNav.addEventListener('click', viewSwap);
$calButton.addEventListener('click', viewSwap);
$calMenu.addEventListener('click', viewSwap);

function viewSwap(event) {
  if (typeof event === 'object') {
    for (var i = 0; i < $viewNodes.length; i++) {
      if (event.target.getAttribute('data-view') === $viewNodes[i].getAttribute('data-view')) {
        $viewNodes[i].setAttribute('class', '');
      } else {
        $viewNodes[i].setAttribute('class', 'dis-none');
      }
    }
  } else {
    for (var j = 0; j < $viewNodes.length; j++) {
      if (event === $viewNodes[j].getAttribute('data-view')) {
        $viewNodes[j].setAttribute('class', '');
      } else {
        $viewNodes[j].setAttribute('class', 'dis-none');
      }
    }
  }
  $menuWindow.setAttribute('class', 'dis-none');
}

// form control
var $formElements = document.querySelector('form');
$formElements.addEventListener('submit', formHandle);
var defaultRangeValue = ['50', '50', '6', '150'];

function formHandle(event) {
  event.preventDefault();
  var formAnswers = {};
  formAnswers.vehicle = $formElements.elements.vehicleType.value;
  formAnswers.distance = Number($formElements.elements.drive.value);
  formAnswers.food = Number($formElements.elements.food.value);
  formAnswers.entertain = Number($formElements.elements.entertain.value);
  formAnswers.shopping = Number($formElements.elements.shopping.value);
  $formElements.reset();
  for (var i = 0; i < defaultRangeValue.length; i++) {
    $rangeTextNodes[i].textContent = defaultRangeValue[i];
  }
  var parsedAnswers = parseAnswer(formAnswers);
  getResult(parsedAnswers);
}

// Nav bar window interactive
var $menuIcon = document.querySelector('#menu-icon');
var $menuWindow = document.querySelector('#menu-window');
$menuIcon.addEventListener('mouseenter', menuHandle);

function menuHandle() {
  $menuWindow.setAttribute('class', '');
  setTimeout(() => {
    $menuWindow.setAttribute('class', 'dis-none');
  }, 3000);
}

// Form range interactive
var $rangeTextNodes = document.querySelectorAll('[data-range]:not(input)');
var $rangeNodes = document.querySelector('#calculatePage');
$rangeNodes.addEventListener('change', rangeHandle);

function rangeHandle(event) {
  if (!event.target.hasAttribute('data-range')) {
    return;
  }
  for (var i = 0; i < $rangeTextNodes.length; i++) {
    if (event.target.getAttribute('data-range') === $rangeTextNodes[i].getAttribute('data-range')) {
      $rangeTextNodes[i].textContent = event.target.value;
      return;
    }
  }
}

// Http Request

function getResult(answers) {
  var xhr = new XMLHttpRequest();
  var url = 'https://beta3.api.climatiq.io/batch';
  var bearer = 'Bearer 9ZK7P5YBPVMBJ1HVF3K6G99FHDH4';
  var formData = answers;
  xhr.open('POST', url);
  xhr.setRequestHeader('Authorization', bearer);
  xhr.responseType = 'json';
  xhr.addEventListener('load', function () {
    var newFootprint = xhr.response;
    var parsedFootprint = parseAPIData(newFootprint);
    data.footprints.push(parsedFootprint);
    updateResultPage(parsedFootprint);
    viewSwap('result');
  });
  xhr.send(formData);
}

function parseAnswer(answers) {
  var vehicles = {
    sedan: 'passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
    truck: 'commercial_vehicle-vehicle_type_truck_medium_or_heavy-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
    suv: 'commercial_vehicle-vehicle_type_truck_light-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
    none: 'passenger_vehicle-vehicle_type_bus-fuel_source_na-distance_na-engine_size_na',
    motorcycle: 'passenger_vehicle-vehicle_type_motorcycle-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na'
  };
  var climatiqObj = [
    {
      emission_factor: {
        activity_id: vehicles[answers.vehicle]
      },
      parameters: {
        distance: answers.distance,
        distance_unit: 'mi'
      }
    },
    {
      emission_factor: {
        activity_id: 'consumer_goods-type_snack_foods'
      },
      parameters: {
        money: answers.food,
        money_unit: 'usd'
      }
    },
    {
      emission_factor: {
        activity_id: 'electricity-energy_source_grid_mix'
      },
      parameters: {
        energy: answers.entertain * 0.5,
        energy_unit: 'kWh'
      }
    },
    {
      emission_factor: {
        activity_id: 'consumer_goods-type_clothing_clothing_accessories_stores'
      },
      parameters: {
        money: answers.shopping,
        money_unit: 'usd'
      }
    }
  ];
  return JSON.stringify(climatiqObj);
}

// Parsing data
// Access CO2e -> Object[index].constituent_gases.co2e_total
// Access CO2  -> Object[index].constituent_gases.co2
// Access CH4  -> Object[index].constituent_gases.ch4
// Access N2O  -> Object[index].constituent_gases.n2o

function parseAPIData(dataAPI) {
  var newFootprintObject = {
    date: null,
    entryId: null,
    data: null,
    total: {
      co2e: 0,
      co2: 0,
      ch4: 0,
      n2o: 0
    }
  };
  newFootprintObject.entryId = data.entryId;
  data.entryId++;
  var date = new Date();
  newFootprintObject.date = String(date.getMonth()) + '/' + String(date.getDate()) + '/' + String(date.getFullYear());
  newFootprintObject.data = dataAPI;
  for (var i = 0; i < dataAPI.results.length; i++) {
    if (dataAPI.results[i].constituent_gases.co2e_total) {
      newFootprintObject.total.co2e += dataAPI.results[i].constituent_gases.co2e_total;
    }
    if (dataAPI.results[i].constituent_gases.co2) {
      newFootprintObject.total.co2 += dataAPI.results[i].constituent_gases.co2;
    }
    if (dataAPI.results[i].constituent_gases.ch4) {
      newFootprintObject.total.ch4 += dataAPI.results[i].constituent_gases.ch4;
    }
    if (dataAPI.results[i].constituent_gases.n2o) {
      newFootprintObject.total.n2o += dataAPI.results[i].constituent_gases.n2o;
    }
  }
  return newFootprintObject;
}

function updateResultPage(obj) {
  var $resultGraphCO2e = document.querySelector('#resultGraphCO2e');
  var $resultGraphCO2 = document.querySelector('#resultGraphCO2e');
  var $resultGraphCH4 = document.querySelector('#resultGraphCH4');
  var $resultGraphN2O = document.querySelector('#resultGraphN2O');
  var $resultTextCO2e = document.querySelector('#CO2eResultText');
  var $resultTextCO2 = document.querySelector('#CO2ResultText');
  var $resultTextCH4 = document.querySelector('#CH4ResultText');
  var $resultTextN2O = document.querySelector('#N2OResultText');
  var $resultDate = document.querySelector('#resultDate');

  $resultGraphCH4.textContent = Number.parseFloat(obj.total.ch4.toPrecision(3));
  $resultGraphCO2.textContent = Number.parseFloat(obj.total.co2.toPrecision(3));
  $resultGraphCO2e.textContent = Number.parseFloat(obj.total.co2e.toPrecision(3));
  $resultGraphN2O.textContent = Number.parseFloat(obj.total.n2o.toPrecision(3));
  $resultTextCH4.textContent = Number.parseFloat(obj.total.ch4.toPrecision(3));
  $resultTextCO2.textContent = Number.parseFloat(obj.total.co2.toPrecision(3));
  $resultTextCO2e.textContent = Number.parseFloat(obj.total.co2e.toPrecision(3));
  $resultTextN2O.textContent = Number.parseFloat(obj.total.n2o.toPrecision(3));
  $resultDate.textContent = obj.date;
}
