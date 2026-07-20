'use client';

import { useState, useEffect } from 'react';
import StudyViewer from './components/StudyViewer';

// ────── 4단계: 학습 플래너 컴포넌트 ──────
function StudyPlannerCard({ planner, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState([]);
  const [chaptersPerDay, setChaptersPerDay] = useState(1);

  useEffect(() => {
    if (planner) {
      setDays(planner.TargetDays ? planner.TargetDays.split(',') : []);
      setChaptersPerDay(planner.ChaptersPerDay || 1);
    }
  }, [planner]);

  const toggleDay = (day) => {
    if (days.includes(day)) {
      setDays(prev => prev.filter(d => d !== day));
    } else {
      setDays(prev => [...prev, day]);
    }
  };

  const handleSave = async () => {
    await onUpdate({
      targetDays: days.join(','),
      chaptersPerDay
    });
    setEditing(false);
  };

  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '20px 24px', margin: '20px 28px 0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          🗓️ 나의 학습 플래너
        </h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="speed-btn"
            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
          >
            설정 변경
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setEditing(false)}
              className="btn-cancel"
              style={{ padding: '4px 12px', fontSize: '0.75rem' }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="btn-save-note"
              style={{ padding: '4px 12px', fontSize: '0.75rem' }}
            >
              저장
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 40px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>목표 학습 요일</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {days.length > 0 ? days.map(d => (
                <span key={d} style={{
                  fontSize: '0.75rem', background: 'var(--accent-glow)',
                  border: '1px solid var(--accent)', color: 'var(--accent-light)',
                  padding: '2px 8px', borderRadius: 6, fontWeight: 600
                }}>
                  {d}요일
                </span>
              )) : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>설정된 요일 없음</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>하루 목표 학습량</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 6 }}>
              📕 하루에 {chaptersPerDay}개 챕터
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>주간 학습 목표</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 6 }}>
              ✨ 주 {days.length * chaptersPerDay}개 챕터 완독 도전!
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>요일 선택</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {weekdays.map(day => {
                const isSelected = days.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`speed-btn ${isSelected ? 'active' : ''}`}
                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem' }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>하루 학습량:</span>
            <input
              type="number"
              min="1"
              max="12"
              value={chaptersPerDay}
              onChange={e => setChaptersPerDay(parseInt(e.target.value) || 1)}
              style={{
                width: 60, background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 8px', color: 'white', outline: 'none',
                textAlign: 'center', fontSize: '0.85rem'
              }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>개 챕터</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ────── 4단계: 진도 대시보드 컴포넌트 ──────
function ProgressDashboard({ progressList, chapters }) {
  if (!progressList || progressList.length === 0 || chapters.length === 0) return null;

  const totalChapters = chapters.length;
  
  // 완료된 영역 집계
  const listenDoneCount = progressList.filter(p => p.ListenDone).length;
  const speakDoneCount = progressList.filter(p => p.SpeakDone).length;
  const writeDoneCount = progressList.filter(p => p.WriteDone).length;

  const getPercent = (count) => Math.round((count / totalChapters) * 100);

  // 종합 달성률 계산 (각 챕터별 3개 영역 완료 가중치 합산)
  let totalScore = 0;
  progressList.forEach(p => {
    if (p.ListenDone) totalScore += 1;
    if (p.SpeakDone) totalScore += 1;
    if (p.WriteDone) totalScore += 1;
  });
  const overallPercent = Math.round((totalScore / (totalChapters * 3)) * 100);

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '20px 24px', margin: '16px 28px 0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          📊 전체 진도 리포트
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--accent-light)', fontWeight: 700 }}>
          종합 달성률 {overallPercent}%
        </span>
      </div>

      {/* 종합 진도 바 */}
      <div style={{ height: 10, background: 'var(--player-track)', borderRadius: 5, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--success))',
          width: `${overallPercent}%`, borderRadius: 5, transition: 'width 0.4s ease'
        }} />
      </div>

      {/* 영역별 상세 대시보드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: '🎧 듣기 마스터', count: listenDoneCount, color: 'var(--accent)', percent: getPercent(listenDoneCount) },
          { label: '🗣️ 말하기 마스터', count: speakDoneCount, color: 'var(--success)', percent: getPercent(speakDoneCount) },
          { label: '✍️ 쓰기 마스터', count: writeDoneCount, color: 'var(--warning)', percent: getPercent(writeDoneCount) }
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--bg-card)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{item.count} / {totalChapters} ({item.percent}%)</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: item.color, width: `${item.percent}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────── 홈 화면 - 챕터 목록 그리드 ──────
function ChapterListHome({ chapters, progressList, onSelect }) {
  if (!chapters || chapters.length === 0) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="empty-icon">📚</div>
        <div className="empty-title">챕터를 불러오는 중...</div>
      </div>
    );
  }

  const getProgressState = (chapterId) => {
    return progressList.find(p => p.ChapterID === chapterId) || { ListenDone: 0, SpeakDone: 0, WriteDone: 0 };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, padding: '20px 28px 28px' }}>
      {chapters.map((ch) => {
        const prog = getProgressState(ch.ChapterID);
        const doneCount = (prog.ListenDone ? 1 : 0) + (prog.SpeakDone ? 1 : 0) + (prog.WriteDone ? 1 : 0);
        const cardPercent = Math.round((doneCount / 3) * 100);

        return (
          <div
            key={ch.ChapterID}
            onClick={() => onSelect(ch)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px var(--accent-glow)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* 카드 상단 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 700, color: 'white', flexShrink: 0
              }}>
                {ch.ChapterID}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ch.Title}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <span style={{ opacity: prog.ListenDone ? 1 : 0.25 }} title="듣기 완료">🎧</span>
                  <span style={{ opacity: prog.SpeakDone ? 1 : 0.25 }} title="말하기 완료">🗣️</span>
                  <span style={{ opacity: prog.WriteDone ? 1 : 0.25 }} title="쓰기 완료">✍️</span>
                </div>
              </div>
            </div>

            {/* 개별 챕터 진행률 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>챕터 완료율</span>
                <span>{cardPercent}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--success)', width: `${cardPercent}%` }} />
              </div>
            </div>

            {/* 하단 요약 메타데이터 */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: '스크립트', count: ch.ScriptCount, icon: '💬' },
                { label: '단어', count: ch.VocabCount, icon: '📚' },
                { label: '메모', count: ch.NoteCount, icon: '📝' }
              ].map(item => (
                <div key={item.label} style={{
                  flex: 1, background: 'var(--bg-secondary)', borderRadius: 8,
                  padding: '6px 4px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.85rem' }}>{item.icon}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.count}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────── 메인 앱 ──────
export default function Home() {
  const [chapters, setChapters] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [planner, setPlanner] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [chRes, progRes, planRes] = await Promise.all([
        fetch('/api/chapters'),
        fetch('/api/progress'),
        fetch('/api/planner')
      ]);

      const [chData, progData, planData] = await Promise.all([
        chRes.json(),
        progRes.json(),
        planRes.json()
      ]);

      setChapters(chData);
      setProgressList(progData);
      setPlanner(planData);
    } catch (e) {
      console.error('데이터 조회 오류:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectChapter = (ch) => setSelectedChapter(ch);
  
  const handleBack = () => {
    setSelectedChapter(null);
    fetchData(); // 홈으로 돌아올 때 최신 데이터 리프레시
  };

  const handleUpdatePlanner = async (updatedData) => {
    const res = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    const data = await res.json();
    setPlanner(data);
  };

  const handleToggleProgress = async (chapterId, type, currentVal) => {
    const targetProg = progressList.find(p => p.ChapterID === chapterId) || {
      ListenDone: false, SpeakDone: false, WriteDone: false
    };

    const updatePayload = {
      chapterId,
      listenDone: type === 'listen' ? !currentVal : targetProg.ListenDone,
      speakDone: type === 'speak' ? !currentVal : targetProg.SpeakDone,
      writeDone: type === 'write' ? !currentVal : targetProg.WriteDone
    };

    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    const updated = await res.json();

    setProgressList(prev => prev.map(p => p.ChapterID === chapterId ? updated : p));
  };

  return (
    <div className="app-shell">
      {/* 네비게이션 바 */}
      <nav className="navbar">
        <div className="navbar-logo" onClick={handleBack} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">🎓</div>
          <span>Biz<span>English</span></span>
          <span className="navbar-subtitle">Business Language To Go</span>
        </div>

        {selectedChapter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>현재 학습 중:</span>
            <span style={{
              fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-light)',
              background: 'var(--accent-glow)', padding: '4px 12px', borderRadius: 8
            }}>
              Ch.{selectedChapter.ChapterID} {selectedChapter.Title}
            </span>
          </div>
        )}

        {!selectedChapter && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              총 {chapters.length}개 챕터
            </span>
            <div style={{
              background: 'var(--accent-glow)', border: '1px solid var(--accent)',
              borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 600
            }}>
              진도 학습 시스템 ✓
            </div>
          </div>
        )}
      </nav>

      {/* 메인 컨텐츠 영역 */}
      {selectedChapter ? (
        // 학습 뷰어: 3-column 레이아웃
        <div className="main-layout">
          {/* 좌측: 챕터 사이드바 */}
          <div className="chapter-sidebar">
            <div style={{ padding: '0 20px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="sidebar-title" style={{ padding: 0 }}>학습 영역 체크</div>
              
              {/* 현재 챕터 영역별 진행률 직접 토글 체크 박스 */}
              {(() => {
                const currentProg = progressList.find(p => p.ChapterID === selectedChapter.ChapterID) || {
                  ListenDone: false, SpeakDone: false, WriteDone: false
                };

                return (
                  <div style={{
                    background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12
                  }}>
                    {[
                      { type: 'listen', label: '🎧 듣기 완료', val: currentProg.ListenDone },
                      { type: 'speak', label: '🗣️ 말하기 완료', val: currentProg.SpeakDone },
                      { type: 'write', label: '✍️ 쓰기 완료', val: currentProg.WriteDone }
                    ].map(item => (
                      <label key={item.type} style={{
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem',
                        color: item.val ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: 'pointer', userSelect: 'none'
                      }}>
                        <input
                          type="checkbox"
                          checked={item.val}
                          onChange={() => handleToggleProgress(selectedChapter.ChapterID, item.type, item.val)}
                          style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="sidebar-title">챕터 목록</div>
            {chapters.map(ch => {
              const chProg = progressList.find(p => p.ChapterID === ch.ChapterID) || { ListenDone: false, SpeakDone: false, WriteDone: false };
              const totalDone = (chProg.ListenDone ? 1 : 0) + (chProg.SpeakDone ? 1 : 0) + (chProg.WriteDone ? 1 : 0);

              return (
                <div
                  key={ch.ChapterID}
                  className={`chapter-item ${ch.ChapterID === selectedChapter.ChapterID ? 'active' : ''}`}
                  onClick={() => setSelectedChapter(ch)}
                >
                  <div className="chapter-num">{ch.ChapterID}</div>
                  <div className="chapter-meta">
                    <div className="chapter-name">{ch.Title}</div>
                    <div className="chapter-stats">
                      💬 {ch.ScriptCount} · 📚 {ch.VocabCount}
                    </div>
                  </div>
                  {/* 완료 개수에 따라 진도 뱃지 색 변화 */}
                  <div
                    className={`chapter-status ${totalDone === 3 ? 'done' : ''}`}
                    style={{
                      background: totalDone === 3 ? 'var(--success)' : totalDone > 0 ? 'var(--warning)' : 'var(--border)'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* 중앙+우측: StudyViewer */}
          <StudyViewer chapter={selectedChapter} onBack={handleBack} />
        </div>
      ) : (
        // 홈 화면: 플래너 + 대시보드 + 그리드
        <div style={{ overflowY: 'auto' }}>
          <div style={{ padding: '28px 28px 0' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              학습 챕터 선택 📚
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              개인 맞춤형 학습 요일 계획을 수립하고, 영역별 진도 상황을 시각화 대시보드로 확인하며 학습하세요.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
              <div className="spinner" />
              <span style={{ color: 'var(--text-secondary)' }}>정보를 불러오는 중...</span>
            </div>
          ) : (
            <>
              {/* 학습 플래너 설정 */}
              <StudyPlannerCard planner={planner} onUpdate={handleUpdatePlanner} />
              
              {/* 진도 상태 리포트 */}
              <ProgressDashboard progressList={progressList} chapters={chapters} />

              {/* 12개 챕터 그리드 */}
              <ChapterListHome chapters={chapters} progressList={progressList} onSelect={handleSelectChapter} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
