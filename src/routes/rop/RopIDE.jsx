import { useState, useRef, useCallback } from 'react';
import style from './RopIDE.module.scss';
import InputPanel from './InputPanel';
import HexPanel from './HexPanel';


const IDE_VERSION = 10;

export default function RopIDE() {
  const [input, setInput] = useState('');
  const [hexDisplay, setHexDisplay] = useState([]);
  const [selectedByte, setSelectedByte] = useState(null);
  const [selectedInput, setSelectedInput] = useState(null);
  const [byteToInputMap, setByteToInputMap] = useState([]);
  const [currentFileName, setCurrentFileName] = useState('未命名.rop');
  const [leftStartAddress, setLeftStartAddress] = useState('E9E0');
  const [rightStartAddress, setRightStartAddress] = useState('D710');
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef(null);

  const createNewFile = () => {
    if (input && !confirm('是否放弃当前更改并创建新文件？')) {
      return;
    }
    setInput('');
    setSelectedByte(null);
    setCurrentFileName('未命名.rop');
  };

  const openFile = () => {
    if (input && !confirm('是否放弃当前更改并打开新文件？')) {
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileNameChange = (e) => {
    setCurrentFileName(e.target.value);
  };

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

  const saveFile = async () => {
    const fileData = {
      input,
      leftStartAddress,
      rightStartAddress,
      ideVersion: IDE_VERSION,
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

        setIsDirty(false);
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

    setIsDirty(false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setIsDirty(true);
  };

  const handleSelectionInputChange = useCallback((newSelectedByte) => {
    setSelectedByte(newSelectedByte);
  }, []);

  const handleSelectionByteChange = useCallback((newSelectedByte, newSelectedInput) => {
    setSelectedByte(newSelectedByte);
    setSelectedInput(newSelectedInput);
  }, []);

  const handleHexDisplayChange = useCallback((newHexDisplay, newByteToInputMap) => {
    setHexDisplay(newHexDisplay);
    setByteToInputMap(newByteToInputMap);
  }, []);

  window.onbeforeunload = () => {
    if (isDirty) {
      return '您确定要离开吗？所有未保存的更改都将丢失。';
    }
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
          <InputPanel
            input={input}
            onInputChange={handleInputChange}
            onSelectionInputChange={handleSelectionInputChange}
            byteToInputMap={byteToInputMap}
            selectedInput={selectedInput}
          />

          <HexPanel
            input={input}
            hexDisplay={hexDisplay}
            selectedByte={selectedByte}
            byteToInputMap={byteToInputMap}
            leftStartAddress={leftStartAddress}
            rightStartAddress={rightStartAddress}
            setLeftStartAddress={setLeftStartAddress}
            setRightStartAddress={setRightStartAddress}
            onSelectedByteChange={handleSelectionByteChange}
            onHexDisplayChange={handleHexDisplayChange}
          />
        </div>
      </div>
    </>
  );
}
