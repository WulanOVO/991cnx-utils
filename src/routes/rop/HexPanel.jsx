import { useState, useEffect, useCallback } from 'react';
import style from './RopIDE.module.scss';
import { Input } from '../../components/PanelInputs';

function HexDisplay({
  hexDisplay,
  leftStartAddress,
  rightStartAddress,
  selectedByte,
  onByteClick,
}) {
  const leftBaseAddr = parseInt(leftStartAddress || '0', 16);
  const rightBaseAddr = parseInt(rightStartAddress || '0', 16);

  const rows = hexDisplay.map((row, rowIndex) => {
    const leftAddr = leftBaseAddr + rowIndex * 16;
    const rightAddr = rightBaseAddr + rowIndex * 16;

    const leftAddrHex = leftAddr.toString(16).toUpperCase().padStart(4, '0');
    const rightAddrHex = rightAddr.toString(16).toUpperCase().padStart(4, '0');

    const byteElements = row.map((byte, byteIndex) => {
      const isSelected =
        selectedByte &&
        selectedByte.rowIndex === rowIndex &&
        selectedByte.byteIndex === byteIndex;

      const byteClassName = `${style.hexByte} ${
        byte === '00' ? style.zero : ''
      } ${isSelected ? style.selected : ''}`;

      return (
        <span
          key={byteIndex}
          className={byteClassName}
          onClick={() => onByteClick(rowIndex, byteIndex)}
        >
          {byte}
        </span>
      );
    });

    return (
      <div key={rowIndex} className={style.hexRow}>
        <span className={style.leftAddress}>{leftAddrHex}</span>
        <span className={style.hexBytes}>{byteElements}</span>
        <span className={style.rightAddress}>{rightAddrHex}</span>
      </div>
    );
  });

  return (
    <div className={style.hexDisplay} data-testid="hex-display">
      {rows}
    </div>
  );
}

