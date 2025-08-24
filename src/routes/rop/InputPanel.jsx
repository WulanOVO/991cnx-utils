import { useState, useEffect, useCallback } from 'react';
import style from './RopIDE.module.scss';

export default function InputPanel({
  input,
  onInputChange,
  onSelectionInputChange,
  byteToInputMap,
  selectedInput,
}) {
  const [textareaRef, setTextareaRef] = useState(null);

  // 滚动输入框到选中位置
  const scrollTextareaToSelection = useCallback(
    (position) => {
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
    },
    [textareaRef]
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

  // 处理输入框选择事件
  const handleTextareaSelect = useCallback(
    (e) => {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      if (start === end) {
        onSelectionInputChange(null);
        return;
      }

      const found = findByte(start, end);
      onSelectionInputChange(found);
    },
    [findByte, onSelectionInputChange]
  );

  // 当十六进制字节被选中时，高亮输入框中对应的内容
  useEffect(() => {
    if (!selectedInput || !textareaRef) return;

    const { start, end } = selectedInput;
    textareaRef.focus();
    textareaRef.setSelectionRange(start, end);

    // 滚动输入框到选中位置
    scrollTextareaToSelection(start);
  }, [selectedInput, textareaRef, scrollTextareaToSelection]);

  return (
    <div className={style.inputPanel}>
      <textarea
        ref={setTextareaRef}
        value={input}
        onChange={onInputChange}
        onSelect={handleTextareaSelect}
        placeholder="输入ROP代码..."
        className={style.codeInput}
      />
    </div>
  );
}
