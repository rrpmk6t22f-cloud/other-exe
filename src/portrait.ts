export function exportPortrait(signal: HTMLCanvasElement, form: string, family: string, seed: number, tint: string) {
  const portrait = document.createElement('canvas');
  portrait.width = 840;
  portrait.height = 1050;
  const art = portrait.getContext('2d');
  if (!art || !signal.width || !signal.height) return;
  art.fillStyle = '#f4f0e7';
  art.fillRect(0, 0, 840, 1050);
  const halo = art.createRadialGradient(420, 479, 30, 420, 479, 360);
  halo.addColorStop(0, tint + '99');
  halo.addColorStop(1, tint + '00');
  art.fillStyle = halo;
  art.fillRect(0, 0, 840, 970);
  const crop = Math.min(signal.width, signal.height);
  art.drawImage(signal, (signal.width - crop) / 2, (signal.height - crop) / 2, crop, crop, 85, 140, 670, 670);
  art.strokeStyle = '#546a5b66';
  art.strokeRect(39, 39, 762, 972);
  art.fillStyle = '#244436';
  art.font = '21px "IBM Plex Mono", monospace';
  art.fillText('OTHER.EXE   /   ' + seed.toString(16).toUpperCase().padStart(8, '0'), 67, 89);
  art.font = '66px "Instrument Serif", Georgia, serif';
  art.fillText('Pip', 67, 875);
  art.font = '20px "IBM Plex Mono", monospace';
  art.fillText(family.toUpperCase() + '   /   ' + form.toUpperCase(), 69, 926);
  portrait.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'pip-' + seed.toString(16) + '-' + form.toLowerCase().replaceAll(' ', '-') + '.png';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
