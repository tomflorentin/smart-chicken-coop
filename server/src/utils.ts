export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
