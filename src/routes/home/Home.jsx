import { Link } from 'react-router-dom';
import style from './Home.module.scss';

export default function Home() {
  return (
    <div className={style['home-page-container']}>
      <h1>欢迎使用 fx-991CN X 工具集</h1>
      <div className={style['links-container']}>
        <Link to="/tables">实用全标注字符表</Link>
        <Link to="/words">ROM 内置词语表</Link>
        <Link to="/pixel">二进制像素编辑器</Link>
      </div>
    </div>
  );
}