export default function HexPanel({
  input,
  hexDisplay,
  selectedByte,
  byteToInputMap,
  onSelectedByteChange,
  onHexDisplayChange,
  leftStartAddress,
  rightStartAddress,
  setLeftStartAddress,
  setRightStartAddress,
}) {
  const [copyBtnText, setCopyBtnText] = useState('复制');

  const handleLeftAddressChange = useCallback((inputValue) => {
    const value = inputValue.toUpperCase();

    if (/^[0-9A-F]{0,4}$/.test(value)) {
      setLeftStartAddress(value);
    }
  }, []);

  const handleRightAddressChange = useCallback((inputValue) => {
    const value = inputValue.toUpperCase();

    if (/^[0-9A-F]{0,4}$/.test(value)) {
      setRightStartAddress(value);
    }
  }, []);

  const copyHexContent = useCallback(() => {
    const hexContent = hexDisplay.map((row) => row.join(' ')).join('\n');

    navigator.clipboard.writeText(hexContent).then(() => {
      setCopyBtnText('已复制✔');
      setTimeout(() => {
        setCopyBtnText('复制');
      }, 1500);
    });
  }, [hexDisplay]);

  const findInputRange = useCallback(
    (bytePos) => {
      if (!bytePos) return { start: 0, end: 0 };

      const { rowIndex, byteIndex } = bytePos;
      if (
        !byteToInputMap ||
        !byteToInputMap[rowIndex] ||
        !byteToInputMap[rowIndex][byteIndex]
      ) {
        return { start: 0, end: 0 };
      }

      const mapping = byteToInputMap[rowIndex][byteIndex];
      const firstChar = mapping.firstChar;
      const secondChar = mapping.secondChar;

      if (!firstChar && !secondChar) {
        return { start: 0, end: 0 };
      }

      // 如果有两个字符位置，使用它们的范围
      if (firstChar && secondChar) {
        return {
          start: firstChar.inputIndex,
          end: secondChar.inputIndex + 1,
        };
      }

      // 如果只有一个字符位置，使用它的位置
      const char = firstChar || secondChar;
      return {
        start: char.inputIndex,
        end: char.inputIndex + 1,
      };
    },
    [byteToInputMap]
  );

  const handleByteClick = useCallback(
    (rowIndex, byteIndex) => {
      if (
        selectedByte &&
        selectedByte.rowIndex === rowIndex &&
        selectedByte.byteIndex === byteIndex
      ) {
        onSelectedByteChange(null, null);
        return;
      }

      const { start, end } = findInputRange({
        rowIndex,
        byteIndex,
      });
      onSelectedByteChange({ rowIndex, byteIndex }, { start, end });
    },
    [selectedByte, onSelectedByteChange, byteToInputMap, findInputRange]
  );

  // 计算选中字节的地址
  const getSelectedAddresses = useCallback(() => {
    if (!selectedByte) return { left: null, right: null };

    const leftAddr =
      parseInt(leftStartAddress || '0', 16) +
      selectedByte.rowIndex * 16 +
      selectedByte.byteIndex;
    const rightAddr =
      parseInt(rightStartAddress || '0', 16) +
      selectedByte.rowIndex * 16 +
      selectedByte.byteIndex;

    return {
      left: leftAddr.toString(16).toUpperCase().padStart(4, '0'),
      right: rightAddr.toString(16).toUpperCase().padStart(4, '0'),
    };
  }, [selectedByte, leftStartAddress, rightStartAddress]);

  useEffect(() => {
    // 创建映射数组，记录每个十六进制字节在原始输入中的位置
    const mapping = [];
    const lines = input.split('\n');
    let hexChars = '';
    let currentPosition = 0;

    // 处理每一行，构建映射关系
    lines.forEach((line, lineIndex) => {
      const lineStartPos = currentPosition;
      // 移除注释部分
      const noCommentLine = line.split('//')[0];
      // 提取0-F字符的位置
      let hexInLine = '';

      for (let i = 0; i < noCommentLine.length; i++) {
        const char = noCommentLine[i];
        if (/[0-9A-Fa-f]/.test(char)) {
          hexInLine += char.toUpperCase();
          // 记录这个十六进制字符在原始输入中的位置
          mapping.push({
            inputIndex: lineStartPos + i,
            lineIndex: lineIndex,
            charIndex: i,
          });
        }
      }

      hexChars += hexInLine;
      currentPosition += line.length + 1; // +1 是为了换行符
    });

    if (hexChars.length === 0) {
      hexChars = '00';
      mapping.push({ inputIndex: 0, lineIndex: 0, charIndex: 0 });
      mapping.push({ inputIndex: 0, lineIndex: 0, charIndex: 0 });
    }

    // 将字符串分成16字节一组（每字节2个字符）
    const rows = [];
    const byteMapping = [];

    for (let i = 0; i < hexChars.length; i += 32) {
      const chunk = hexChars.slice(i, i + 32).padEnd(32, '0');
      const bytes = [];
      const byteMappingRow = [];

      for (let j = 0; j < chunk.length; j += 2) {
        const byte = chunk.substring(j, j + 2);
        bytes.push(byte);

        // 记录这个字节对应的原始输入位置
        const firstCharPos = i + j < mapping.length ? mapping[i + j] : null;
        const secondCharPos =
          i + j + 1 < mapping.length ? mapping[i + j + 1] : null;

        byteMappingRow.push({
          firstChar: firstCharPos,
          secondChar: secondCharPos,
        });
      }

      rows.push(bytes);
      byteMapping.push(byteMappingRow);
    }

    onHexDisplayChange(rows, byteMapping);
  }, [input]);

  const countBytes = useCallback(() => {
    let count = 0;
    for(let i = hexDisplay.length - 1; i >= 0; i--) {
      for(let j = hexDisplay[i].length - 1; j >= 0; j--) {
        if(hexDisplay[i][j] !== '00' || count > 0) {
          count++;
        }
      }
    }
    return count;
  }, [hexDisplay]);

  return (
    <div className={style.hexPanel}>
      <div className={style.hexDisplaySetting}>
        <Input
          label="左侧起始地址:"
          value={leftStartAddress}
          onChange={handleLeftAddressChange}
          placeholder="输入左侧起始地址"
        />
        <Input
          label="右侧起始地址:"
          value={rightStartAddress}
          onChange={handleRightAddressChange}
          placeholder="输入右侧起始地址"
        />
        <button
          className={style.copyButton}
          onClick={copyHexContent}
          title="复制全部十六进制内容"
        >
          {copyBtnText}
        </button>
      </div>

      <HexDisplay
        hexDisplay={hexDisplay}
        leftStartAddress={leftStartAddress}
        rightStartAddress={rightStartAddress}
        selectedByte={selectedByte}
        onByteClick={handleByteClick}
      />
      <div className={style.hexFootbar}>
        {selectedByte && (
          <div className={style.selectedAddresses}>
            选中地址:
            <span className={style.leftSelectedAddress}>
              {getSelectedAddresses().left}
            </span>
            <span className={style.rightSelectedAddress}>
              {getSelectedAddresses().right}
            </span>
          </div>
        )}

        <div className={style.bytesTotal}>
          字节总数: {countBytes()}
        </div>
      </div>
    </div>
  );
}
