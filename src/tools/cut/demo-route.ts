// An animated route diagram. All movement follows source time so speed changes and seeking agree.
const stops = [
  { x: 0, y: 40, name: 'Shibuya', jp: '渋谷' },
  { x: 355, y: -80, name: 'Harajuku', jp: '原宿' },
  { x: 685, y: -80, name: 'Yoyogi', jp: '代々木' },
  { x: 1040, y: 40, name: 'Shinjuku', jp: '新宿' },
];
const route = [[-540, 40], [135, 40], [255, -80], [785, -80], [905, 40], [1580, 40]];

export function drawNightRoute(ctx: CanvasRenderingContext2D, time: number, w: number, h: number): void {
  const paper = '#f1ead9';
  const ink = '#172c29';
  const line = '#236c56';
  const red = '#c33722';
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);
  const scale = Math.min(w / 720, h / 680);
  const trainX = Math.min(1040, time / 9 * 1040);
  const trainY = trainX < 255 ? 40 - Math.max(0, trainX - 135)
    : -80 + Math.min(120, Math.max(0, trainX - 785));

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-trainX, 0);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 19;
  ctx.strokeStyle = line;
  ctx.beginPath();
  for (const [i, [x, y]] of route.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.textAlign = 'center';
  for (const stop of stops) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(stop.x, stop.y, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = paper;
    ctx.beginPath();
    ctx.arc(stop.x, stop.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = '700 40px system-ui, sans-serif';
    ctx.fillText(stop.name, stop.x, stop.y + 77);
    ctx.font = '500 27px system-ui, sans-serif';
    ctx.fillText(stop.jp, stop.x, stop.y + 120);
  }

  // A train marker rides above the line, leaving the station names visible as it passes.
  ctx.translate(trainX, trainY);
  ctx.fillStyle = red;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(-26, -47);
  ctx.arc(0, -64, 31, Math.PI * 0.81, Math.PI * 2.19);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = paper;
  ctx.fillRect(-16, -75, 32, 17);
  ctx.fillRect(-15, -52, 7, 4);
  ctx.fillRect(8, -52, 7, 4);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `600 ${Math.round(28 * scale)}px ui-monospace, monospace`;
  ctx.fillText('東京   /   YAMANOTE LINE', w / 2, h * 0.15);
  ctx.font = `650 ${Math.round(64 * scale)}px Georgia, serif`;
  ctx.fillText('Night service', w / 2, h * 0.15 + 82 * scale);
  ctx.restore();
}
