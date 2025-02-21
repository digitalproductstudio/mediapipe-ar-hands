export const hasGetUserMedia = () =>
  !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
