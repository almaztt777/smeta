'use strict';

const byId = id => document.getElementById(id);
const fields = ['sender', 'recipient', 'number', 'date'];
const itemFields = [['name', 'Название'], ['quantity', 'Количество'], ['unit', 'Единица'], ['price', 'Цена']];
let nextRowId = 0;

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function numeric(value) {
  const text = String(value ?? '').trim().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return 0;
  const number = Number(text);
  return Number.isFinite(number) && number <= 1e12 ? number : 0;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function money(value) {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(round(value)).replace(/\u00a0|\u202f/g, ' ')} ?`;
}

function addRow(data = {}, focus = false) {
  const row = document.createElement('tr');
  const id = ++nextRowId;
  itemFields.forEach(([key, title]) => {
    const cell = document.createElement('td');
    cell.dataset.label = title;
    const label = document.createElement('label');
    label.className = 'sr-only';
    label.htmlFor = `row-${id}-${key}`;
    label.textContent = `${title}, позиция ${id}`;
    const input = document.createElement('input');
    input.id = label.htmlFor;
    input.dataset.field = key;
    input.value = data[key] ?? (key === 'quantity' ? '1' : key === 'unit' ? 'шт.' : '');
    if (key === 'quantity' || key === 'price') input.inputMode = 'decimal';
    cell.append(label, input);
    row.append(cell);
  });
  const sum = document.createElement('td');
  sum.className = 'row-sum';
  sum.dataset.label = 'Сумма';
  const actions = document.createElement('td');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'delete';
  button.textContent = 'Удалить';
  button.setAttribute('aria-label', `Удалить позицию ${id}`);
  button.addEventListener('click', () => {
    const target = row.nextElementSibling || row.previousElementSibling;
    row.remove();
    (target?.querySelector('input') || byId('add')).focus();
    update();
  });
  actions.append(button);
  row.append(sum, actions);
  byId('items').append(row);
  update();
  if (focus) row.querySelector('input').focus();
}

function readItems() {
  return Array.from(byId('items').rows, row => Object.fromEntries(itemFields.map(([key]) => [key, row.querySelector(`[data-field="${key}"]`).value])));
}

function calculate(items = readItems()) {
  const sums = items.map(item => round(numeric(item.quantity) * numeric(item.price)));
  const subtotal = round(sums.reduce((sum, value) => sum + value, 0));
  return { sums, subtotal, total: subtotal };
}

function update() {
  const totals = calculate();
  Array.from(byId('items').rows).forEach((row, index) => { row.querySelector('.row-sum').textContent = money(totals.sums[index]); });
  byId('total').textContent = money(totals.total);

}

byId('date').value = today();
byId('add').addEventListener('click', () => addRow({}, true));
document.addEventListener('input', update);
addRow();
