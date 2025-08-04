import { useState, useEffect } from 'react';
import style from './App.module.scss';

const tableManifest = [
  { file: './tables/table-00.json', name: '字符表' },
  { file: './tables/table-00-display.json', name: '拼字字符表' },
];

const tableModules = import.meta.glob('./tables/*.json');

const colorMap = {
  green: { hex: '#d3f9d8', explanation: '可直接打出' },
  blue: { hex: '#d0ebff', explanation: '复数模式可直接打出' },
  violet: { hex: '#e5dbff', explanation: '计算模式可直接打出' },
  yellow: { hex: '#fff3bf', explanation: '可用字符转换器刷出' },
  white: { hex: '#fff', explanation: '不可刷字符' },
};

function Checkbox({ checked, onChange, children }) {
  return (
    <label className={style['checkbox-label']}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {children}
    </label>
  );
}

function Panel({ showColors, setShowColors, showLbf, setShowLbf, availableTables, selectedTable, setSelectedTable }) {
  return (
    <div className={style['panel']}>
      <Checkbox
        checked={showColors}
        onChange={(checked) => setShowColors(checked)}
      >
        显示字符种类标注
      </Checkbox>

      <Checkbox checked={showLbf} onChange={(checked) => setShowLbf(checked)}>
        显示字符转换器步骤
      </Checkbox>

      <div className={style['select-container']}>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className={style.select}
        >
          {availableTables.map(table => (
            <option key={table.file} value={table.file}>
              {table.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr>
        <th></th>
        {Array.from({ length: 16 }, (_, i) => (
          <th key={i}>{i.toString(16).toUpperCase()}</th>
        ))}
      </tr>
    </thead>
  );
}

function TableRow({ row, rowIndex, showColors, showLbf }) {
  return (
    <tr key={rowIndex}>
      <th>{rowIndex.toString(16).toUpperCase()}</th>
      {row.map((cell, cellIndex) => (
        <TableCell
          key={cellIndex}
          cell={cell}
          rowIndex={rowIndex}
          colIndex={cellIndex}
          showColors={showColors}
          showLbf={showLbf}
        />
      ))}
    </tr>
  );
}

function TableCell({ cell, showColors, showLbf }) {
  const cellColor = showColors ? colorMap[cell.color]?.hex || '#fff' : '#fff';

  return (
    <td style={{ backgroundColor: cellColor }}>
      <div className={style['content-wrapper']}>
        <div className={`${style['td-text']} ${cell.Arial ? style.Arial : ''}`}>
          {cell.text}
        </div>
        {showLbf && cell.lbf && <div className={style.lbf}>{cell.lbf}</div>}
      </div>
    </td>
  );
}

function ColorLegend() {
  return (
    <div className={style['color-legend']}>
      {Object.entries(colorMap).map(([colorName, colorInfo]) => (
        <div key={colorName} className={style['legend-item']}>
          <div
            className={style['color-box']}
            style={{ backgroundColor: colorInfo.hex }}
          ></div>
          <span>{colorInfo.explanation}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [showColors, setShowColors] = useState(true);
  const [showLbf, setShowLbf] = useState(true);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    setAvailableTables(tableManifest);
    if (tableManifest.length > 0) {
      setSelectedTable(tableManifest[0].file);
    }
  }, []);

  useEffect(() => {
    if (selectedTable && tableModules[selectedTable]) {
      tableModules[selectedTable]().then(module => {
        setTableData(module.default);
      });
    }
  }, [selectedTable]);

  return (
    <div className={style.container}>
      <h1>fx991CNX 实用全标注字符表</h1>
      <Panel
        showColors={showColors}
        setShowColors={setShowColors}
        showLbf={showLbf}
        setShowLbf={setShowLbf}
        availableTables={availableTables}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
      />
      <div className={style['table-container']}>
        <table className={style.table}>
          <TableHeader />
          <tbody>
            {tableData.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                row={row.map((cell) => ({ ...cell, showColors, showLbf }))}
                rowIndex={rowIndex}
                showColors={showColors}
                showLbf={showLbf}
              />
            ))}
          </tbody>
        </table>
      </div>
      {showColors && <ColorLegend />}
    </div>
  );
}
