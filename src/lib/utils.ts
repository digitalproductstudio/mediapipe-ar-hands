export const hasGetUserMedia = async () =>
  !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
