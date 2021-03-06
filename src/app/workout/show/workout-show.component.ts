import { ItemSelectorComponent } from './../../components/item-selector/item-selector.component';
import { InputDialogComponent } from './../../components/input-dialog/input-dialog.component';
import { MatDialog, MatListOption } from '@angular/material';
import { Category } from './../../shared/category.model';
import { WorkoutExercise, WorkoutPlanCategory } from './../../shared/workout.model';
import { CategoryService } from './../../shared/category.service';
import { WorkoutService } from './../../shared/workout.service';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Workout } from 'src/app/shared/workout.model';
import { ExerciseService } from 'src/app/shared/exercise.service';
import { Exercise } from 'src/app/shared/exercise.model';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from 'src/app/shared/notification.service';

@Component({
  selector: 'app-workout-show',
  templateUrl: './workout-show.component.html',
  styleUrls: ['./workout-show.component.scss']
})
export class WorkoutShowComponent implements OnDestroy {

  id: string;
  workout: Workout;
  time = null;
  modelSub: Subscription = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService,
    private categoryService: CategoryService,
    private exerciseService: ExerciseService,
    public dialog: MatDialog,
    public notificationService: NotificationService
    ) {

    this.modelSub = this.route.params.subscribe(params => {
      this.model(params);
    });

   }

   model(params: Params) {
    this.id = params.id;

    this.workoutService.fetchById(this.id).subscribe(workout => {
      console.log(workout);
      if (workout) {
        this.workout = workout;
      }
    });

  }

  getCategoryNameById(categoryId: string): string {
    return this.categoryService.getCategoryNameById(categoryId);
  }

  // getExerciseNameById(exerciseId: string): string {
  //   return this.exerciseService.getExerciseNameById(exerciseId);
  // }

  onShowExercisePicker(category: WorkoutPlanCategory) {

    const model = this.exerciseService.getExercisesForCategory(category.category);
    const dialogRef = this.dialog.open(ItemSelectorComponent, {
      data: {
        title: 'Select an exercise',
        model: model
      },
      minWidth: 400
    });

    dialogRef.afterClosed().subscribe((items: MatListOption[]) => {
      if (items) {
        const exercises = items.map(item => item.value);
        this.addExercisesToCategory(category, exercises);
      }
    });
  }

  onShowCategoryPicker() {
    const dialogRef = this.dialog.open(ItemSelectorComponent, {
      data: {
        title: 'Select a category',
        model: this.categoryService.categories
      },
      minWidth: 400
    });

    dialogRef.afterClosed().subscribe((items: MatListOption[]) => {
      if (items) {
        const categories = items.map(item => item.value);
        this.addCategoriesToPlan(categories);
      }
    });
  }

  addCategoriesToPlan(categories: Category[]) {
    categories.forEach(category => {
      const workoutCategory: WorkoutPlanCategory = {
        category: category.ref.id,
        exercises: []};

      this.workout.plan.push(workoutCategory);
      });

  }

  addExercisesToCategory(category: WorkoutPlanCategory, items: Exercise[]) {

    items.forEach(item => {

      const exercise: WorkoutExercise = {
        exercise: item.ref.id,
        values: []
      };
      category.exercises.push(exercise);
    });

    // this.saveWorkout();
  }

  onEndWorkout() {
    this.workout.finish = moment().startOf('m');
    // this.saveWorkout();
  }

  deleteExercise(categoryIndex: number, exerciseIndex: number) {
    this.workout.plan[categoryIndex].exercises.splice(exerciseIndex, 1);
    // this.saveWorkout();
  }

  deleteCategory(categoryIndex: number) {
    this.workout.plan.splice(categoryIndex, 1);
    // this.saveWorkout();
  }

  addExerciseValue(exercise: WorkoutExercise, value: string = '10x10') {
    exercise.values.push(value);
    // this.saveWorkout();
  }

  deleteExerciseValue(exercise: WorkoutExercise, valueIndex: number) {
    exercise.values.splice(valueIndex, 1);
  }

  updateExerciseValue(categoryIndex, exerciseIndex, {valueIndex, value}) {
    this.workout.plan[categoryIndex].exercises[exerciseIndex].values[valueIndex] = value;
    // this.saveWorkout();
  }

  updateWorkoutDate(datePropertyName: string, event: Event) {
    const date = this.workout[datePropertyName] || moment();
    const model = moment(date).format('HH:mm');
    const dialogRef = this.dialog.open(InputDialogComponent, {
      data: {
        title: 'Input new time',
        model: model,
      }
    });

    return dialogRef.afterClosed();
  }

  updateWorkoutStartDate(event: Event) {
    const date = this.workout['start'] || moment();
    this.updateWorkoutDate('start', event).subscribe(value => {

      if (value) {
        const [hours, minutes] = value.split(':');
        const dateValue = date.clone().hour(hours).minute(minutes);
        this.workout['start'] = dateValue;
      }
    });
  }

  updateWorkoutEndDate(event: Event) {
    const date = this.workout['finish'] || moment();
    this.updateWorkoutDate('finish', event).subscribe(value => {

      if (value) {
        const [hours, minutes] = value.split(':');
        const dateValue = date.clone().hour(hours).minute(minutes);
        this.workout['finish'] = dateValue;
      }
    });
  }

  finishWorkout(event: Event) {
    this.updateWorkoutEndDate(event);
  }

  saveWorkout() {
    this.workoutService.save(this.workout).then(() => {
      this.notificationService.show('Workout saved!', ':)');
    });
  }

  deleteWorkout() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `Are you sure you want to delete this workout?`,
      }
    });
    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.workoutService.delete(this.workout);
        this.router.navigate(['/workouts']);
      }
    });
  }

  indexTracker(index: number, value: any) {
    return index;
  }

  // exerciseTracker(index: number, value: any) {
  //   return `${value.exercise}-${index}`;
  // }

  ngOnDestroy() {
    console.log('Unsubscribe');
    this.modelSub.unsubscribe();
  }

}
