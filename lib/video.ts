import { Exercise } from '@/lib/types';

export const DEFAULT_EXERCISE_VIDEO_URL = 'https://www.youtube.com/shorts/bNmvKpJSWKM';

export function getExerciseVideoUrl(exercise: Exercise) {
  return exercise.videoUrl ?? DEFAULT_EXERCISE_VIDEO_URL;
}

function normalizeYouTubeId(url: string) {
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&#/]+)/i);
  if (shortsMatch) {
    return shortsMatch[1];
  }

  const watchMatch = url.match(/[?&]v=([^?&#/]+)/i);
  if (watchMatch) {
    return watchMatch[1];
  }

  const embedMatch = url.match(/youtube\.com\/embed\/([^?&#/]+)/i);
  if (embedMatch) {
    return embedMatch[1];
  }

  const shortHostMatch = url.match(/youtu\.be\/([^?&#/]+)/i);
  if (shortHostMatch) {
    return shortHostMatch[1];
  }

  return null;
}

export function getExerciseEmbedUrl(exercise: Exercise) {
  const url = getExerciseVideoUrl(exercise);
  const youtubeId = normalizeYouTubeId(url);

  if (!youtubeId) {
    return url;
  }

  return `https://www.youtube.com/embed/${youtubeId}?playsinline=1&rel=0&modestbranding=1`;
}
