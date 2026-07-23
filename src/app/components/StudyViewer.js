'use client';

import { useState, useRef, useEffect } from 'react';

const SPEEDS = [0.8, 1.0, 1.25, 1.5];

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ────── 노트 추가 모달 ──────
function NoteModal({ script, onClose, onSave }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await onSave(content.trim());
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">📝 메모 추가</div>
        {script && (
          <div className="modal-subtitle">
            "{script.EnglishText}"
          </div>
        )}
        <textarea
          className="modal-textarea"
          placeholder="이 문장에 대한 메모를 입력하세요..."
          value={content}
          onChange={e => setContent(e.target.value)}
          autoFocus
        />
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!content.trim() || saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────── 오디오 플레이어 ──────
function AudioPlayer({ mp3Url, chapterTitle, scripts, onTimeUpdate }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTime = () => {
      setCurrentTime(audio.currentTime);
      if (onTimeUpdate) onTimeUpdate(audio.currentTime);
    };
    const handleMeta = () => setDuration(audio.duration);
    const handleEnded = () => setPlaying(false);
    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('loadedmetadata', handleMeta);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('loadedmetadata', handleMeta);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const setRate = (r) => {
    setSpeed(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  };

  // seekTo: 항상 최신 audioRef를 참조하도록 ref 패턴 사용
  // (useCallback의 [] 의존성으로 인한 클로저 문제 방지)
  const seekToRef = useRef(null);
  seekToRef.current = (sec) => {
    const audio = audioRef.current;
    if (!audio) return;

    const doSeek = () => {
      audio.currentTime = sec;
      audio.play().catch(() => {});
      setPlaying(true);
    };

    // duration이 정상이면 즉시 탐색, 아직 미로드면 이벤트 대기
    // audio.load()는 절대 호출하지 않음 (처음으로 리셋되기 때문)
    if (isFinite(audio.duration) && audio.duration > 0) {
      doSeek();
    } else {
      audio.addEventListener('loadedmetadata', doSeek, { once: true });
      audio.addEventListener('durationchange', doSeek, { once: true });
    }
  };

  // 마운트/언마운트 시 1번만 등록, 항상 최신 함수를 ref로 호출
  useEffect(() => {
    window.__audioSeekTo = (sec) => seekToRef.current && seekToRef.current(sec);
    return () => { delete window.__audioSeekTo; };
  }, []);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={mp3Url} preload="metadata" />
      <div className="player-top">
        <div className="player-controls">
          <button className="btn-icon" title="뒤로 5초" onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 5; }}>⏪</button>
          <button className="btn-play" onClick={togglePlay} title={playing ? '일시정지' : '재생'}>
            {playing ? '⏸' : '▶'}
          </button>
          <button className="btn-icon" title="앞으로 5초" onClick={() => { if(audioRef.current) audioRef.current.currentTime += 5; }}>⏩</button>
        </div>
        <div className="player-info">
          <div className="player-chapter-name">{chapterTitle}</div>
          <div className="player-time">{formatTime(currentTime)} / {formatTime(duration)}</div>
        </div>
        <div className="speed-btns">
          {SPEEDS.map(r => (
            <button
              key={r}
              className={`speed-btn ${speed === r ? 'active' : ''}`}
              onClick={() => setRate(r)}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
      <div className="player-progress">
        <span className="progress-time">{formatTime(currentTime)}</span>
        <div className="progress-bar-wrap" onClick={seek}>
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-time">{formatTime(duration)}</span>
      </div>
    </div>
  );
}

// ────── 스크립트 뷰어 ──────
function ScriptViewer({ scripts, currentTime, notes, onAddNote }) {
  const speakerColors = {};
  const colorClasses = ['speaker-a', 'speaker-b', 'speaker-other'];
  let colorIdx = 0;

  const getSpeakerClass = (speaker) => {
    if (!speakerColors[speaker]) {
      speakerColors[speaker] = colorClasses[colorIdx % colorClasses.length];
      colorIdx++;
    }
    return speakerColors[speaker];
  };

  const notesByScript = {};
  notes.forEach(n => {
    if (n.ScriptID) notesByScript[n.ScriptID] = true;
  });

  const activeScript = scripts.findIndex(s =>
    currentTime >= (s.AudioStartSecond || 0) &&
    currentTime < (s.AudioEndSecond || Infinity)
  );

  const handleScriptClick = (s) => {
    if (window.__audioSeekTo && s.AudioStartSecond) {
      window.__audioSeekTo(s.AudioStartSecond);
    }
  };

  return (
    <div className="script-area">
      {scripts.map((s, i) => {
        const isActive = i === activeScript;
        const speakerClass = getSpeakerClass(s.Speaker || 'Speaker');
        return (
          <div
            key={s.ScriptID}
            className={`script-line ${isActive ? 'active' : ''}`}
            onClick={() => handleScriptClick(s)}
          >
            <span className={`speaker-badge ${speakerClass}`}>
              {s.Speaker || 'N/A'}
            </span>
            <div className="script-content">
              <div className="script-eng">{s.EnglishText}</div>
              {s.KoreanTranslation && (
                <div className="script-kor">{s.KoreanTranslation}</div>
              )}
            </div>
            <div className="script-actions">
              <button
                className={`btn-note ${notesByScript[s.ScriptID] ? 'has-note' : ''}`}
                title="메모 추가"
                onClick={e => { e.stopPropagation(); onAddNote(s); }}
              >
                {notesByScript[s.ScriptID] ? '📝' : '+'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────── 우측 메모 패널 ──────
function NotesPanel({ chapterId, notes, onNoteAdded, onNoteDeleted }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, content: content.trim() })
      });
      const note = await res.json();
      onNoteAdded(note);
      setContent('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
    onNoteDeleted(noteId);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  };

  return (
    <>
      <div className="note-input-area">
        <textarea
          placeholder="이 챕터에 대한 메모를 추가하세요..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="note-input-footer">
          <button className="btn-save-note" onClick={handleSave} disabled={!content.trim() || saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <div className="empty-title">메모가 없습니다</div>
          <div className="empty-desc">위 입력창에서 메모를 작성하거나, 스크립트 문장을 클릭해 문장별 메모를 추가하세요.</div>
        </div>
      ) : (
        notes.map(note => (
          <div key={note.NoteID} className="note-card">
            <div className="note-card-header">
              <span className="note-card-link">
                {note.ScriptID ? `문장 #${note.ScriptID}` : '챕터 전체 메모'}
              </span>
              <div className="note-card-actions">
                <button className="btn-tiny" title="삭제" onClick={() => handleDelete(note.NoteID)}>✕</button>
              </div>
            </div>
            <div className="note-card-content">{note.Content}</div>
            <div className="note-card-time">{formatDate(note.CreatedAt)}</div>
          </div>
        ))
      )}
    </>
  );
}

// ────── 단어장 패널 ──────
function VocabPanel({ vocabulary }) {
  if (vocabulary.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <div className="empty-title">단어 정보가 없습니다</div>
      </div>
    );
  }
  return (
    <>
      {vocabulary.map(v => (
        <div key={v.VocabID} className="vocab-card">
          <div className="vocab-word">{v.Word}</div>
          <div className="vocab-meaning">{v.Meaning}</div>
          {v.ExampleSentence && (
            <div className="vocab-example">"{v.ExampleSentence}"</div>
          )}
        </div>
      ))}
    </>
  );
}

import SpeakingPractice from './SpeakingPractice';
import WritingPractice from './WritingPractice';

// ────── 메인 학습 뷰어 ──────
export default function StudyViewer({ chapter, onBack, mobileRightPanelOpen, onToggleSidebar, onToggleRightPanel }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [panelTab, setPanelTab] = useState('notes');
  const [studyTab, setStudyTab] = useState('listen'); // 'listen' | 'speak' | 'write'
  const [noteModal, setNoteModal] = useState(null);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!chapter) return;
    setLoading(true);
    fetch(`/api/chapters/${chapter.ChapterID}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setNotes(d.notes || []);
        setLoading(false);
      });
  }, [chapter]);

  const handleAddNote = useCallback(async (script) => {
    setNoteModal(script);
  }, []);

  const handleSaveNoteFromModal = async (content) => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId: chapter.ChapterID,
        scriptId: noteModal?.ScriptID,
        content
      })
    });
    const note = await res.json();
    setNotes(prev => [note, ...prev]);
  };

  const handleNoteAdded = (note) => setNotes(prev => [note, ...prev]);
  const handleNoteDeleted = (noteId) => setNotes(prev => prev.filter(n => n.NoteID !== noteId));

  if (loading) {
    return (
      <>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', gap:16 }}>
          <div className="spinner" />
          <span style={{ color:'var(--text-secondary)' }}>챕터 데이터를 불러오는 중...</span>
        </div>
        <div className="right-panel" />
      </>
    );
  }

  return (
    <>
      <div className="viewer-main">
        {/* 헤더 및 스터디 모드 탭 */}
        <div className="viewer-header">
          <div className="viewer-title">
            <button
              onClick={onBack}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'1.2rem', marginRight:2 }}
              title="뒤로 가기"
            >←</button>

            {/* 모바일/태블릿 챕터 사이드바 토글 단추 */}
            <button
              className="mobile-drawer-btn"
              onClick={onToggleSidebar}
              title="챕터 목록"
            >
              📋 <span>챕터</span>
            </button>

            <span className="chapter-title-text">{data.chapter.Title}</span>
            <span className="viewer-badge">Ch.{chapter.ChapterID}</span>

            {/* 모바일/태블릿 우측 메모/단어장 패널 토글 단추 */}
            <button
              className="mobile-drawer-btn"
              onClick={onToggleRightPanel}
              title="메모 및 단어장"
              style={{ marginLeft: 'auto' }}
            >
              📝 <span>메모</span>
            </button>
          </div>
          <div className="viewer-tabs">
            <button
              className={`viewer-tab ${studyTab === 'listen' ? 'active' : ''}`}
              onClick={() => setStudyTab('listen')}
            >
              🎧 듣기
            </button>
            <button
              className={`viewer-tab ${studyTab === 'speak' ? 'active' : ''}`}
              onClick={() => setStudyTab('speak')}
            >
              🗣️ 말하기
            </button>
            <button
              className={`viewer-tab ${studyTab === 'write' ? 'active' : ''}`}
              onClick={() => setStudyTab('write')}
            >
              ✍️ 쓰기
            </button>
          </div>
        </div>

        {/* 탭 분기 처리 */}
        {studyTab === 'listen' && (
          <>
            {data.chapter.MP3Url && (
              <AudioPlayer
                mp3Url={data.chapter.MP3Url}
                chapterTitle={data.chapter.Title}
                scripts={data.scripts}
                onTimeUpdate={setCurrentTime}
              />
            )}
            <ScriptViewer
              scripts={data.scripts}
              currentTime={currentTime}
              notes={notes}
              onAddNote={handleAddNote}
            />
          </>
        )}

        {studyTab === 'speak' && (
          <SpeakingPractice
            scripts={data.scripts}
            mp3Url={data.chapter.MP3Url}
          />
        )}

        {studyTab === 'write' && (
          <WritingPractice
            scripts={data.scripts}
          />
        )}
      </div>

      {/* 우측 패널 */}
      <div className={`right-panel ${mobileRightPanelOpen ? 'mobile-open' : ''}`}>
        <div className="panel-tabs">
          <button
            className={`panel-tab ${panelTab === 'notes' ? 'active' : ''}`}
            onClick={() => setPanelTab('notes')}
          >📝 메모 ({notes.length})</button>
          <button
            className={`panel-tab ${panelTab === 'vocab' ? 'active' : ''}`}
            onClick={() => setPanelTab('vocab')}
          >📚 단어장 ({data.vocabulary.length})</button>
        </div>
        <div className="panel-content">
          {panelTab === 'notes' ? (
            <NotesPanel
              chapterId={chapter.ChapterID}
              notes={notes}
              onNoteAdded={handleNoteAdded}
              onNoteDeleted={handleNoteDeleted}
            />
          ) : (
            <VocabPanel vocabulary={data.vocabulary} />
          )}
        </div>
      </div>

      {noteModal && (
        <NoteModal
          script={noteModal}
          onClose={() => setNoteModal(null)}
          onSave={handleSaveNoteFromModal}
        />
      )}
    </>
  );
}
