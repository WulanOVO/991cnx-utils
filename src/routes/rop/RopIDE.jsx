import { useState, useEffect, useRef } from 'react';
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

export default function RopIDE() {
  const [input, setInput] = useState('');
  const [leftStartAddress, setLeftStartAddress] = useState('E9E0');
  const [rightStartAddress, setRightStartAddress] = useState('D710');
  const [hexDisplay, setHexDisplay] = useState([]);
  const [selectedByte, setSelectedByte] = useState(null);
  const [copyBtnText, setCopyBtnText] = useState('复制');
  const [byteToInputMap, setByteToInputMap] = useState([]);
  const [textareaRef, setTextareaRef] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('未命名.rop');
  const fileInputRef = useRef(null);

  const copyHexContent = () => {
    const hexContent = hexDisplay.map((row) => row.join(' ')).join('\n');

    navigator.clipboard.writeText(hexContent).then(() => {
      setCopyBtnText('已复制✔');
      setTimeout(() => {
        setCopyBtnText('复制');
      }, 1500);
    });
  };

  // 创建新文件
  const createNewFile = () => {
    if (input && !confirm('是否放弃当前更改并创建新文件？')) {
      return;
    }
    setInput('');
    setLeftStartAddress('E9E0');
    setRightStartAddress('D710');
    setSelectedByte(null);
    setCurrentFileName('未命名.rop');
  };

  // 打开文件
  const openFile = () => {
    if (input && !confirm('是否放弃当前更改并打开新文件？')) {
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileNameChange = (e) => {
    setCurrentFileName(e.target.value);
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileData = JSON.parse(event.target.result);
        setInput(fileData.input || '');
        setLeftStartAddress(fileData.leftStartAddress || 'E9E0');
        setRightStartAddress(fileData.rightStartAddress || 'D710');
        setCurrentFileName(file.name);
      } catch (error) {
        alert('文件格式错误，无法打开！');
        console.error('文件解析错误:', error);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // 重置文件输入，允许重新选择同一文件
  };

  // 保存文件
  const saveFile = async () => {
    const fileData = {
      input,
      leftStartAddress,
      rightStartAddress,
      timestamp: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(fileData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 尝试使用现代的File System Access API
    try {
      if ('showSaveFilePicker' in window) {
        const options = {
          suggestedName: currentFileName,
          types: [
            {
              description: 'ROP文件',
              accept: { 'application/json': ['.rop'] },
            },
          ],
        };

        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return; // 成功保存，直接返回
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
    }

    // 回退到传统下载方式
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleLeftAddressChange = (inputValue) => {
    const value = inputValue.toUpperCase();

    if (/^[0-9A-F]{0,4}$/.test(value)) {
      setLeftStartAddress(value);
    }
  };
  const handleRightAddressChange = (inputValue) => {
    const value = inputValue.toUpperCase();

    if (/^[0-9A-F]{0,4}$/.test(value)) {
      setRightStartAddress(value);
    }
  };

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

    setHexDisplay(rows);
    setByteToInputMap(byteMapping);
    setSelectedByte(null);
  }, [input]);

  const handleByteClick = (rowIndex, byteIndex) => {
    if (
      selectedByte &&
      selectedByte.rowIndex === rowIndex &&
      selectedByte.byteIndex === byteIndex
    ) {
      setSelectedByte(null);
      return;
    }

    setSelectedByte({ rowIndex, byteIndex });

    // 高亮输入框中对应的内容
    if (
      textareaRef &&
      byteToInputMap.length > 0 &&
      byteToInputMap[rowIndex] &&
      byteToInputMap[rowIndex][byteIndex]
    ) {
      const mapping = byteToInputMap[rowIndex][byteIndex];
      const { firstChar, secondChar } = mapping;

      if (firstChar) {
        const startPos = getPositionInTextarea(
          firstChar.lineIndex,
          firstChar.charIndex
        );
        let endPos = startPos + 1;

        if (secondChar) {
          endPos =
            getPositionInTextarea(secondChar.lineIndex, secondChar.charIndex) +
            1;
        }

        textareaRef.focus();
        textareaRef.setSelectionRange(startPos, endPos);

        // 滚动输入框到选中位置
        scrollTextareaToSelection(startPos);
      }
    }
  };

  // 滚动输入框到选中位置
  const scrollTextareaToSelection = (position) => {
    if (!textareaRef) return;

    // 获取当前行的位置
    const text = textareaRef.value;
    const lines = text.substr(0, position).split('\n');
    const lineIndex = lines.length - 1;

    // 计算行高（近似值）
    const lineHeight = 20; // 假设每行高度为20px

    // 计算滚动位置，使选中行在视图中间
    const scrollPosition =
      lineIndex * lineHeight - textareaRef.clientHeight / 2 + lineHeight;

    // 确保滚动位置在有效范围内
    const maxScroll = textareaRef.scrollHeight - textareaRef.clientHeight;
    const targetScroll = Math.max(0, Math.min(scrollPosition, maxScroll));

    // 平滑滚动到目标位置
    textareaRef.scrollTop = targetScroll;
  };

  // 计算文本区域中的绝对位置
  const getPositionInTextarea = (lineIndex, charIndex) => {
    const lines = input.split('\n');
    let position = 0;

    for (let i = 0; i < lineIndex; i++) {
      position += lines[i].length + 1; // +1 是为了换行符
    }

    return position + charIndex;
  };

  // 处理输入框选择事件
  const handleTextareaSelect = (e) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;

    // 如果没有选择文本，不处理
    if (start === end) return;

    // 查找选择范围内的十六进制字节
    const found = findAndHighlightBytes(start, end);

    // 如果没有找到对应的十六进制字节，清除选中状态
    if (!found) {
      setSelectedByte(null);
    }
  };

  // 查找并高亮对应的十六进制字节
  const findAndHighlightBytes = (start, end) => {
    if (!byteToInputMap.length) return false;

    // 查找选择范围内的第一个字节
    for (let rowIndex = 0; rowIndex < byteToInputMap.length; rowIndex++) {
      const row = byteToInputMap[rowIndex];

      for (let byteIndex = 0; byteIndex < row.length; byteIndex++) {
        const { firstChar, secondChar } = row[byteIndex];

        if (!firstChar) continue;

        const firstCharPos = getPositionInTextarea(
          firstChar.lineIndex,
          firstChar.charIndex
        );
        let secondCharPos = firstCharPos;

        if (secondChar) {
          secondCharPos = getPositionInTextarea(
            secondChar.lineIndex,
            secondChar.charIndex
          );
        }

        // 检查是否在选择范围内
        if (
          (firstCharPos >= start && firstCharPos < end) ||
          (secondCharPos >= start && secondCharPos < end) ||
          (start >= firstCharPos && end <= secondCharPos + 1)
        ) {
          setSelectedByte({ rowIndex, byteIndex });
          return true;
        }
      }
    }

    return false;
  };

  // 计算选中字节的地址
  const getSelectedAddresses = () => {
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
  };

  return (
    <>
      <div className={style.toolbar}>
        <button
          className={style.fileButton}
          onClick={createNewFile}
          title="创建新文件"
        >
          新建
        </button>
        <button
          className={style.fileButton}
          onClick={openFile}
          title="打开文件"
        >
          打开
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".rop"
          onChange={handleFileSelect}
        />
        <button
          className={style.fileButton}
          onClick={saveFile}
          title="保存文件"
        >
          保存
        </button>
        <input
          type="text"
          className={style.currentFileName}
          value={currentFileName}
          onChange={handleFileNameChange}
        />
      </div>

      <div className="page-container">
        <div className={style.editorContainer}>
          <div className={style.inputPanel}>
            <textarea
              ref={(ref) => setTextareaRef(ref)}
              value={input}
              onChange={handleInputChange}
              onSelect={handleTextareaSelect}
              placeholder="输入ROP代码..."
              className={style.codeInput}
            />
          </div>

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
          </div>
        </div>
      </div>
    </>
  );
}
