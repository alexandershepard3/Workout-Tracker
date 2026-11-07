import { useEffect, useMemo, useState } from 'react';

type SetEntry = {
  id: string;
  reps: number;
  weight: number;
};

type ExerciseEntry = {
  id: string;
  name: string;
  sets: SetEntry[];
};

type Workout = {
  id: string;
  title: string;
  date: string;
  notes: string;
  exercises: ExerciseEntry[];
};

type SetDraft = {
  id: string;
  reps: string;
  weight: string;
};

type ExerciseDraft = {
  id: string;
  name: string;
  sets: SetDraft[];
};

type WorkoutDraft = {
  title: string;
  date: string;
  notes: string;
  exercises: ExerciseDraft[];
};

const STORAGE_KEY = 'personal-workout-tracker-v1';

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createDefaultWorkout = (): WorkoutDraft => ({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
  exercises: [
    {
      id: createId(),
      name: '',
      sets: [{ id: createId(), reps: '', weight: '' }],
    },
  ],
});

const sampleWorkouts: Workout[] = [
  {
    id: 'sample-1',
    title: 'Upper Body Strength',
    date: '2026-11-06',
    notes: 'Focused on pressing and pulling with solid tempo.',
    exercises: [
      {
        id: 'ex-1',
        name: 'Bench Press',
        sets: [
          { id: 'set-1', reps: 5, weight: 135 },
          { id: 'set-2', reps: 5, weight: 135 },
          { id: 'set-3', reps: 4, weight: 145 },
        ],
      },
      {
        id: 'ex-2',
        name: 'Pull Ups',
        sets: [
          { id: 'set-3', reps: 8, weight: 0 },
          { id: 'set-4', reps: 8, weight: 0 },
          { id: 'set-5', reps: 6, weight: 0 },
        ],
      },
    ],
  },
  {
    id: 'sample-2',
    title: 'Leg Day',
    date: '2026-11-04',
    notes: 'Heavy squats and controlled finishers.',
    exercises: [
      {
        id: 'ex-3',
        name: 'Back Squat',
        sets: [
          { id: 'set-6', reps: 5, weight: 185 },
          { id: 'set-7', reps: 5, weight: 185 },
          { id: 'set-8', reps: 5, weight: 195 },
        ],
      },
      {
        id: 'ex-4',
        name: 'Walking Lunge',
        sets: [
          { id: 'set-9', reps: 12, weight: 45 },
          { id: 'set-10', reps: 12, weight: 45 },
        ],
      },
    ],
  },
];

const getInitialWorkouts = (): Workout[] => {
  if (typeof window === 'undefined') return sampleWorkouts;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return sampleWorkouts;

  try {
    const parsed = JSON.parse(saved) as Workout[];
    return Array.isArray(parsed) && parsed.length ? parsed : sampleWorkouts;
  } catch {
    return sampleWorkouts;
  }
};

const calculateVolume = (exercise: ExerciseEntry) =>
  exercise.sets.reduce((sum, set) => sum + set.reps * set.weight, 0);

