'use strict';

class Workouts {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  Clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // latitude //longitude
    this.distance = distance; //in km
    this.duration = duration; //in min
    this.serialNumber = getSerialNumber();
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.Clicks++;
  }

  serialNumberIncrease() {
    this.serialNumber++;
  }
}

const getSerialNumber = function () {
  const sr = +localStorage.getItem('serialNumber');
  return sr;
};

class Running extends Workouts {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workouts {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);

// console.log(run1, cycling1);

// ///////////////////////////////////////////////////////////////
// Application Archigtecture

const mainForm = document.querySelector('.main-form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputTypeEdit = document.querySelector('.form__input--type-edit');
const inputDistance = document.querySelector('.form__input--distance');
const inputDistanceEdit = document.querySelector('.form__input--distance-edit');
const inputDuration = document.querySelector('.form__input--duration');
const inputDurationEdit = document.querySelector('.form__input--duration-edit');
const inputCadence = document.querySelector('.form__input--cadence');
const inputCadenceEdit = document.querySelector('.form__input--cadence-edit');
const inputElevation = document.querySelector('.form__input--elevation');
const inputElevationEdit = document.querySelector(
  '.form__input--elevation-edit'
);
const footer = document.querySelector('.copyright');
const edit = document.querySelector('.edit');
const formEdit = document.querySelector('.form-edit');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;

  constructor() {
    // Get users position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Get event handlers
    mainForm.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    // footer.addEventListener('click', this._sequentialInsertion.bind(this));

    // edit.addEventListener('click', this._editList.bind(this), true);
  }

  _getPosition() {
    navigator.geolocation?.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your position');
      }
    );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    mainForm.classList.remove('hidden');
    inputDistance.focus();
  }

  _showFormEdit() {
    formEdit.classList.remove('hidden');
    inputDistanceEdit.focus();
  }

  _hideMainForm() {
    //Empty the inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    mainForm.style.display = 'none';
    mainForm.classList.add('hidden');
    setTimeout(() => (mainForm.style.display = 'grid'), 1);
  }
  _hideEditForm() {
    //Empty the inputs
    inputDistanceEdit.value =
      inputDurationEdit.value =
      inputCadenceEdit.value =
      inputElevationEdit.value =
        '';

    formEdit.style.display = 'none';
    formEdit.classList.add('hidden');
    setTimeout(() => (formEdit.style.display = 'grid'), 1);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _editWorkout(_, workout, e) {
    e.preventDefault();

    console.log(e.target);
    console.log(workout);

    const w = this.#workouts.findIndex(
      y => y.serialNumber === workout.serialNumber
    );
    console.log(w);
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // Get data from form

    this.#workouts[w].type = inputTypeEdit.value;
    this.#workouts[w].distance = +inputDistanceEdit.value;
    this.#workouts[w].duration = +inputDurationEdit.value;

    if (this.#workouts[w].type === 'running') {
      this.#workouts[w].cadence = +inputCadenceEdit.value;
      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(
          this.#workouts[w].distance,
          this.#workouts[w].duration,
          this.#workouts[w].cadence
        ) ||
        !allPositive(
          this.#workouts[w].distance,
          this.#workouts[w].duration,
          this.#workouts[w].cadence
        )
      )
        return alert('Inputs have to be positive number');
    }
    // If workout cycling , create cycling object

    if (workout.type === 'cycling') {
      this.#workouts[w].elevation = +inputElevationEdit.value;

      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(
          this.#workouts[w].distance,
          this.#workouts[w].duration,
          this.#workouts[w].elevation
        ) ||
        !allPositive(this.#workouts[w].distance, this.#workouts[w].duration)
      )
        return alert('Inputs have to be positive number');
    }

    console.log(this.#workouts);

    // Inserting back to its positon
    this._sequentialInsertion();

    // hide edit form
    this._hideEditForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running , create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive number');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling , create cycling object

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive number');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Increase serial number
    workout.serialNumberIncrease();

    // Add new object to workout Array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hideform+ clear input fields

    this._hideMainForm();

    // Set local storage to all workouts

    this._setLocalStorage();
  }

  //   Display marker

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _createHTML(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <div class="additional-functionality edit">
    <div>Edit</div>
    <div class="additional-icons edit-icon">
      <ion-icon name="pencil-sharp"></ion-icon>
    </div>
  </div>
  <div class="additional-functionality remove">
    <div>Remove</div>
    <div class="additional-icons remove-icon">
      <ion-icon name="remove-circle"></ion-icon>
    </div>
  </div>
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      `;

    if (workout.type === 'running')
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
     <span class="workout__icon">⚡️</span>
     <span class="workout__value">${workout.speed.toFixed(1)}</span>
     <span class="workout__unit">km/h</span>
   </div>
   <div class="workout__details">
     <span class="workout__icon">⛰</span>
     <span class="workout__value">${workout.elevationGain}</span>
     <span class="workout__unit">m</span>
   </div>
  </li>`;
    return html;
  }

  _renderWorkout(workout) {
    const html = this._createHTML(workout);
    formEdit.insertAdjacentHTML('afterend', html);
  }

  _sequentialInsertion() {
    const workoutAll = document.querySelectorAll('.workout');
    console.log(this.#workouts);
    workoutAll.forEach(function (x) {
      x.style.display = 'none';
    });

    this.#workouts.sort(function (a, b) {
      const keyA = a.serialNumber;
      const keyB = b.serialNumber;
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });
    console.log(this.#workouts);

    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }

  _edit(workout) {
    formEdit.addEventListener(
      'submit',
      this._editWorkout.bind(this, formEdit, workout)
    );
  }

  _reoveSubmitListener(workout) {
    formEdit.removeEventListener(
      'submit',
      this._editWorkout.bind(this, formEdit, workout)
    );
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    if (e.target.closest('.edit')) {
      console.log(e.target.closest('.edit'));
      this._showFormEdit();
      this._edit(workout);
      this._reoveSubmitListener(workout);
    }

    if (e.target.closest('.remove')) {
      this._removeWorkout(workout);
    }

    // // using public interface
    workout.click();
  }

  _removeWorkout(workout) {
    this.#workouts = this.#workouts.filter(
      work => work.serialNumber !== workout.serialNumber
    );
    this._sequentialInsertion();

    // Set local storage to all workouts

    this._setLocalStorage();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    localStorage.setItem(
      'serialNumber',
      this.#workouts.slice(-1)[0].serialNumber
    );
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    // this.#workouts = data;

    this.#workouts = data.map(work => {
      let obj;
      if (work.type === 'running') obj = new Running();
      if (work.type === 'cycling') obj = new Cycling();

      Object.assign(obj, work);
      return obj;
    });
    console.log(this.#workouts);

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
    localStorage.setItem('serialNumber', 0);
  }
}

const app = new App();

// let arr = [4, 5, 8, 6, 3];

// arr.sort((a, b) => a - b);
// console.log(arr);

// console.log(Date.now());
