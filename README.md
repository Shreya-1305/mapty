Link For Demo -https://mapty-modiefied.netlify.app/

## Introduction

This application renders workouts based on the user's location.

A workout that could be chosen:

- Running
- Cycling

The app gets the current location from the browser and passes those cords into a library which renders a map on the position where the user can then initialize workouts by simple click events.

As soon as a workout gets submitted mapty will process the user data makes several ajax calls in the background and show the user the corresponding information for

- the location
- calculations (pace, speed)



This was a learning project for a portfolio project! 
@copyright @jonasschmedtmann

# My Contribution

I have added following feature to make it more advanced. 

The UI can be manipulated from the user by:
- Editing workouts
- Deleting workouts
- Deleting all workouts
- Sorting workouts
- Navigating the map on the corresponding workouts on the map
- Set map in such a way that all the markers are visible 

### OOP

- Workout class parent
- - Running Workout class child
- - Cycling Workout class child

- APP class
  Creating instances from running, cycling workouts.
  Holding all the underlying data of the application, which deals with the User Interface.


#### Libraries

- Leaftlet

### Apis

- https://geocode.xyz/
- https://openweathermap.org/api

The project does not include the whole data flow. It shows the main flow and function calls between each class.

- Data is stored in local storage

## INSTALLATION

Install npm and run npm init.

## Motivation

I really felt engaged in developing the project. I learned a lot by coding on it and building and refactoring all the new features, which I mentioned in the introduction.






