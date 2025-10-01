import { useState, useEffect, useCallback, useRef } from 'react';
import style from './RopIDE.module.scss';

export default function InputPanel({
  input,
  onInputChange,
  onSelectionInputChange,
  byteToInputMap,
  selectedInput,
}) {
  const [textareaRef, setTextareaRef] = useState(null);
  const highlightedContentRef = useRef(null);
  const editorRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 });

  // 解析代码，识别注释
  const parseCode = useCallback((code) => {
    if (!code) return [];

    const lines = code.split('\n');
    const parsedLines = [];
    const hexRegex = /^[0-9a-fA-F]$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const segments = [];
      let currentSegment = { text: '', type: 'code' };

      // 查找注释的起始位置
      const commentIndex = line.indexOf('//');

      // 如果有//注释，先处理注释前的部分
      let processEndIndex = commentIndex !== -1 ? commentIndex : line.length;

      // 处理每个字符，识别非十六进制字符
      for (let j = 0; j < processEndIndex; j++) {
        const char = line[j];

        // 检查是否为十六进制字符
        if (hexRegex.test(char)) {
          // 如果当前段是注释，需要创建新的代码段
          if (currentSegment.type === 'comment') {
            if (currentSegment.text) {
              segments.push({ ...currentSegment });
            }
            currentSegment = { text: char, type: 'code' };
          } else {
            // 继续添加到当前代码段
            currentSegment.text += char;
          }
        } else {
          // 非十六进制字符视为注释
          // 如果当前段是代码，需要创建新的注释段
          if (currentSegment.type === 'code') {
            if (currentSegment.text) {
              segments.push({ ...currentSegment });
            }
            currentSegment = { text: char, type: 'comment' };
          } else {
            // 继续添加到当前注释段
            currentSegment.text += char;
          }
        }
      }

      // 添加最后一个处理的段
      if (currentSegment.text) {
        segments.push({ ...currentSegment });
      }

      // 处理//注释
      if (commentIndex !== -1) {
        segments.push({
          text: line.substring(commentIndex),
          type: 'comment',
        });
      }

      parsedLines.push(segments);
    }

    return parsedLines;
  }, []);

  // 生成高亮HTML
  const generateHighlightedHTML = useCallback((parsedLines) => {
    return parsedLines
      .map((line, lineIndex) => {
        const lineContent = line
          .map((segment, segmentIndex) => {
            const className = segment.type === 'comment' ? style.comment : '';
            return `<span class="${className}" data-line="${lineIndex}" data-segment="${segmentIndex}">${segment.text}</span>`;
          })
          .join('');

        return `<div class="${style.codeLine}">${lineContent || ' '}</div>`;
      })
      .join('');
  }, []);

  // 滚动输入框到选中位置
  const scrollTextareaToSelection = useCallback(
    (position) => {
      if (!editorRef.current) return;

      // 获取当前行的位置
      const text = input;
      const lines = text.substr(0, position).split('\n');
      const lineIndex = lines.length - 1;

      // 计算行高（近似值）
      const lineHeight = 20; // 假设每行高度为20px

      // 计算滚动位置，使选中行在视图中间
      const scrollPosition =
        lineIndex * lineHeight -
        editorRef.current.clientHeight / 2 +
        lineHeight;

      // 确保滚动位置在有效范围内
      const maxScroll =
        editorRef.current.scrollHeight - editorRef.current.clientHeight;
      const targetScroll = Math.max(0, Math.min(scrollPosition, maxScroll));

      // 平滑滚动到目标位置
      editorRef.current.scrollTop = targetScroll;
    },
    [input]
  );

  const findByte = useCallback(
    (start, end) => {
      // 遍历byteToInputMap查找与选中范围重叠的字节
      if (!byteToInputMap || !Array.isArray(byteToInputMap)) {
        return null;
      }

      // 遍历每一行
      for (let rowIndex = 0; rowIndex < byteToInputMap.length; rowIndex++) {
        const row = byteToInputMap[rowIndex];
        if (!row) continue;

        // 遍历每个字节
        for (let byteIndex = 0; byteIndex < row.length; byteIndex++) {
          const mapping = row[byteIndex];
          if (!mapping) continue;

          const firstChar = mapping.firstChar;
          const secondChar = mapping.secondChar;

          // 检查第一个字符是否在选中范围内
          if (
            firstChar &&
            firstChar.inputIndex >= start &&
            firstChar.inputIndex < end
          ) {
            return { rowIndex, byteIndex };
          }

          // 检查第二个字符是否在选中范围内
          if (
            secondChar &&
            secondChar.inputIndex >= start &&
            secondChar.inputIndex < end
          ) {
            return { rowIndex, byteIndex };
          }

          // 检查选中范围是否在两个字符之间
          if (
            firstChar &&
            secondChar &&
            firstChar.inputIndex <= start &&
            secondChar.inputIndex >= end - 1
          ) {
            return { rowIndex, byteIndex };
          }
        }
      }
      return null;
    },
    [byteToInputMap]
  );

  // 处理输入框选择事件和光标移动事件
  const handleTextareaSelect = useCallback(
    (e) => {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      setCursorPosition({ start, end });

      if (start === end) {
        // 光标移动到某个位置（没有选择文本）
        const found = findByte(start, start + 1);
        onSelectionInputChange(found);
        return;
      }

      // 选择了文本
      const found = findByte(start, end);
      onSelectionInputChange(found);
    },
    [findByte, onSelectionInputChange]
  );

  // 处理键盘事件，确保方向键移动也能触发高亮
  const handleKeyUp = useCallback(
    (e) => {
      // 只处理方向键、Home、End等导航键
      const navKeys = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
        'PageUp',
        'PageDown',
      ];
      if (navKeys.includes(e.key)) {
        const pos = e.target.selectionStart;
        const found = findByte(pos, pos + 1);
        onSelectionInputChange(found);
        setCursorPosition({ start: pos, end: pos });
      }
    },
    [findByte, onSelectionInputChange]
  );

  // 处理鼠标点击事件
  const handleClick = useCallback(
    (e) => {
      const pos = e.target.selectionStart;
      const found = findByte(pos, pos + 1);
      onSelectionInputChange(found);
      setCursorPosition({ start: pos, end: pos });
    },
    [findByte, onSelectionInputChange]
  );

  // 同步滚动处理
  const handleScroll = useCallback(
    (e) => {
      if (highlightedContentRef.current && textareaRef) {
        highlightedContentRef.current.scrollTop = e.target.scrollTop;
      }
    },
    [textareaRef]
  );

  // 当输入内容变化时，更新高亮显示
  useEffect(() => {
    if (highlightedContentRef.current) {
      const parsedCode = parseCode(input);
      const html = generateHighlightedHTML(parsedCode);
      highlightedContentRef.current.innerHTML = html;
    }
  }, [input, parseCode, generateHighlightedHTML]);

  // 当十六进制字节被选中时，高亮输入框中对应的内容
  useEffect(() => {
    if (!selectedInput || !textareaRef) return;

    const { start, end } = selectedInput;
    textareaRef.focus();
    textareaRef.setSelectionRange(start, end);
    setCursorPosition({ start, end });

    // 滚动输入框到选中位置
    scrollTextareaToSelection(start);
  }, [selectedInput, textareaRef, scrollTextareaToSelection]);

  return (
    <div className={style.inputPanel} ref={editorRef}>
      <div className={style.codeEditorContainer}>
        <div
          className={style.highlightedContent}
          ref={highlightedContentRef}
        ></div>
        <textarea
          ref={setTextareaRef}
          value={input}
          onChange={(e) => {
            onInputChange(e);
            setCursorPosition({
              start: e.target.selectionStart,
              end: e.target.selectionEnd,
            });
          }}
          onSelect={handleTextareaSelect}
          onClick={handleClick}
          onKeyUp={handleKeyUp}
          onScroll={handleScroll}
          placeholder="输入ROP代码..."
          className={style.codeInput}
          spellCheck="false"
        />
      </div>
    </div>
  );
}
