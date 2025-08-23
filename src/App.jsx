import { Routes, Route, Link } from 'react-router-dom';
import style from './App.module.scss';

import Home from '@/routes/home/Home.jsx';
import Tables from '@/routes/tables/Tables.jsx';
import Words from '@/routes/words/Words.jsx';
import PixelEditor from '@/routes/pixel/PixelEditor.jsx';
import RopIDE from '@/routes/rop/RopIDE.jsx';


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
          <Route path="/pixel" element={<PixelEditor />} />
          <Route path="/rop" element={<RopIDE />} />
        </Routes>
      </div>

      <footer className={style['app-footer']}>
        <p>
          &copy; {new Date().getFullYear()} fx-991CN X 工具集 | 保留所有权利
        </p>
        <p>
          特别感谢：
          <a href="https://tieba.baidu.com/home/main?id=tb.1.2062eec0.FwWcq4rwt0_gRZlb9o1EWA">
            CADUO
          </a>
          提供的字体文件！
        </p>
      </footer>
    </div>
  );
}
