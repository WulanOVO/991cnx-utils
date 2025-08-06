import { Routes, Route, Link } from 'react-router-dom';
import style from './App.module.scss';

import Home from '@/routes/home/Home.jsx';
import Tables from '@/routes/tables/Tables.jsx';
import Words from '@/routes/words/Words.jsx';

export default function App() {
  return (
    <div className={style['app-container']}>
      <div className={style['app-header']}>
        <Link to="/" className={style['logo']}>
          <h1>fx-991CN X 工具集</h1>
        </Link>
      </div>

      <div className={style['content-container']}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/words" element={<Words />} />
        </Routes>
      </div>

      <footer className={style['app-footer']}>
        <p>
          &copy; {new Date().getFullYear()} fx-991CN X 工具集 | 保留所有权利
        </p>
      </footer>
    </div>
  );
}
