/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Represents an audio file that can be transcribed.
 */
export type Echo = {
  id: string;
  displayName?: string;
  sourceFilePath: string;
  mediaType: string;
  text?: string;
  createdAt?: string;
  completedTranscriptionAt?: string;
};
