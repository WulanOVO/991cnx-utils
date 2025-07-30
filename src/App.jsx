import style from './App.module.scss';
import table00 from './tables/table-00.json';

const colorMap = {
  green: { hex: '#d3f9d8', explanation: '可直接打出' },
  blue: { hex: '#d0ebff', explanation: '复数模式可直接打出' },
  violet: { hex: '#e5dbff', explanation: '计算模式可直接打出' },
  yellow: { hex: '#fff3bf', explanation: '可用字符转换器刷出' },
  white: { hex: '#fff', explanation: '不可刷字符' },
};

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

function TableRow({ row, rowIndex }) {
  return (
    <tr key={rowIndex}>
      <th>{rowIndex.toString(16).toUpperCase()}</th>
      {row.map((cell, cellIndex) => (
        <TableCell
          key={cellIndex}
          cell={cell}
          rowIndex={rowIndex}
          colIndex={cellIndex}
        />
      ))}
    </tr>
  );
}

function TableCell({ cell, rowIndex, colIndex }) {
  const cellColor = colorMap[cell.color]?.hex || '#fff';

  return (
    <td style={{ backgroundColor: cellColor }}>
      <div className={style['content-wrapper']}>
        <div
          className={style['td-text']}
          style={{
            fontFamily: cell.disableFont ? 'Arial, sans-serif' : 'fx991cnx',
          }}
        >
          {cell.text}
        </div>
        {cell.lbf && <div className={style.lbf}>{cell.lbf}</div>}
      </div>
    </td>
  );
}

export default function App() {
  return (
    <div className={style.container}>
      <h1>fx991CNX 实用全标注字符表</h1>
      <div className={style['table-container']}>
        <table className={style.table}>
          <TableHeader />
          <tbody>
            {table00.map((row, rowIndex) => (
              <TableRow key={rowIndex} row={row} rowIndex={rowIndex} />
            ))}
          </tbody>
        </table>
      </div>
      <ColorLegend />
    </div>
  );
}
