/**
 * Require constants
 */
const Color = require('color');
const round10 = require('round10').round10;
const easeInSine = require('eases/sine-in');
const easeOutSine = require('eases/sine-out');
const easeInOutSine = require('eases/sine-in-out');
const easeInQuad = require('eases/quad-in');
const easeOutQuad = require('eases/quad-out');
const easeInOutQuad = require('eases/quad-in-out');

/**
 * Other constants
 */
const scrimCoordinates = {
  0.00: '0%',
  0.14: '8.52%',
  0.28: '17.53%',
  0.42: '27.19%',
  0.54: '36.28%',
  0.64: '44.56%',
  0.72: '51.97%',
  0.79: '59.18%',
  0.85: '66.33%',
  0.90: '73.39%',
  0.94: '80.36%',
  0.97: '87.18%',
  0.99: '93.73%'
};
const supportedGradients = [
  'ease-in-sine-gradient',
  'ease-out-sine-gradient',
  'ease-in-out-sine-gradient',
  'ease-in-quad-gradient',
  'ease-out-quad-gradient',
  'ease-in-out-quad-gradient',
  'scrim-gradient'
];

/**
 * If a color is transparent then convert it to a transparent of the sibling
 */
function transparentFix(colors) {
  return colors.map((color, i) => color === 'transparent'
    ? Color(colors[Math.abs(i - 1)]).alpha(0).hsl().string()
    : color
  );
}

/**
 * Test if new coordinate is far enough away from old coordinate
 */
function isFarEnough(x, y, xOld, yOld, delta) {
  return Math.sqrt(((x - xOld) ** 2) + ((y - yOld) ** 2)) > delta;
}

/**
 * Convert decimal number to percentage string
 */
function getPercentage(number) {
  return `${round10(number * 100, -1)}%`;
}

/**
 * Easing functions switcheroo
 */
function ease(x, type) {
  switch (type) {
    case 'ease-in-sine-gradient':
      return easeInSine(x);
    case 'ease-out-sine-gradient':
      return easeOutSine(x);
    case 'ease-in-out-sine-gradient':
      return easeInOutSine(x);
    case 'ease-in-quad-gradient':
      return easeInQuad(x);
    case 'ease-out-quad-gradient':
      return easeOutQuad(x);
    case 'ease-in-out-quad-gradient':
      return easeInOutQuad(x);
    default:
      console.log(`Sorry, easing gradient does not support ${type}.`);
      return null;
  }
}

/**
 * Get coordinates based on easing function.
 * Delta checks ensures there's roughly the same distance between coordinates.
 */
function getCoordinates(easingFunction, precision) {
  if (easingFunction === 'scrim-gradient') return scrimCoordinates;

  const yIncrements = 0.001;
  const deltaTolerance = 0.01;
  const deltaAdjust = 0.001;

  let coordinates = {};
  let x = 0;
  let y = 0;
  let xOld = 0;
  let yOld = 0;
  let firstTime = true;
  let delta = precision;

  while (firstTime || !isFarEnough(1, 1, xOld, yOld, delta - deltaTolerance)) {
    if (firstTime) {
      firstTime = false;
    } else {
      x = 0;
      y = 0;
      xOld = 0;
      yOld = 0;
      delta -= deltaAdjust;
      coordinates = {};
    }
    while (y <= 1) {
      coordinates[0] = 0;
      x = ease(y, easingFunction);
      if (isFarEnough(x, y, xOld, yOld, delta)) {
        coordinates[x] = getPercentage(y);
        xOld = x;
        yOld = y;
      }
      y += yIncrements;
    }
  }
  return coordinates;
}

/**
 * Round alpha in hsl colors to alphaDecimals
 */
function roundHslAlpha(color, alphaDecimals) {
  const prefix = color.substring(0, color.indexOf('('));
  const values = color
    .substring(color.indexOf('(') + 1, color.indexOf(')'))
    .split(',')
    .map(string => string.indexOf('%') === -1
      ? round10(Number(string), -alphaDecimals)
      : string.trim()
    );
  return `${prefix}(${values.join(', ')})`;
}

/**
 * Calculate the color stops based on start+stopColor in an array and easingType
 */
exports.getColorStops = function getColorStops(
  colors,
  easingType,
  delta,
  alphaDecimals
) {
  const fixedColors = transparentFix(colors);
  const gradientCoordinates = getCoordinates(easingType, delta);
  let colorStops = '';
  Object.keys(gradientCoordinates).forEach((ammount) => {
    // https://github.com/Qix-/color
    let color = Color(fixedColors[1]).mix(Color(fixedColors[0]), ammount);
    color = color.hsl().string();
    color = roundHslAlpha(color, alphaDecimals);
    colorStops += `${color} ${gradientCoordinates[ammount]}, `;
  });
  colorStops += `${colors[1]} 100%`;
  return colorStops;
};


/**
 * Check if a string matches one of the supported gradients
 */
exports.isEasingGradient = function isEasingGradient(str) {
  return new RegExp(supportedGradients.join('|')).test(str);
};

/**
 * Convert a function object to a word object
 */
exports.functionToWord = function functionToWord(obj) {
  const object = obj;
  const array = [];
  // TODO: Make eslint happy
  /* eslint-disable no-restricted-syntax */
  for (const objNode of object.nodes) {
    if (objNode.type === 'word') {
      array.push(objNode.value);
    }
  }
  /* eslint-enable no-restricted-syntax */
  object.value = `${obj.value}(${array.join()})`;
  object.type = 'word';
  return object;
};

/**
 * Test if two colors are identical
 */
exports.isSameColor = function isSameColor(colorA, colorB) {
  return Color(colorA).hsl().string() === Color(colorB).hsl().string();
};
