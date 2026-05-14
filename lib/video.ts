import * as Linking from 'expo-linking';

import { Exercise } from '@/lib/types';

export const DEFAULT_EXERCISE_VIDEO_URL = 'https://www.youtube.com/shorts/bNmvKpJSWKM';

export function getExerciseVideoUrl(exercise: Exercise) {
  return exercise.videoUrl ?? DEFAULT_EXERCISE_VIDEO_URL;
}

export async function openExerciseVideo(exercise: Exercise) {
  const url = getExerciseVideoUrl(exercise);

  await Linking.openURL(url);
}
