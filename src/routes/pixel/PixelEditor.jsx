import { useState, useEffect, useRef } from 'react';
import style from './PixelEditor.module.scss';
import { SliderInput, Button, Panel, ButtonsContainer } from '@/components/PanelInputs';

function PixelPanel({ width, setWidth, height, setHeight, onClear, onInvert }) {
  return (
    <Panel>
      <SliderInput
        label="画布宽度"
        value={width}
        onChange={setWidth}
        min={8}
        max={192}
        step={8}
      />
      <SliderInput
        label="画布高度"
        value={height}
        onChange={setHeight}
        min={1}
        max={63}
        step={1}
      />
      <ButtonsContainer>
        <Button onClick={onClear}>清空</Button>
        <Button onClick={onInvert}>反色</Button>
      </ButtonsContainer>
    </Panel>
  );
}

function Canvas({ width, height, pixels, setPixels }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [drawMode, setDrawMode] = useState(null); // 1: 设置为1, 0: 设置为0

  // 计算像素大小，确保画布适应屏幕
  const calculatePixelSize = () => {
    const container = canvasRef.current?.parentElement;
    if (!container) return 20; // 默认大小

    const maxWidth = container.clientWidth - 40; // 留出一些边距
    const maxHeight = window.innerHeight * 0.6; // 限制最大高度

    const pixelWidth = Math.floor(maxWidth / width);
    const pixelHeight = Math.floor(maxHeight / height);

    return Math.max(4, Math.min(pixelWidth, pixelHeight)); // 最小4px，最大取决于容器大小
  };

  const [pixelSize, setPixelSize] = useState(20);

  useEffect(() => {
    const handleResize = () => {
      setPixelSize(calculatePixelSize());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  useEffect(() => {
    // 当宽度或高度改变时，调整像素数组
    const newPixels = Array(height).fill().map((_, y) => {
      if (y < pixels.length) {
        // 保留现有行，但调整宽度
        return Array(width).fill().map((_, x) => {
          return x < pixels[y].length ? pixels[y][x] : 0;
        });
      } else {
        // 添加新行
        return Array(width).fill(0);
      }
    });
    setPixels(newPixels);
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制像素
    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        ctx.fillStyle = pixels[y][x] ? '#000' : '#fff';
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    // 绘制网格
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;

    // 垂直线
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * pixelSize, 0);
      ctx.lineTo(x * pixelSize, height * pixelSize);
      ctx.stroke();
    }

    // 水平线
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize);
      ctx.lineTo(width * pixelSize, y * pixelSize);
      ctx.stroke();
    }
  }, [pixels, pixelSize, width, height]);

  const setPixel = (x, y, value) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const newPixels = [...pixels];
      newPixels[y] = [...newPixels[y]];
      newPixels[y][x] = value;
      setPixels(newPixels);
    }
  };

  const handleMouseDown = (e) => {
    setDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    // 确定绘制模式：第一个像素的反色
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const currentValue = pixels[y][x];
      setDrawMode(currentValue ? 0 : 1);
      setPixel(x, y, currentValue ? 0 : 1);
    }

    setLastPos({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!drawing || drawMode === null) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    // 如果位置没变，不做任何事
    if (lastPos && lastPos.x === x && lastPos.y === y) return;

    setLastPos({ x, y });
    setPixel(x, y, drawMode);
  };

  const handleMouseUp = () => {
    setDrawing(false);
    setLastPos(null);
    setDrawMode(null);
  };

  const handleTouchStart = (e) => {
    e.preventDefault(); // 防止滚动和缩放
    setDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.floor((touch.clientX - rect.left) / pixelSize);
    const y = Math.floor((touch.clientY - rect.top) / pixelSize);

    // 确定绘制模式：第一个像素的反色
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const currentValue = pixels[y][x];
      setDrawMode(currentValue ? 0 : 1);
      setPixel(x, y, currentValue ? 0 : 1);
    }

    setLastPos({ x, y });
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // 防止滚动和缩放
    if (!drawing || drawMode === null) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.floor((touch.clientX - rect.left) / pixelSize);
    const y = Math.floor((touch.clientY - rect.top) / pixelSize);

    // 如果位置没变，不做任何事
    if (lastPos && lastPos.x === x && lastPos.y === y) return;

    setLastPos({ x, y });
    setPixel(x, y, drawMode);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault(); // 防止滚动和缩放
    setDrawing(false);
    setLastPos(null);
    setDrawMode(null);
  };

  return (
    <div className={style['canvas-container']}>
      <canvas
        ref={canvasRef}
        width={width * pixelSize}
        height={height * pixelSize}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={style.canvas}
      />
    </div>
  );
}

function HexOutput({ pixels }) {
  let allBinary = '';
  pixels.forEach(row => {
    // 将每行转换为二进制字符串
    let binaryString = row.join('');

    // 如果长度不是8的倍数，补0
    const padding = 8 - (binaryString.length % 8);
    if (padding < 8) {
      binaryString += '0'.repeat(padding);
    }

    allBinary += binaryString;
  });

  // 每8位转换为一个十六进制数
  let hexString = '';
  let byteCount = 0;
  for (let i = 0; i < allBinary.length; i += 8) {
    const byte = allBinary.substr(i, 8);
    const hex = parseInt(byte, 2).toString(16).padStart(2, '0').toUpperCase();
    hexString += hex + ' ';
    byteCount++;
  }

  return (
    <div className={style['hex-output-container']}>
      <span>
        <h3>十六进制输出</h3>
        <div className={style['hex-byte-count']}>{byteCount} 字节</div>
      </span>
      <pre className={style['hex-output']}>{hexString.trim()}</pre>
    </div>
  );
}

export default function PixelEditor() {
  const [width, setWidth] = useState(32); // 默认宽度，8的倍数
  const [height, setHeight] = useState(16); // 默认高度
  const [pixels, setPixels] = useState(Array(height).fill().map(() => Array(width).fill(0)));

  const handleClear = () => {
    setPixels(Array(height).fill().map(() => Array(width).fill(0)));
  };

  const handleInvert = () => {
    setPixels(pixels.map(row => row.map(pixel => pixel ? 0 : 1)));
  };

  return (
    <div className='page-container'>
      <h1>二进制像素编辑器</h1>
      <PixelPanel
        width={width}
        setWidth={setWidth}
        height={height}
        setHeight={setHeight}
        onClear={handleClear}
        onInvert={handleInvert}
      />
      <Canvas
        width={width}
        height={height}
        pixels={pixels}
        setPixels={setPixels}
      />
      <HexOutput pixels={pixels} />
    </div>
  );
}