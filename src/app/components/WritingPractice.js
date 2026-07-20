'use client';

import { useState } from 'react';

// 간단한 단어 차이 검사(diff) 및 하이라이트 표시 헬퍼 함수
function diffWords(original, typed) {
  // 소문자 및 기본 문장부호 제거 후 공백 단위 단어 분할
  const clean = (str) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/).filter(Boolean);
  
  const origWords = clean(original);
  const typedWords = clean(typed);

  return origWords.map((word, idx) => {
    const typedWord = typedWords[idx];
    const isCorrect = typedWord && word === typedWord;
    
    return {
      word: word,
      typed: typedWord || '',
      isCorrect: isCorrect
    };
  });
}

export default function WritingPractice({ scripts }) {
  const [typedTexts, setTypedTexts] = useState({}); // { scriptId: text }
  const [submitted, setSubmitted] = useState({}); // { scriptId: boolean }

  const handleInputChange = (scriptId, val) => {
    setTypedTexts(prev => ({ ...prev, [scriptId]: val }));
  };

  const handleKeyPress = (e, scriptId) => {
    if (e.key === 'Enter') {
      setSubmitted(prev => ({ ...prev, [scriptId]: true }));
    }
  };

  const handleCheck = (scriptId) => {
    setSubmitted(prev => ({ ...prev, [scriptId]: true }));
  };

  const handleReset = (scriptId) => {
    setTypedTexts(prev => ({ ...prev, [scriptId]: '' }));
    setSubmitted(prev => ({ ...prev, [scriptId]: false }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '16px 28px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        fontSize: '0.85rem', color: 'var(--text-secondary)', flexShrink: 0
      }}>
        💡 제공된 한국어 해석을 확인한 뒤 영어 문장을 직접 타이핑하고 **Enter** 또는 **확인**을 눌러 일치도를 점검하세요.
      </div>

      <div className="script-area" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        {scripts.map((s, idx) => {
          const isSubmitted = !!submitted[s.ScriptID];
          const typedText = typedTexts[s.ScriptID] || '';
          const diffResults = isSubmitted ? diffWords(s.EnglishText, typedText) : [];
          
          // 정확도 산출
          const correctCount = diffResults.filter(r => r.isCorrect).length;
          const accuracy = diffResults.length ? Math.round((correctCount / diffResults.length) * 100) : 0;

          return (
            <div
              key={s.ScriptID}
              className="script-line"
              style={{
                display: 'flex', flexDirection: 'column', gap: 12, padding: '18px',
                cursor: 'default', background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, marginBottom: 12
              }}
            >
              {/* 발화자 및 정확도 라벨 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className="speaker-badge speaker-other">
                  문장 {idx + 1} ({s.Speaker})
                </span>

                {isSubmitted && (
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700,
                    color: accuracy === 100 ? 'var(--success)' : accuracy >= 70 ? 'var(--warning)' : 'var(--danger)',
                    background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 8
                  }}>
                    🎯 일치율: {accuracy}%
                  </span>
                )}
              </div>

              {/* 번역 텍스트 제시 */}
              <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                💡 번역: {s.KoreanTranslation || '번역 정보 없음'}
              </div>

              {/* 영어 영작 인풋 창 */}
              {!isSubmitted ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="영어 문장을 여기에 입력하세요..."
                    value={typedText}
                    onChange={e => handleInputChange(s.ScriptID, e.target.value)}
                    onKeyDown={e => handleKeyPress(e, s.ScriptID)}
                    style={{
                      flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 14px', color: 'white', outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  />
                  <button
                    onClick={() => handleCheck(s.ScriptID)}
                    disabled={!typedText.trim()}
                    className="btn-save-note"
                    style={{ padding: '0 20px', borderRadius: 8 }}
                  >
                    확인
                  </button>
                </div>
              ) : (
                /* 영작 결과 확인 피드백 피드 */
                <div style={{
                  background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  {/* 입력 내용과 비교된 실시간 피드백 */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>내 입력:</div>
                    <div style={{ fontSize: '0.88rem', display: 'flex', flexWrap: 'wrap', gap: '4px 6px' }}>
                      {diffResults.map((r, rIdx) => (
                        <span
                          key={rIdx}
                          style={{
                            color: r.isCorrect ? 'var(--success)' : 'var(--danger)',
                            textDecoration: r.isCorrect ? 'none' : 'line-through',
                            fontWeight: 500
                          }}
                        >
                          {r.typed || `[${r.word}]`}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 정답 원문 */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>영어 원문:</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                      {s.EnglishText}
                    </div>
                  </div>

                  {/* 초기화 / 다시쓰기 버튼 */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      onClick={() => handleReset(s.ScriptID)}
                      className="btn-cancel"
                      style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                    >
                      다시 쓰기
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
