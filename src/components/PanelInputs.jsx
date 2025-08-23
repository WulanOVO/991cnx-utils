import { useState } from 'react';
import style from './PanelInputs.module.scss';

export function Checkbox({ checked, onChange, children }) {
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

export function SliderInput({ label, value, onChange, min, max, step }) {
  return (
    <div className={style['slider-input-container']}>
      <label className={style['slider-label']}>{label}: {value}</label>
      <input
        type="range"
        value={value}
        onChange={(e) => {
          const newValue = parseInt(e.target.value);
          if (!isNaN(newValue) && newValue >= min && newValue <= max) {
            onChange(newValue);
          }
        }}
        min={min}
        max={max}
        step={step}
        className={style['slider-input']}
      />
    </div>
  );
}

export function Button({ onClick, children, className }) {
  return (
    <button className={`${style.button} ${className || ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function ButtonsContainer({ children }) {
  return (
    <div className={style['buttons-container']}>
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className={style['search-container']}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '搜索...'}
        className={style.search}
      />
    </div>
  );
}

export function Input({ value, onChange, label, placeholder }) {
  return (
    <div className={style['input-container']}>
      <label className={style['input-label']}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '输入...'}
        className={style.input}
      />
    </div>
  );
}


export function Select({ value, onChange, options }) {
  return (
    <div className={style['select-container']}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={style.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Panel({ children, className }) {
  return (
    <div className={`${style.panel} ${className || ''}`}>
      {children}
    </div>
  );
}