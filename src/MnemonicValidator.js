import React, { useState, useEffect, useRef } from 'react';

const MnemonicValidator = () => {
  const [words, setWords] = useState(Array(12).fill(''));
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [invalidWords, setInvalidWords] = useState(Array(12).fill(false));
  const [wordlist, setWordlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const inputRefs = useRef([]);

  // 加载BIP-39词汇表
  useEffect(() => {
    const loadWordlist = async () => {
      try {
        setIsLoading(true);
        // 从public文件夹加载english.txt
        const response = await fetch('/english.txt');
        const text = await response.text();
        // 拆分文本为单词数组，去除空行
        const words = text.split('\n').filter(word => word.trim().length > 0);
        setWordlist(words);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load wordlist:', error);
        setIsLoading(false);
      }
    };

    loadWordlist();
  }, []);

  useEffect(() => {
    // 初始化inputRefs为正确的长度
    inputRefs.current = inputRefs.current.slice(0, 12);
    // 验证所有单词
    validateWords();
  }, [words, wordlist]);

  const validateWords = () => {
    if (wordlist.length === 0) return;
    
    const newInvalidWords = words.map((word) => {
      if (word.trim() === '') return false;
      return !wordlist.includes(word.toLowerCase());
    });
    
    setInvalidWords(newInvalidWords);
  };

  const handleInputChange = (index, value) => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase();
    setWords(newWords);
    
    // 显示建议
    if (value.trim() && wordlist.length > 0) {
      const filtered = wordlist
        .filter(word => word.startsWith(value.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleInputFocus = (index) => {
    setActiveInput(index);
    // 如果已经有文本，则显示建议
    if (words[index] && wordlist.length > 0) {
      const filtered = wordlist
        .filter(word => word.startsWith(words[index].toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
    }
  };

  const handleInputBlur = () => {
    // 延迟隐藏建议，允许点击它们
    setTimeout(() => {
      setActiveInput(null);
      setSuggestions([]);
    }, 200);
  };

  const selectSuggestion = (word) => {
    if (activeInput !== null) {
      const newWords = [...words];
      newWords[activeInput] = word;
      setWords(newWords);
      setSuggestions([]);
      
      // 如果不是最后一个，则移动到下一个输入框
      if (activeInput < 11) {
        const nextIndex = activeInput + 1;
        inputRefs.current[nextIndex].focus();
        setActiveInput(nextIndex);
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      selectSuggestion(suggestions[0]);
      e.preventDefault();
    } else if (e.key === 'Tab' && !e.shiftKey && index < 11) {
      // 自定义Tab导航
      e.preventDefault();
      const nextIndex = index + 1;
      inputRefs.current[nextIndex].focus();
    } else if (e.key === 'Tab' && e.shiftKey && index > 0) {
      // 自定义Shift+Tab导航
      e.preventDefault();
      const prevIndex = index - 1;
      inputRefs.current[prevIndex].focus();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">加载BIP-39词汇表中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">验证助记词</h2>
      <div className="grid grid-cols-3 gap-4">
        {Array(12).fill().map((_, index) => (
          <div key={index} className="relative">
            <div className="flex items-center">
              <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg mr-2">
                {index + 1}
              </span>
              <input
                ref={el => inputRefs.current[index] = el}
                type="text"
                value={words[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onFocus={() => handleInputFocus(index)}
                onBlur={handleInputBlur}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  invalidWords[index] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="单词"
              />
            </div>
            {activeInput === index && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                <ul>
                  {suggestions.map((suggestion, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-center">
        <button 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => {
            const isValid = !invalidWords.some(invalid => invalid);
            const allFilled = words.every(word => word.trim() !== '');
            if (isValid && allFilled) {
              alert('助记词验证成功!');
            } else {
              alert('请检查并填写所有助记词!');
            }
          }}
        >
          验证
        </button>
      </div>
    </div>
  );
};

export default MnemonicValidator;