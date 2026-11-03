import React, { useState, useEffect, useRef } from 'react';

export default function VideoTrimModal({
  isOpen,
  videoFile,
  lang = 'ar',
  onClose,
  onTrimComplete
}) {
  const isAr = lang === 'ar';

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const animFrameRef = useRef(null);

  const [videoUrl, setVideoUrl] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const [trimError, setTrimError] = useState('');
  const [muteAudio, setMuteAudio] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load video file into blob URL
  useEffect(() => {
    if (!videoFile) return;

    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    setIsLoaded(false);
    setTrimError('');
    setIsTrimming(false);
    setIsPlayingPreview(false);
    setTrimProgress(0);

    return () => {
      URL.revokeObjectURL(url);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [videoFile]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    const dur = Math.round(video.duration * 10) / 10;
    setTotalDuration(dur);
    setStartTime(0);
    // Max 10 seconds window by default
    const initialEnd = Math.min(10, dur);
    setEndTime(initialEnd);
    setCurrentTime(0);
    setIsLoaded(true);
  };

  // Keep track of playback time during preview
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    // If preview is playing and reaches endTime, pause and loop back to startTime
    if (isPlayingPreview && video.currentTime >= endTime) {
      video.pause();
      video.currentTime = startTime;
      setIsPlayingPreview(false);
    }
  };

  // Change Start Time
  const handleStartTimeChange = (val) => {
    const newStart = Math.max(0, Math.min(parseFloat(val) || 0, Math.max(0, totalDuration - 0.5)));
    setStartTime(Math.round(newStart * 10) / 10);

    // Enforce max 10 seconds window and end > start
    let newEnd = endTime;
    if (newEnd <= newStart) {
      newEnd = Math.min(totalDuration, newStart + 1);
    } else if (newEnd - newStart > 10) {
      newEnd = Math.min(totalDuration, newStart + 10);
    }
    setEndTime(Math.round(newEnd * 10) / 10);

    // Seek preview video to start point
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
      setCurrentTime(newStart);
      if (isPlayingPreview) {
        videoRef.current.pause();
        setIsPlayingPreview(false);
      }
    }
  };

  // Change End Time
  const handleEndTimeChange = (val) => {
    const newEnd = Math.min(totalDuration, Math.max(0.5, parseFloat(val) || 0));
    setEndTime(Math.round(newEnd * 10) / 10);

    // Enforce max 10s window and end > start
    let newStart = startTime;
    if (newEnd <= newStart) {
      newStart = Math.max(0, newEnd - 1);
    } else if (newEnd - newStart > 10) {
      newStart = Math.max(0, newEnd - 10);
    }
    setStartTime(Math.round(newStart * 10) / 10);

    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
      setCurrentTime(newStart);
      if (isPlayingPreview) {
        videoRef.current.pause();
        setIsPlayingPreview(false);
      }
    }
  };

  // Quick preset button click (e.g. 3s, 5s, 10s)
  const applyPresetDuration = (targetSecs) => {
    const desiredSecs = Math.min(10, targetSecs);
    let newEnd = startTime + desiredSecs;
    let newStart = startTime;

    if (newEnd > totalDuration) {
      newEnd = totalDuration;
      newStart = Math.max(0, totalDuration - desiredSecs);
    }

    setStartTime(Math.round(newStart * 10) / 10);
    setEndTime(Math.round(newEnd * 10) / 10);

    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
      setCurrentTime(newStart);
      if (isPlayingPreview) {
        videoRef.current.pause();
        setIsPlayingPreview(false);
      }
    }
  };

  // Toggle preview play/pause
  const togglePlayPreview = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlayingPreview) {
      video.pause();
      setIsPlayingPreview(false);
    } else {
      video.currentTime = startTime;
      video.muted = muteAudio;
      video.play()
        .then(() => setIsPlayingPreview(true))
        .catch(err => console.warn('Preview play failed:', err));
    }
  };

  // Format seconds to mm:ss.s
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00.0';
    const mins = Math.floor(secs / 60);
    const remSecs = (secs % 60).toFixed(1);
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secsStr = parseFloat(remSecs) < 10 ? `0${remSecs}` : `${remSecs}`;
    return `${minsStr}:${secsStr}`;
  };

  const clipDuration = Math.max(0.1, Math.round((endTime - startTime) * 10) / 10);

  // --- Client-Side Video Trimmer Engine ---
  const handleStartTrim = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (clipDuration > 10.05) {
      setTrimError(
        isAr 
          ? '⚠️ مدة المقطع تتجاوز 10 ثوانٍ. يرجى تقليص المقطع إلى 10 ثوانٍ كحد أقصى.'
          : '⚠️ La durée sélectionnée dépasse 10 secondes. Veuillez réduire l\'intervalle.'
      );
      return;
    }

    setIsTrimming(true);
    setTrimProgress(0);
    setTrimError('');
    setIsPlayingPreview(false);
    video.pause();

    try {
      // Find supported mime type
      const candidates = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      let chosenMime = '';
      if (typeof window !== 'undefined' && window.MediaRecorder) {
        for (const candidate of candidates) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidate)) {
            chosenMime = candidate;
            break;
          }
        }
      }

      if (!chosenMime && !window.MediaRecorder) {
        throw new Error(isAr ? 'المتصفح لا يدعم تسجيل وتقطيع الفيديو مباشرة.' : 'Ce navigateur ne supporte pas l\'enregistrement vidéo direct.');
      }

      // Seek video to exact start
      video.currentTime = startTime;
      video.muted = muteAudio;

      await new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });

      // Acquire MediaStream
      let stream = null;
      let usingCanvas = false;

      if (typeof video.captureStream === 'function') {
        try {
          stream = video.captureStream();
        } catch (e) {
          console.warn('video.captureStream() not supported, falling back to canvas', e);
        }
      } else if (typeof video.mozCaptureStream === 'function') {
        try {
          stream = video.mozCaptureStream();
        } catch (e) {}
      }

      // If video captureStream is unavailable, fallback to canvas captureStream
      if (!stream) {
        usingCanvas = true;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 720;
        stream = canvas.captureStream(30);
      }

      // If audio is muted by user, disable audio tracks
      if (muteAudio && stream) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: chosenMime || undefined,
        videoBitsPerSecond: 2500000 // 2.5 Mbps crisp mobile quality
      });
      mediaRecorderRef.current = recorder;

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        const trimmedBlob = new Blob(chunks, { type: chosenMime || 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            onTrimComplete(reader.result, clipDuration);
          } else {
            setTrimError(isAr ? 'حدث خطأ أثناء حفظ الفيديو المقصوص.' : 'Erreur lors de la sauvegarde de la vidéo découpée.');
            setIsTrimming(false);
          }
        };
        reader.readAsDataURL(trimmedBlob);
      };

      recorder.onerror = (err) => {
        console.error('MediaRecorder error:', err);
        setTrimError(isAr ? 'تعذر إتمام عملية قص الفيديو.' : 'Échec du découpage vidéo.');
        setIsTrimming(false);
      };

      // Start recording with 100ms chunk slices
      recorder.start(100);

      // Play video to record frames
      await video.play();

      // If using canvas fallback, render each frame
      if (usingCanvas) {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const renderFrame = () => {
          if (video && !video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            animFrameRef.current = requestAnimationFrame(renderFrame);
          }
        };
        renderFrame();
      }

      // Progress monitor and auto-stop when endTime reached
      const totalTrimMs = clipDuration * 1000;
      const trimStartWallClock = Date.now();

      progressIntervalRef.current = setInterval(() => {
        const elapsedSecs = Math.max(0, video.currentTime - startTime);
        const pct = Math.min(99, Math.round((elapsedSecs / clipDuration) * 100));
        setTrimProgress(pct);

        // Safety wall-clock check or video position check
        const wallElapsedMs = Date.now() - trimStartWallClock;
        if (video.currentTime >= endTime || video.ended || wallElapsedMs >= (totalTrimMs + 1500)) {
          clearInterval(progressIntervalRef.current);
          setTrimProgress(100);
          video.pause();
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }
      }, 50);

    } catch (err) {
      console.error('Trimming error:', err);
      setTrimError(
        isAr 
          ? `تعذر قص الفيديو تلقائياً: ${err.message || 'خطأ في المعالجة'}`
          : `Échec du découpage : ${err.message || 'Erreur de traitement'}`
      );
      setIsTrimming(false);
    }
  };

  const handleCancelTrim = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsTrimming(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        direction: isAr ? 'rtl' : 'ltr'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isTrimming) {
          handleCancelTrim();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(212, 175, 55, 0.15)',
          color: '#f8fafc',
          padding: '24px',
          position: 'relative'
        }}
      >
        {/* Hidden Canvas for fallback frame extraction */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>✂️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>
                {isAr ? 'أداة قص وتقصير الفيديو' : 'Découpage de la Vidéo'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                {isAr ? 'تحديد مقطع بمدة أقصاها 10 ثوانٍ للنشر السريع' : 'Sélectionnez un extrait de 10 secondes maximum'}
              </p>
            </div>
          </div>
          {!isTrimming && (
            <button
              type="button"
              onClick={handleCancelTrim}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Info Banner */}
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '0.82rem',
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⏱️</span>
          <span>
            {isAr
              ? `الفيديو الأصلي مدته (${totalDuration} ثانية). معايير المنصة تشترط 10 ثوانٍ كحد أقصى.`
              : `La vidéo originale dure ${totalDuration}s. La durée maximale autorisée est de 10 secondes.`}
          </span>
        </div>

        {/* Video Player Preview */}
        <div
          style={{
            position: 'relative',
            background: '#020617',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '220px',
            maxHeight: '320px'
          }}
        >
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              playsInline
              style={{
                width: '100%',
                maxHeight: '300px',
                objectFit: 'contain',
                borderRadius: '12px'
              }}
            />
          )}

          {/* Overlay Controls */}
          {isLoaded && !isTrimming && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                right: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '30px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <button
                type="button"
                onClick={togglePlayPreview}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #aa771c 100%)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isPlayingPreview ? (isAr ? '⏸️ إيقاف' : '⏸️ Pause') : (isAr ? '▶️ معاينة المقطع' : '▶️ Aperçu')}
              </button>

              <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700, direction: 'ltr' }}>
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>
            </div>
          )}

          {/* Trimming Overlay with Progress Bar */}
          {isTrimming && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.92)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                zIndex: 10
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px', animation: 'spin 1.5s linear infinite' }}>
                ⏳
              </div>
              <h4 style={{ margin: '0 0 8px', color: '#fbbf24', fontSize: '1rem', fontWeight: 800 }}>
                {isAr ? `جاري قص وتجهيز الفيديو... ${trimProgress}%` : `Découpage de la vidéo en cours... ${trimProgress}%`}
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: '#94a3b8' }}>
                {isAr ? 'يتم استخراج المقطع المحدد بجودة عالية، يرجى الانتظار...' : 'Traitement en cours, veuillez patienter quelques secondes...'}
              </p>
              {/* Progress bar */}
              <div
                style={{
                  width: '80%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${trimProgress}%`,
                    background: 'linear-gradient(90deg, #d4af37, #f59e0b)',
                    transition: 'width 0.1s ease',
                    borderRadius: '10px'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Trim Timeline & Controls */}
        {isLoaded && !isTrimming && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            
            {/* Visual Timeline Bar */}
            <div
              style={{
                position: 'relative',
                height: '36px',
                background: '#1e293b',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {/* Active clip window highlight */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: totalDuration > 0 ? `${(startTime / totalDuration) * 100}%` : '0%',
                  width: totalDuration > 0 ? `${((endTime - startTime) / totalDuration) * 100}%` : '100%',
                  background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.35), rgba(245, 158, 11, 0.45))',
                  borderLeft: '3px solid #fbbf24',
                  borderRight: '3px solid #fbbf24',
                  boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
                }}
              />

              {/* Current playhead cursor */}
              {totalDuration > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${(currentTime / totalDuration) * 100}%`,
                    width: '2px',
                    background: '#fff',
                    boxShadow: '0 0 6px #fff',
                    zIndex: 2,
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Labels on Timeline */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0 8px',
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  direction: 'ltr',
                  zIndex: 3,
                  pointerEvents: 'none',
                  fontWeight: 600
                }}
              >
                <span>{formatTime(startTime)}</span>
                <span style={{ color: '#fbbf24', fontWeight: 800 }}>
                  ⏱️ {clipDuration}s ({isAr ? 'المقطع المختار' : 'Sélection'})
                </span>
                <span>{formatTime(endTime)}</span>
              </div>
            </div>

            {/* Range Scrubber: Start Time */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                  {isAr ? '📍 نقطة البداية :' : '📍 Début de l\'extrait :'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleStartTimeChange(startTime - 0.5)}
                    style={microBtnStyle}
                  >
                    -0.5s
                  </button>
                  <span style={{ fontWeight: 800, color: '#fbbf24', direction: 'ltr', minWidth: '55px', textAlign: 'center' }}>
                    {formatTime(startTime)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartTimeChange(startTime + 0.5)}
                    style={microBtnStyle}
                  >
                    +0.5s
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, totalDuration - 0.5)}
                step="0.1"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                style={sliderStyle}
              />
            </div>

            {/* Range Scrubber: End Time */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                  {isAr ? '🏁 نقطة النهاية :' : '🏁 Fin de l\'extrait :'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleEndTimeChange(endTime - 0.5)}
                    style={microBtnStyle}
                  >
                    -0.5s
                  </button>
                  <span style={{ fontWeight: 800, color: '#fbbf24', direction: 'ltr', minWidth: '55px', textAlign: 'center' }}>
                    {formatTime(endTime)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEndTimeChange(endTime + 0.5)}
                    style={microBtnStyle}
                  >
                    +0.5s
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max={totalDuration}
                step="0.1"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                style={sliderStyle}
              />
            </div>

            {/* Quick Presets & Audio Option */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {isAr ? 'مدة سريعة:' : 'Raccourcis:'}
                </span>
                {[3, 5, 8, 10].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applyPresetDuration(s)}
                    style={{
                      background: clipDuration === s ? '#d4af37' : 'rgba(255, 255, 255, 0.08)',
                      color: clipDuration === s ? '#000' : '#e2e8f0',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {s}s
                  </button>
                ))}
              </div>

              {/* Mute Audio Option */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={muteAudio}
                  onChange={(e) => setMuteAudio(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>{isAr ? '🔇 كتم الصوت في المقطع' : '🔇 Vidéo muette (sans son)'}</span>
              </label>
            </div>

          </div>
        )}

        {/* Error message */}
        {trimError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '16px'
            }}
          >
            {trimError}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="button"
            disabled={isTrimming}
            onClick={handleCancelTrim}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: isTrimming ? 'not-allowed' : 'pointer'
            }}
          >
            {isAr ? 'إلغاء' : 'Annuler'}
          </button>

          <button
            type="button"
            disabled={!isLoaded || isTrimming}
            onClick={handleStartTrim}
            style={{
              background: isTrimming 
                ? 'rgba(212, 175, 55, 0.4)' 
                : 'linear-gradient(135deg, #d4af37 0%, #aa771c 100%)',
              border: 'none',
              color: '#000',
              padding: '10px 24px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: (!isLoaded || isTrimming) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)'
            }}
          >
            <span>✂️</span>
            <span>
              {isTrimming
                ? (isAr ? 'جاري القص...' : 'Découpage...')
                : (isAr ? `قص واعتماد المقطع (${clipDuration}s)` : `Découper & Valider (${clipDuration}s)`)}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

const sliderStyle = {
  width: '100%',
  cursor: 'pointer',
  accentColor: '#d4af37',
  height: '6px'
};

const microBtnStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#e2e8f0',
  borderRadius: '4px',
  padding: '2px 6px',
  fontSize: '0.72rem',
  cursor: 'pointer'
};
