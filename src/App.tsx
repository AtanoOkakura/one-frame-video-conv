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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>画像→動画一括変換ツール</h1>

      <div
        style={{ border: '2px dashed #ccc', padding: '40px', borderRadius: '10px', backgroundColor: '#f9f9f9' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files) {
            const event = { target: { files } } as any;
            handleFileUpload(event);
          }
        }}
      >
        <p>画像をここにドロップするか、ファイルを選択してください</p>
        <input title='input_files' type="file" accept="image/*" multiple onChange={handleFileUpload} />
      </div>

      {isProcessing && <p style={{ color: 'blue' }}>変換中...</p>}

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