const calculateWorkoutVolume = (workout: Workout) =>
  workout.exercises.reduce((sum, exercise) => sum + calculateVolume(exercise), 0);

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function App() {
  const [workouts, setWorkouts] = useState<Workout[]>(() => getInitialWorkouts());
  const [draft, setDraft] = useState<WorkoutDraft>(() => createDefaultWorkout());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  }, [workouts]);

  const totalWorkouts = workouts.length;
  const totalVolume = useMemo(
    () => workouts.reduce((sum, workout) => sum + calculateWorkoutVolume(workout), 0),
    [workouts],
  );
  const lastWorkout = workouts[0];

  const addExercise = () => {
    setDraft((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          id: createId(),
          name: '',
          sets: [{ id: createId(), reps: '', weight: '' }],
        },
      ],
    }));
  };

  const updateExerciseName = (exerciseId: string, value: string) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, name: value } : exercise,
      ),
    }));
  };

  const addSet = (exerciseId: string) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, sets: [...exercise.sets, { id: createId(), reps: '', weight: '' }] }
          : exercise,
      ),
    }));
  };

  const updateSetValue = (
    exerciseId: string,
    setId: string,
    field: keyof SetDraft,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const nextSets = exercise.sets.filter((set) => set.id !== setId);
        return { ...exercise, sets: nextSets.length ? nextSets : [{ id: createId(), reps: '', weight: '' }] };
      }),
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId),
    }));
  };

  const handleSaveWorkout = () => {
    const title = draft.title.trim() || 'Untitled Workout';
    const exercises = draft.exercises
      .map((exercise) => {
        const validSets = exercise.sets.filter(
          (set) => set.reps.trim() !== '' || set.weight.trim() !== '',
        );

        if (!exercise.name.trim() && validSets.length === 0) {
          return null;
        }

        return {
          id: createId(),
          name: exercise.name.trim() || 'Exercise',
          sets: validSets
            .filter((set) => set.reps.trim() !== '' || set.weight.trim() !== '')
            .map((set) => ({
              id: createId(),
              reps: parseNumber(set.reps),
              weight: parseNumber(set.weight),
            })),
        };
      })
      .filter(Boolean) as ExerciseEntry[];

    if (exercises.length === 0) return;

    const newWorkout: Workout = {
      id: createId(),
      title,
      date: draft.date,
      notes: draft.notes.trim(),
      exercises,
    };

    setWorkouts((current) => [newWorkout, ...current]);
    setDraft(createDefaultWorkout());
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts((current) => current.filter((workout) => workout.id !== id));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personal dashboard</p>
          <h1>Workout Tracker</h1>
        </div>
      </header>

      <main className="dashboard">
        <section className="summary-grid">
          <article className="summary-card accent">
            <span>Total workouts</span>
            <strong>{totalWorkouts}</strong>
          </article>
          <article className="summary-card">
            <span>Total volume</span>
            <strong>{totalVolume.toLocaleString()}</strong>
          </article>
          <article className="summary-card">
            <span>Last workout</span>
            <strong>{lastWorkout ? lastWorkout.title : 'None yet'}</strong>
          </article>
        </section>

        <section className="content-grid">
          <div className="panel form-panel">
            <div className="panel-header">
              <h2>New workout</h2>
              <button className="secondary-button" type="button" onClick={() => setDraft(createDefaultWorkout())}>
                Reset
              </button>
            </div>

            <div className="field-row">
              <label>
                Workout title
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Push day, legs, etc."
                />
              </label>
            </div>

            <div className="field-row equal-columns">
              <label>
                Date
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                />
              </label>
            </div>

            <div className="field-row">
              <label>
                Notes
                <textarea
                  rows={3}
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="How did it feel? Any goals or comments?"
                />
              </label>
            </div>

            <div className="exercise-stack">
              {draft.exercises.map((exercise) => (
                <div key={exercise.id} className="exercise-card">
                  <div className="exercise-header">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(event) => updateExerciseName(exercise.id, event.target.value)}
                      placeholder="Exercise name"
                    />
                    <button type="button" className="ghost-button" onClick={() => removeExercise(exercise.id)}>
                      Remove
                    </button>
                  </div>

                  <div className="set-list">
                    {exercise.sets.map((set) => (
                      <div key={set.id} className="set-row">
                        <input
                          type="number"
                          min="0"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(event) => updateSetValue(exercise.id, set.id, 'reps', event.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="Weight"
                          value={set.weight}
                          onChange={(event) => updateSetValue(exercise.id, set.id, 'weight', event.target.value)}
                        />
                        <button type="button" className="ghost-button" onClick={() => removeSet(exercise.id, set.id)}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="secondary-button" onClick={() => addSet(exercise.id)}>
                    + Add set
                  </button>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={addExercise}>
                + Add exercise
              </button>
              <button type="button" className="primary-button" onClick={handleSaveWorkout}>
                Save workout
              </button>
            </div>
          </div>

          <div className="panel history-panel">
            <div className="panel-header">
              <h2>History</h2>
            </div>

            {workouts.length === 0 ? (
              <p className="empty-state">No workouts logged yet.</p>
            ) : (
              <div className="history-list">
                {workouts.map((workout) => (
                  <article key={workout.id} className="history-card">
                    <div className="history-topline">
                      <div>
                        <h3>{workout.title}</h3>
                        <p>{new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <button type="button" className="ghost-button" onClick={() => handleDeleteWorkout(workout.id)}>
                        Delete
                      </button>
                    </div>

                    {workout.notes && <p className="notes">{workout.notes}</p>}

                    <ul className="exercise-summary">
                      {workout.exercises.map((exercise) => (
                        <li key={exercise.id}>
                          <span>{exercise.name}</span>
                          <strong>
                            {exercise.sets.reduce((sum, set) => sum + set.reps, 0)} reps · {calculateVolume(exercise)} volume
                          </strong>
                        </li>
                      ))}
                    </ul>

                    <div className="workout-meta">
                      <span>{workout.exercises.length} exercises</span>
                      <span>{calculateWorkoutVolume(workout)} total volume</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
