'use strict';

class Workouts {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  Clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // latitude //longitude
    this.distance = distance; //in km
    this.duration = duration; //in min
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
}

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
const formEdit = document.querySelector('.form-edit');
const deleteAll = document.querySelector('.delete-all');
const Container = document.querySelector('.container');
const sortType = document.querySelector('.form-input--sortType');
const displayAllMarkers = document.querySelector('.display-all-markers');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #markers = [];
  #mapZoomLevel = 13;
  #currentWorkoutEL = 12;

  constructor() {
    // Get users position
    this._getPosition();
    // Get data from local storage
    this._getLocalStorage();
    // Get event handlers
    mainForm.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener(
      'click',
      this.containerEvents.bind(this)
    );
    sortType.addEventListener('change', this._sort.bind(this));
    formEdit.addEventListener('submit', this._editWorkout.bind(this));
    deleteAll.addEventListener('click', this._deleteAllWorkouts.bind(this));
    displayAllMarkers.addEventListener('click', this._allMarkers.bind(this));
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
    if (!formEdit.classList.contains('hidden')) return;
    this.#mapEvent = mapE;
    mainForm.classList.remove('hidden');
    inputDistance.focus();
  }

  _showFormEdit() {
    if (!mainForm.classList.contains('hidden')) return;
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

  _editWorkout(e) {
    e.preventDefault();
    const workout = this.#workouts.find(
      work => work.id === this.#currentWorkoutEL.dataset.id
    );
    const w = this.#workouts.findIndex(y => y.id === workout.id);
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
      this.#workouts[w].pace =
        this.#workouts[w].duration / this.#workouts[w].distance;
    }
    // If workout cycling , create cycling object

    if (workout.type === 'cycling') {
      this.#workouts[w].elevation = +inputElevationEdit.value;

      if (
        !validInputs(
          this.#workouts[w].distance,
          this.#workouts[w].duration,
          this.#workouts[w].elevation
        ) ||
        !allPositive(this.#workouts[w].distance, this.#workouts[w].duration)
      )
        return alert('Inputs have to be positive number');

      this.#workouts[w].speed =
        this.#workouts[w].distance / this.#workouts[w].duration;
    }
    // Inserting back to its positon
    this.sortFunction('date');
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

    // Add new object to workout Array
    this.#workouts.push(workout);
    if (this.#workouts.length > 0) Container.style.display = 'flex';
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
    const marker = L.marker(workout.coords)
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
    marker._id = workout.id;
    this.#markers.push(marker);
  }

  _createHTML(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    
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
    <div class="additional-functionalities">
    <div class="additional-functionality edit" style="border-bottom: 1.5px solid #00c46a;">
  <div style="align-self: center">Edit</div>
  <div class="additional-icons edit-icon">
    <ion-icon name="pencil-sharp"></ion-icon>
  </div>
</div>
<div class="additional-functionality remove" style="border-bottom: 1.5px solid #00c46a;">
  <div style="align-self: center">Remove</div>
  <div class="additional-icons remove-icon">
    <ion-icon name="remove-circle"></ion-icon>
  </div>
</div>
</div>
</li>
  `;

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
   <div class="additional-functionalities">
    <div class="additional-functionality edit" style="border-bottom: 1.5px solid #ffb545;">
  <div style="align-self: center">Edit</div>
  <div class="additional-icons edit-icon">
    <ion-icon name="pencil-sharp"></ion-icon>
  </div>
</div>
<div class="additional-functionality remove" style="border-bottom: 1.5px solid #ffb545;">
  <div style="align-self: center">Remove</div>
  <div class="additional-icons remove-icon">
    <ion-icon name="remove-circle"></ion-icon>
  </div>
</div>
</div>
</li>
  `;

    return html;
  }

  _renderWorkout(workout) {
    const html = this._createHTML(workout);
    formEdit.insertAdjacentHTML('afterend', html);
  }

  sortFunction(x) {
    const workoutAll = document.querySelectorAll('.workout');
    workoutAll.forEach(function (x) {
      x.style.display = 'none';
    });

    if (x === 'date') this.#workouts.sort((a, b) => a.id - b.id);
    else if (x === 'distance')
      this.#workouts.sort((a, b) => a.distance - b.distance);
    else if (x === 'duration')
      this.#workouts.sort((a, b) => a.duration - b.duration);

    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }
  _sort() {
    if (!sortType.value) return;
    this.sortFunction(sortType.value);
  }

  containerEvents(e) {
    if (e.target.closest('form')) return;
    if (!e.target.closest('.workout')) return;
    // debugger;
    this.#currentWorkoutEL = e.target.closest('.workout');
    const workout = this.#workouts.find(
      work => work.id === this.#currentWorkoutEL.dataset.id
    );
    this._moveToPopup(workout);

    if (e.target.closest('.edit')) {
      this.#currentWorkoutEL = e.target.closest('.workout');
      this._showFormEdit();
    }

    if (e.target.closest('.remove')) {
      this.#currentWorkoutEL = e.target.closest('.workout');
      this._removeWorkout(workout);
    }

    // // using public interface
    workout.click();
    // this.#currentWorkoutEL = null;
  }

  _moveToPopup(workout) {
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _removeWorkout(workout) {
    this.#workouts = this.#workouts.filter(work => work.id !== workout.id);
    this.sortFunction('date');
    if (this.#workouts.length == 0) Container.style.display = 'none';
    let newMarkers = [];
    this.#markers.forEach(marker => {
      if (marker._id === workout.id) this.#map.removeLayer(marker);
      else {
        newMarkers.push(marker);
      }
    });
    this.#markers = newMarkers;
    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _allMarkers() {
    // var bounds = L.latLngBounds(this.#markers);
    let latlngs = this.#markers.map(marker => marker.getLatLng());
    let latlngBounds = L.latLngBounds(latlngs);
    this.#map.fitBounds(latlngBounds); //works!
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
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

    if (this.#workouts.length > 0) Container.style.display = 'flex';
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  _deleteAllWorkouts() {
    if (window.confirm(`Want to delete all Workouts`)) {
      this.reset();
    } else {
      return;
    }
  }
}

const app = new App();
