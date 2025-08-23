import { useState, useEffect } from 'react';
import style from './Words.module.scss';
import builtInWords from '@/data/built-in-words.json';
import twoByteChars from '@/data/2-byte-chars.json';
import { Checkbox, Panel, SearchInput } from '@/components/PanelInputs';

function WordsPanel({ searchTerm, setSearchTerm, sortByAddress, setSortByAddress }) {
  return (
    <Panel>
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="搜索内容..."
      />

      <Checkbox
        checked={sortByAddress}
        onChange={(checked) => setSortByAddress(checked)}
      >
        按地址排序
      </Checkbox>
    </Panel>
  );
}

function TableRow({
  address,
  content,
  searchTerm,
  selectedChar,
  setSelectedChar,
  onCharClick,
}) {
  const [needSpans, setNeedSpans] = useState(false);

  useEffect(() => {
    setNeedSpans(searchTerm !== '');
  }, [searchTerm]);

  const handleMouseEnter = () => {
    if (searchTerm === '') {
      setNeedSpans(true);
    }
  };

  const handleMouseLeave = () => {
    setSelectedChar(null);
    if (searchTerm === '') {
      setNeedSpans(false);
    }
  };

  return (
    <tr>
      <td>
        <div className={style['address-cell']}>
          <span>{address}</span>
          {selectedChar && selectedChar.wordAddress === address && (
            <span className={style['char-address']}>
              {selectedChar.charAddress}
            </span>
          )}
        </div>
      </td>

      <td onMouseLeave={handleMouseLeave}>
        {needSpans ? (
          [...content].map((char, charIndex) => {
            const isSelected =
              selectedChar &&
              selectedChar.wordAddress === address &&
              selectedChar.charIndex === charIndex;

            let charContent = char;
            if (
              !isSelected &&
              searchTerm &&
              searchTerm.toLowerCase().includes(char.toLowerCase())
            ) {
              charContent = <span className={style.highlight}>{char}</span>;
            }

            return (
              <span
                key={charIndex}
                className={isSelected ? style['selected-char'] : ''}
                onMouseDown={() => onCharClick(charIndex, address, content)}
              >
                {charContent}
              </span>
            );
          })
        ) : (
          <div onMouseEnter={handleMouseEnter}>{content}</div>
        )}
      </td>
    </tr>
  );
}

function WordsTable({ words, searchTerm, sortByAddress }) {
  const [selectedChar, setSelectedChar] = useState(null);
  const filteredWords = words.filter((word) => {
    const content = word[1];
    return content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortByAddress) {
      // 按地址排序
      return a[0].localeCompare(b[0]);
    } else {
      // 按内容先长度后字符（原始排序）
      if (a[1].length !== b[1].length) {
        return a[1].length - b[1].length;
      }
      return a[1].localeCompare(b[1]);
    }
  });

  const handleCharClick = (charIndex, wordAddress, wordContent) => {
    let offset = 0;
    for (let i = 0; i < charIndex; i++) {
      offset += twoByteChars.includes(Array.from(wordContent)[i]) ? 2 : 1;
    }

    const charAddressValue = parseInt(wordAddress, 16) + offset;
    const charAddress = `0x${charAddressValue
      .toString(16)
      .toUpperCase()
      .padStart(4, '0')}`;

    setSelectedChar({
      wordAddress,
      charIndex,
      charAddress,
    });
  };

  return (
    <div
      className={style['table-container']}
      onMouseLeave={() => setSelectedChar(null)}
    >
      <table className={style.table}>
        <thead>
          <tr>
            <th>地址</th>
            <th>内容</th>
          </tr>
        </thead>
        <tbody>
          {sortedWords.map((word, index) => {
            const address = word[0];
            const content = word[1];

            return (
              <TableRow
                key={index}
                address={address}
                content={content}
                searchTerm={searchTerm}
                selectedChar={selectedChar}
                setSelectedChar={setSelectedChar}
                onCharClick={handleCharClick}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Words() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortByAddress, setSortByAddress] = useState(false);
  const [words, setWords] = useState(builtInWords);

  return (
    <div className='page-container'>
      <h1>ROM 内置词语表</h1>
      <WordsPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortByAddress={sortByAddress}
        setSortByAddress={setSortByAddress}
      />
      <WordsTable
        words={words}
        searchTerm={searchTerm}
        sortByAddress={sortByAddress}
      />
    </div>
  );
}
