/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Represents an audio file that can be transcribed.
 */
export type Echo = {
  id: string;
  userId?: string;
  displayName?: string;
  sourceFilePath: string;
  sourceYoutubeUrl?: string;
  mediaType: string;
  text?: string;
  createdAt?: string;
  completedTranscriptionAt?: string;
};
