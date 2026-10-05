/**
 * Utility to download an SVG element as a high-resolution PNG image
 */
export function downloadSvgAsPng(svgElement: SVGSVGElement, filename: string, title?: string): void {
  try {
    const svgRect = svgElement.getBoundingClientRect();
    const width = Math.max(svgRect.width || 600, 600);
    const height = Math.max(svgRect.height || 340, 340);
    const scale = 2; // high resolution 2x

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);

    // Ensure xmlns is present
    if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const a = document.createElement('a');
      a.download = `${filename.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.png`;
      a.href = canvas.toDataURL('image/png');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    img.src = url;
  } catch (err) {
    console.error('Failed to export chart:', err);
  }
}
