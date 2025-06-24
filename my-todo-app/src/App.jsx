import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [budgeted, setBudgeted] = useState('');
  const [spent, setSpent] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [eBudgeted, seteBudgeted] = useState('');
  const [eSpent, seteSpent] = useState('');
  const [showItems, setShowItems] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterMessage, setFilterMessage] = useState('');
  const [error, setError] = useState('');

  const url = 'http://localhost:4000/api/todos';

  const fetchAll = async () => {
    try {
      const res = await axios.get(url);
      setTodos(res.data);
      setFilterMessage('');
      setError('');
    } catch {
      setError('Failed to fetch all items');
    }
  };

  const fetchRange = async () => {
    if (!fromDate || !toDate) return alert('Select both From and To dates');
    try {
      const fromISO = new Date(fromDate).toISOString();
      const toISO = new Date(toDate).toISOString();
      const res = await axios.get(`${url}/range`, {
        params: { from: fromISO, to: toISO }
      });
      setTodos(res.data);
      setFilterMessage(`Showing items from ${new Date(fromISO).toLocaleString()} to ${new Date(toISO).toLocaleString()}`);
      setError('');
    } catch {
      setError('Failed to fetch range items');
    }
  };

  const add = async () => {
    if (!text.trim()) return;
    try {
      const res = await axios.post(url, { text, budgeted, spent, currency });
      setTodos(prev => [...prev, res.data]);
      setText(''); setBudgeted(''); setSpent('');
      setError('');
    } catch {
      setError('Failed to add item');
    }
  };

  const saveEdit = async (id) => {
    try {
      const res = await axios.put(`${url}/${id}`, {
        text: editText, budgeted: eBudgeted, spent: eSpent
      });
      setTodos(prev => prev.map(i => i._id === id ? res.data : i));
      setEditId(null);
      setError('');
    } catch {
      setError('Failed to save changes');
    }
  };

  const del = async (id) => {
    try {
      await axios.delete(`${url}/${id}`);
      setTodos(prev => prev.filter(i => i._id !== id));
      setError('');
    } catch {
      setError('Failed to delete item');
    }
  };

  const format = (val, curr) => val === '' ? '—' :
    new Intl.NumberFormat(undefined, { style: 'currency', currency: curr }).format(val);

  const totals = {
    budgeted: todos.reduce((a, i) => a + i.convertedBudgetedNGN, 0),
    spent: todos.reduce((a, i) => a + i.convertedSpentNGN, 0)
  };
  totals.variance = totals.budgeted - totals.spent;

  const exportToCSV = () => {
    const headers = ['Item', 'Budgeted', 'Spent', 'Currency', 'Budgeted_NGN', 'Spent_NGN', 'Time'];
    const rows = todos.map(i => [
      i.text, i.budgeted, i.spent, i.currency,
      i.convertedBudgetedNGN, i.convertedSpentNGN,
      new Date(i.time).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'budget_records.csv');
    link.click();
  };

  return (
    <div className="app">
      <h1>📊 Budget Tracker</h1>
      {error && <div className="error">{error}</div>}

      <div className="input-container no-print">
        <input value={text} placeholder="Item" onChange={e => setText(e.target.value)} />
        <input type="number" value={budgeted} placeholder="Budgeted" onChange={e => setBudgeted(e.target.value)} />
        <input type="number" value={spent} placeholder="Spent" onChange={e => setSpent(e.target.value)} />
        <select value={currency} onChange={e => setCurrency(e.target.value)}>
          <option>NGN</option><option>USD</option><option>EUR</option><option>GBP</option>
        </select>
        <button onClick={add}>Add</button>
      </div>

      <div className="controls no-print">
        <button onClick={fetchAll}>Refresh All</button>
        <button onClick={() => setShowItems(p => !p)}>
          {showItems ? 'Hide Items' : 'Show Items'}
        </button>
        <button onClick={() => exportToCSV()}>Export CSV</button>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <div className="range-controls no-print">
        <label>From:</label>
        <input type="datetime-local" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <label>To:</label>
        <input type="datetime-local" value={toDate} onChange={e => setToDate(e.target.value)} />
        <button onClick={fetchRange}>Search Range</button>
        <button onClick={fetchAll}>Clear Filter</button>
      </div>

      {filterMessage && <p className="info">{filterMessage}</p>}

      {showItems && todos.length > 0 && (
        <div className="print-area">
          <table className="todo-table">
            <thead>
              <tr>
                <th>Item</th><th>Budgeted</th><th>Budgeted ₦</th>
                <th>Spent</th><th>Spent ₦</th><th>Variance ₦</th>
                <th>Time</th><th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todos.map(item => (
                <tr key={item._id}>
                  {editId === item._id ? (
                    <>
                      <td><input value={editText} onChange={e => setEditText(e.target.value)} /></td>
                      <td><input type="number" value={eBudgeted} onChange={e => seteBudgeted(e.target.value)} /></td>
                      <td>—</td>
                      <td><input type="number" value={eSpent} onChange={e => seteSpent(e.target.value)} /></td>
                      <td>—</td><td>—</td>
                      <td>{new Date(item.time).toLocaleString()}</td>
                    </>
                  ) : (
                    <>
                      <td>{item.text}</td>
                      <td>{format(item.budgeted, item.currency)}</td>
                      <td>₦{item.convertedBudgetedNGN.toLocaleString()}</td>
                      <td>{format(item.spent, item.currency)}</td>
                      <td>₦{item.convertedSpentNGN.toLocaleString()}</td>
                      <td>₦{(item.convertedBudgetedNGN - item.convertedSpentNGN).toLocaleString()}</td>
                      <td>{new Date(item.time).toLocaleString()}</td>
                    </>
                  )}
                  <td className="no-print">
                    {editId === item._id ? (
                      <button onClick={() => saveEdit(item._id)}>Save</button>
                    ) : (
                      <button onClick={() => {
                        setEditId(item._id);
                        setEditText(item.text);
                        seteBudgeted(item.budgeted);
                        seteSpent(item.spent);
                      }}>Edit</button>
                    )}
                    <button onClick={() => del(item._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              <tr className="totals-row">
                <td><strong>Totals:</strong></td>
                <td></td>
                <td><strong>₦{totals.budgeted.toLocaleString()}</strong></td>
                <td></td>
                <td><strong>₦{totals.spent.toLocaleString()}</strong></td>
                <td><strong>₦{totals.variance.toLocaleString()}</strong></td>
                <td></td><td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;