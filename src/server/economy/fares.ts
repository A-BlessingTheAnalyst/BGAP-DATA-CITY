// Arcade fare pricing for a hailed danfo/taxi ride, by road distance.
const BASE_FARE = 300;
const PER_100M = 60;

export function fareFor(metres: number) {
  return Math.round((BASE_FARE + (metres / 100) * PER_100M) / 50) * 50;
}
