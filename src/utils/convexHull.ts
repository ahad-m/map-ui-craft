interface Point {
  lat: number;
  lng: number;
}

// دالة لحساب الحدود الخارجية (Monotone Chain Algorithm)
export function getConvexHull(points: Point[]): Point[] {
  if (points.length < 3) return points;

  const sorted = points.sort((a, b) => a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng);

  const cross = (o: Point, a: Point, b: Point) => {
    return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
  };

  const lower: Point[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: Point[] = [];
  for (const point of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

// دالة لتحديد اللون بناءً على السعر
export function getPriceColor(price: number, min: number, max: number): string {
  // تطبيع السعر بين 0 و 1
  const ratio = Math.min(Math.max((price - min) / (max - min), 0), 1);
  
  // تدرج لوني من الأخضر (رخيص) إلى الأحمر (غالي)
  // Green: hsl(120, 100%, 40%) -> Red: hsl(0, 100%, 50%)
  const hue = (1.0 - ratio) * 120;
  return `hsl(${hue}, 80%, 45%)`;
}