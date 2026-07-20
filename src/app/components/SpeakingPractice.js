'use client';

import { useState, useRef, useEffect } from 'react';

export default function SpeakingPractice({ scripts, mp3Url }) {
  const [speakers, setSpeakers] = useState([]);
  const [selectedRole, setSelectedRole] = useState(''); // 'all' or specific speaker
  const [roleAssigned, setRoleAssigned] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeScriptIdx, setActiveScriptIdx] = useState(-1);
  const [recordings, setRecordings] = useState({}); // { scriptId: blobUrl }
  const [isRecording, setIsRecording] = useState(false);
  const [recordingScriptId, setRecordingScriptId] = useState(null);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 고유 스피커 목록 추출
  useEffect(() => {
    const list = [...new Set(scripts.map(s => s.Speaker).filter(Boolean))];
    setSpeakers(list);
    if (list.length > 0) {
      setSelectedRole(list[0]);
    }
  }, [scripts]);

  // 재생 상태 관리 및 롤플레잉 자동 멈춤 체크
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      // 현재 재생 대상 문장 탐색
      const idx = scripts.findIndex(
        s => time >= (s.AudioStartSecond || 0) && time < (s.AudioEndSecond || Infinity)
      );

      if (idx !== -1 && idx !== activeScriptIdx) {
        setActiveScriptIdx(idx);
        const currentScript = scripts[idx];

        // 롤플레잉 모드: 내가 말할 차례가 되면 오디오 자동 정지
        if (selectedRole && currentScript.Speaker === selectedRole && isPlaying) {
          audio.pause();
          setIsPlaying(false);
          // 녹음 활성화를 위해 문장 ID 표시
          setRecordingScriptId(currentScript.ScriptID);
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [scripts, activeScriptIdx, selectedRole, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      setRecordingScriptId(null);
    }
  };

  // 녹음 시작
  const startRecording = async (scriptId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordings(prev => ({ ...prev, [scriptId]: audioUrl }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingScriptId(scriptId);
    } catch (err) {
      alert('마이크 접근 권한이 필요합니다: ' + err.message);
    }
  };

  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setRoleAssigned(true);
    // 상태 초기화
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setActiveScriptIdx(-1);
    setRecordingScriptId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <audio ref={audioRef} src={`/api/audio?url=${encodeURIComponent(mp3Url)}`} />

      {/* 역할 설정 헤더 */}
      <div style={{
        padding: '16px 28px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>연습할 배역 선택:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {speakers.map(role => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className={`speed-btn ${selectedRole === role ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                👤 {role} 역할
              </button>
            ))}
          </div>
        </div>

        {selectedRole && (
          <button className="btn-play" onClick={togglePlay} style={{ width: 40, height: 40, fontSize: 16 }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
        )}
      </div>

      {/* 롤플레잉 대화 스크립트 목록 */}
      <div className="script-area" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        {scripts.map((s, idx) => {
          const isMyTurn = s.Speaker === selectedRole;
          const isActive = idx === activeScriptIdx;
          const hasRecording = !!recordings[s.ScriptID];

          return (
            <div
              key={s.ScriptID}
              className={`script-line ${isActive ? 'active' : ''}`}
              style={{
                background: isMyTurn ? 'rgba(91,108,249,0.05)' : 'transparent',
                borderColor: isMyTurn ? 'rgba(91,108,249,0.2)' : 'transparent',
                display: 'flex', flexDirection: 'column', gap: 10, padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className={`speaker-badge ${isMyTurn ? 'speaker-a' : 'speaker-other'}`}>
                  {s.Speaker} {isMyTurn && ' (나의 역할)'}
                </span>
                
                {/* 롤플레잉 인터랙티브 제어 */}
                {isMyTurn && (
                  <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                    {isRecording && recordingScriptId === s.ScriptID ? (
                      <button
                        onClick={stopRecording}
                        className="btn-save-note"
                        style={{ background: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        ⏹ 녹음 중단
                      </button>
                    ) : (
                      <button
                        onClick={() => startRecording(s.ScriptID)}
                        className="btn-save-note"
                        style={{ background: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        🎙️ {hasRecording ? '재녹음' : '녹음하기'}
                      </button>
                    )}

                    {hasRecording && (
                      <audio
                        src={recordings[s.ScriptID]}
                        controls
                        style={{ height: 32, width: 180, outline: 'none' }}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="script-content" style={{ paddingLeft: 0 }}>
                <div className="script-eng" style={{
                  color: isMyTurn && !isActive ? 'var(--accent-light)' : 'var(--text-primary)'
                }}>{s.EnglishText}</div>
                {s.KoreanTranslation && (
                  <div className="script-kor">{s.KoreanTranslation}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
