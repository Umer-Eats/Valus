export const ATTENDANCE_RADIUS_METERS = 804.672;

export function eventStatus(w, now = Date.now()) {
  return w.cancelled
    ? 'Cancelled'
    : now < Date.parse(w.opensAt)
      ? 'Upcoming'
      : now >= Date.parse(w.closesAt)
        ? 'Closed'
        : 'Open';
}
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const rad = (n) => (n * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371008.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
