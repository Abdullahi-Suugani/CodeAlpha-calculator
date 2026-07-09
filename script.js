/* =========================================================
   CALCULATOR LOGIC
   Handles digit entry, the four arithmetic operations,
   clearing, live display updates, and keyboard support.
   ========================================================= */

(function () {
  // ---- Cache DOM elements ----
  const display = document.getElementById('display');
  const historyEl = document.getElementById('history');

  // ---- Calculator state ----
  let current = '0';        // the number currently being typed / shown
  let previous = null;      // the operand stored before an operator was pressed
  let operator = null;      // the pending operator ('+', '−', '×', '÷')
  let justEvaluated = false; // true right after "=" or an operator, meaning
                              // the next digit typed should start a fresh number
  const MAX_DIGITS = 12;    // cap on how long a number can grow on screen

  // ---- Render current state to the screen ----
  function render() {
    display.textContent = current;
    historyEl.textContent = previous !== null && operator
      ? `${trimNumber(previous)} ${operator}`
      : '\u00a0'; // non-breaking space keeps the line height stable when empty
  }

  // Shorten long decimals / large numbers so they fit on the display
  function trimNumber(numStr) {
    const num = parseFloat(numStr);
    if (Number.isNaN(num)) return '0';
    if (!isFinite(num)) return 'Error';
    let str = num.toString();
    if (str.length > MAX_DIGITS) {
      str = num.toPrecision(10);
      str = parseFloat(str).toString();
    }
    return str;
  }

  // ---- Digit button pressed (0-9) ----
  function inputDigit(d) {
    if (justEvaluated) {
      // Start typing a brand-new number, but keep any pending
      // operator/previous value so calculation chains still work.
      current = d;
      justEvaluated = false;
    } else if (current === '0') {
      current = d; // replace the leading zero
    } else if (current.replace('-', '').replace('.', '').length < MAX_DIGITS) {
      current += d;
    }
    render();
  }

  // ---- Decimal point button pressed ----
  function inputDecimal() {
    if (justEvaluated) {
      current = '0.';
      justEvaluated = false;
    } else if (!current.includes('.')) {
      current += '.';
    }
    render();
  }

  // ---- Clear (C) button: resets everything ----
  function clearAll() {
    current = '0';
    previous = null;
    operator = null;
    justEvaluated = false;
    render();
  }

  // ---- Plus/minus toggle (±) ----
  function toggleSign() {
    if (current === '0') return;
    current = current.startsWith('-') ? current.slice(1) : '-' + current;
    render();
  }

  // ---- Percent (%) ----
  function percent() {
    current = trimNumber((parseFloat(current) / 100).toString());
    render();
  }

  // ---- Core arithmetic ----
  function compute(a, b, op) {
    a = parseFloat(a);
    b = parseFloat(b);
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b; // guard against divide-by-zero
      default: return b;
    }
  }

  // ---- Operator button pressed (+ − × ÷) ----
  function chooseOperator(op) {
    // If there's already a pending operation, resolve it first
    // (supports chaining like 12 + 8 + 5).
    if (operator && !justEvaluated) {
      const result = compute(previous, current, operator);
      current = Number.isNaN(result) ? 'Error' : trimNumber(result.toString());
    }
    previous = current;
    operator = op;
    justEvaluated = true; // next digit typed should start a new number
    render();
  }

  // ---- Equals (=) button pressed ----
  function equals() {
    if (operator === null || previous === null) return;
    const result = compute(previous, current, operator);
    current = Number.isNaN(result) ? 'Error' : trimNumber(result.toString());
    previous = null;
    operator = null;
    justEvaluated = true;
    render();
  }

  // ---- Wire up all on-screen buttons ----
  document.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleAction(btn.dataset.action, btn.dataset.value);
      flash(btn);
    });
  });

  // Briefly add a "pressed" class for visual feedback
  function flash(btn) {
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 100);
  }

  // Central dispatcher: routes an action name to the right function
  function handleAction(action, value) {
    switch (action) {
      case 'digit': inputDigit(value); break;
      case 'decimal': inputDecimal(); break;
      case 'clear': clearAll(); break;
      case 'sign': toggleSign(); break;
      case 'percent': percent(); break;
      case 'operator': chooseOperator(value); break;
      case 'equals': equals(); break;
    }
  }

  // ---- Keyboard support ----
  // Maps physical keys to calculator actions
  const keyMap = {
    '+': ['operator', '+'],
    '-': ['operator', '−'],
    '*': ['operator', '×'],
    '/': ['operator', '÷'],
    '.': ['decimal', null],
    'Enter': ['equals', null],
    '=': ['equals', null],
    'Escape': ['clear', null],
    'Backspace': ['backspace', null],
    '%': ['percent', null],
  };

  window.addEventListener('keydown', (e) => {
    // Number keys 0-9
    if (e.key >= '0' && e.key <= '9') {
      inputDigit(e.key);
      highlightKey(`[data-action="digit"][data-value="${e.key}"]`);
      e.preventDefault();
      return;
    }

    const mapped = keyMap[e.key];
    if (!mapped) return; // ignore keys we don't handle
    e.preventDefault();

    const [action, value] = mapped;

    // Backspace removes the last typed digit
    if (action === 'backspace') {
      if (!justEvaluated) {
        current = current.length > 1 ? current.slice(0, -1) : '0';
        render();
      }
      return;
    }

    handleAction(action, value);

    // Flash the matching on-screen button for visual feedback
    const selector = value
      ? `[data-action="${action}"][data-value="${value}"]`
      : `[data-action="${action}"]`;
    highlightKey(selector);
  });

  function highlightKey(selector) {
    const btn = document.querySelector(selector);
    if (btn) flash(btn);
  }

  // ---- Initial paint ----
  render();
})();
