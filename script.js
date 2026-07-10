(function () {
  const display = document.getElementById("display");
  const historyEl = document.getElementById("history");

  let current = "0";
  let previous = null;
  let operator = null;
  let justEvaluated = false;

  const MAX_DIGITS = 12;

  function render() {
    display.textContent = current;
    historyEl.textContent =
      previous !== null && operator
        ? `${trimNumber(previous)} ${operator}`
        : "\u00a0";
  }

  function trimNumber(numStr) {
    const num = parseFloat(numStr);
    if (Number.isNaN(num)) return "0";
    if (!isFinite(num)) return "Error";
    let str = num.toString();
    if (str.length > MAX_DIGITS) {
      str = num.toPrecision(10);
      str = parseFloat(str).toString();
    }
    return str;
  }

  function inputDigit(d) {
    if (justEvaluated) {
      current = d;
      justEvaluated = false;
    } else if (current === "0") {
      current = d;
    } else if (current.replace("-", "").replace(".", "").length < MAX_DIGITS) {
      current += d;
    }
    render();
  }

  function inputDecimal() {
    if (justEvaluated) {
      current = "0.";
      justEvaluated = false;
    } else if (!current.includes(".")) {
      current += ".";
    }
    render();
  }

  function clearAll() {
    current = "0";
    previous = null;
    operator = null;
    justEvaluated = false;
    render();
  }

  function toggleSign() {
    if (current === "0") return;
    current = current.startsWith("-") ? current.slice(1) : "-" + current;
    render();
  }

  function percent() {
    current = trimNumber((parseFloat(current) / 100).toString());
    render();
  }

  function compute(a, b, op) {
    a = parseFloat(a);
    b = parseFloat(b);
    switch (op) {
      case "+":
        return a + b;
      case "−":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function chooseOperator(op) {
    if (operator && !justEvaluated) {
      const result = compute(previous, current, operator);
      current = Number.isNaN(result) ? "Error" : trimNumber(result.toString());
    }
    previous = current;
    operator = op;
    justEvaluated = true;
    render();
  }

  function equals() {
    if (operator === null || previous === null) return;
    const result = compute(previous, current, operator);
    current = Number.isNaN(result) ? "Error" : trimNumber(result.toString());
    previous = null;
    operator = null;
    justEvaluated = true;
    render();
  }

  document.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handleAction(btn.dataset.action, btn.dataset.value);
      flash(btn);
    });
  });

  function flash(btn) {
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 100);
  }

  function handleAction(action, value) {
    switch (action) {
      case "digit":
        inputDigit(value);
        break;
      case "decimal":
        inputDecimal();
        break;
      case "clear":
        clearAll();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        percent();
        break;
      case "operator":
        chooseOperator(value);
        break;
      case "equals":
        equals();
        break;
    }
  }

  const keyMap = {
    "+": ["operator", "+"],
    "-": ["operator", "−"],
    "*": ["operator", "×"],
    "/": ["operator", "÷"],
    ".": ["decimal", null],
    Enter: ["equals", null],
    "=": ["equals", null],
    Escape: ["clear", null],
    Backspace: ["backspace", null],
    "%": ["percent", null],
  };

  window.addEventListener("keydown", (e) => {
    if (e.key >= "0" && e.key <= "9") {
      inputDigit(e.key);
      highlightKey(`[data-action="digit"][data-value="${e.key}"]`);
      e.preventDefault();
      return;
    }

    const mapped = keyMap[e.key];
    if (!mapped) return;
    e.preventDefault();

    const [action, value] = mapped;

    if (action === "backspace") {
      if (!justEvaluated) {
        current = current.length > 1 ? current.slice(0, -1) : "0";
        render();
      }
      return;
    }

    handleAction(action, value);

    const selector = value
      ? `[data-action="${action}"][data-value="${value}"]`
      : `[data-action="${action}"]`;
    highlightKey(selector);
  });

  function highlightKey(selector) {
    const btn = document.querySelector(selector);
    if (btn) flash(btn);
  }

  render();
})();
