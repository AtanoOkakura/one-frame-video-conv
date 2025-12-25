import React, { useState, useRef } from 'react';

// 変換された動画データを管理する型
interface ConvertedVideo {
  id: string;
  name: string;
  url: string;
}

const App = () => {
  const [videos, setVideos] = useState<ConvertedVideo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);
    const newVideos: ConvertedVideo[] = [];

    // 各ファイルを順番に処理
    for (const file of Array.from(files)) {
      const video = await convertImageToVideo(file);
      newVideos.push(video);
    }

    setVideos((prev) => [...newVideos, ...prev]);
    setIsProcessing(false);
  };

  const convertImageToVideo = (file: File): Promise<ConvertedVideo> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const stream = canvas.captureStream(1);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name.replace(/\.[^/.]+$/, "") + ".webm",
            url: URL.createObjectURL(blob)
          });
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 1000);
      };
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif', color: '#333' }}>

      {/* ヘッダー・案内文 */}
      <header style={{ textAlign: 'left', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#fff4f4ff', marginBottom: '10px' }}>🛡 one-frame-video-conv</h1>
        <div style={{ backgroundColor: '#fff4f4ff', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #ff4d4d', lineHeight: '1.6' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>【開発の背景】</p>
          <p style={{ margin: '5px 0 0', fontSize: '0.95rem' }}>
            2025年12月24日、X（旧Twitter）に投稿画像をAIが編集・学習に利用しやすくする機能が追加されました。
            このツールは、画像を「1秒間の動画」に変換することで、それらの自動処理から作品を守るための一時的な措置として開発されました。
          </p>
          <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#666' }}>
            ※すべての処理はブラウザ上で行われます。画像データがサーバーに送信されることはありません。
          </p>
        </div>
      </header>

      {/* ドラッグ＆ドロップエリア */}
      <div
        style={{
          border: '3px dashed #1DA1F2',
          padding: '60px 20px',
          borderRadius: '15px',
          backgroundColor: '#f0f9ff',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.backgroundColor = '#e0f2fe';
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f9ff';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.backgroundColor = '#f0f9ff';
          const files = e.dataTransfer.files;
          if (files) handleFileUpload({ target: { files } } as any);
        }}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🖼️ ➡ 🎬</div>
        <h2 style={{ fontSize: '1.2rem', margin: '10px 0' }}>ここに画像をドラッグ＆ドロップ</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>またはクリックしてファイルを選択（複数可）</p>
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* 変換中表示 */}
      {isProcessing && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div className="loader"></div>
          <p style={{ color: '#1DA1F2', fontWeight: 'bold' }}>動画に変換中...</p>
        </div>
      )}

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {videos.map((v) => (
          <div key={v.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px' }}>
            <video src={v.url} controls loop style={{ width: '100%', borderRadius: '4px' }} />
            <p style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</p>
            <a href={v.url} download={v.name}>
              <button style={{ width: '100%', marginBottom: '5px' }}>保存する</button>
            </a>
            {/* <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('画像を動画に変換しました。')}`)}
              style={{ width: '100%', backgroundColor: '#1DA1F2', color: 'white', border: 'none', padding: '5px', borderRadius: '4px' }}
            >
              Xでシェア
            </button> */}
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default App;