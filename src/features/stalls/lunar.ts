const VN_TIME_ZONE = 7;
const UNIX_EPOCH_JDN = 2440588;
const SYNODIC_MONTH = 29.530588853;
const LUNATION_BASE_JD = 2415021.076998695;
const DEG = Math.PI / 180;

const jdnOf = (year: number, month: number, date: number) => Math.round(Date.UTC(year, month, date) / 86400000) + UNIX_EPOCH_JDN;

function newMoonJdn(k: number) {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const mPrime = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
  const mean =
    2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3 + 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * DEG);
  const correction =
    (0.1734 - 0.000393 * t) * Math.sin(m * DEG) +
    0.0021 * Math.sin(2 * m * DEG) -
    0.4068 * Math.sin(mPrime * DEG) +
    0.0161 * Math.sin(2 * mPrime * DEG) -
    0.0004 * Math.sin(3 * mPrime * DEG) +
    0.0104 * Math.sin(2 * f * DEG) -
    0.0051 * Math.sin((m + mPrime) * DEG) -
    0.0074 * Math.sin((m - mPrime) * DEG) +
    0.0004 * Math.sin((2 * f + m) * DEG) -
    0.0004 * Math.sin((2 * f - m) * DEG) -
    0.0006 * Math.sin((2 * f + mPrime) * DEG) +
    0.001 * Math.sin((2 * f - mPrime) * DEG) +
    0.0005 * Math.sin((2 * mPrime + m) * DEG);
  const deltaT =
    t < -11 ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3 : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return Math.floor(mean + correction - deltaT + 0.5 + VN_TIME_ZONE / 24);
}

function sunLongitudeSector(jdn: number) {
  const t = (jdn - 2451545.5 - VN_TIME_ZONE / 24) / 36525;
  const t2 = t * t;
  const m = 357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  const dl =
    (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(m * DEG) + (0.019993 - 0.000101 * t) * Math.sin(2 * m * DEG) + 0.00029 * Math.sin(3 * m * DEG);
  const longitude = ((l0 + dl) * DEG) % (2 * Math.PI);
  return Math.floor(((longitude < 0 ? longitude + 2 * Math.PI : longitude) / Math.PI) * 6);
}

function month11Start(year: number) {
  const k = Math.floor((jdnOf(year, 11, 31) - 2415021) / SYNODIC_MONTH);
  const newMoon = newMoonJdn(k);
  return sunLongitudeSector(newMoon) >= 9 ? newMoonJdn(k - 1) : newMoon;
}

function leapMonthOffset(month11: number) {
  const k = Math.floor((month11 - LUNATION_BASE_JD) / SYNODIC_MONTH + 0.5);
  let index = 1;
  let sector = sunLongitudeSector(newMoonJdn(k + index));
  let previous: number;
  do {
    previous = sector;
    index++;
    sector = sunLongitudeSector(newMoonJdn(k + index));
  } while (sector !== previous && index < 14);
  return index - 1;
}

export function lunarToDayNum(lunarYear: number, lunarMonth: number, lunarDate: number) {
  const startYear = lunarMonth < 11 ? lunarYear - 1 : lunarYear;
  const month11 = month11Start(startYear);
  const nextMonth11 = month11Start(startYear + 1);
  const k = Math.floor(0.5 + (month11 - LUNATION_BASE_JD) / SYNODIC_MONTH);
  let offset = (lunarMonth - 11 + 12) % 12;
  if (nextMonth11 - month11 > 365 && offset >= leapMonthOffset(month11)) offset += 1;
  return newMoonJdn(k + offset) + lunarDate - 1 - UNIX_EPOCH_JDN;
}
