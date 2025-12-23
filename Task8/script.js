// Lab 8 - JavaScript Basics
// Enhanced Simple Calculator using onclick Events

// Step 1: Select DOM elements
const num1 = document.getElementById('num1');
const num2 = document.getElementById('num2');
const result = document.querySelector('#result span');
const history = document.querySelector('#history');

let lastOperation = 'None';

// Step 2: Define calculator functions
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    alert('Cannot divide by zero!');
    console.error('Attempted to divide by zero.');
    return 'Error';
  }
  return a / b;
}

// Step 3: Main onclick handler
function handleCalculate(operation) {
  const a = parseFloat(num1.value);
  const b = parseFloat(num2.value);

  // Input validation
  if (isNaN(a) || isNaN(b)) {
    alert('Please enter valid numbers!');
    console.warn('Invalid input detected.');
    return;
  }

  let output;

  switch (operation) {
    case 'add':
      output = add(a, b);
      break;
    case 'subtract':
      output = subtract(a, b);
      break;
    case 'multiply':
      output = multiply(a, b);
      break;
    case 'divide':
      output = divide(a, b);
      break;
    default:
      console.error('Unknown operation');
      return;
  }

  // Update UI dynamically
  result.textContent = output;
  lastOperation = `${a} ${getOperatorSymbol(operation)} ${b} = ${output}`;
  history.textContent = `Last: ${lastOperation}`;
  console.log(`Operation: ${operation}, Result: ${output}`);
}

// Step 4: Clear calculator
function clearCalculator() {
  num1.value = '';
  num2.value = '';
  result.textContent = '0';
  history.textContent = 'Last: None';
  lastOperation = 'None';
  num1.focus();
}

// Step 5: Helper function for operator symbols
function getOperatorSymbol(operation) {
  const symbols = {
    'add': '+',
    'subtract': '−',
    'multiply': '×',
    'divide': '÷'
  };
  return symbols[operation] || operation;
}
