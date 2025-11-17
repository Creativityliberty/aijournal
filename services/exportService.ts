import { JournalPage, CanvasItem, ItemType } from "../types";

const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

const generateHtmlContent = (page: JournalPage): string => {
    const itemsHtml = page.items.sort((a,b) => a.zIndex - b.zIndex).map(item => {
        const style = `position: absolute; left: ${item.position.x}px; top: ${item.position.y}px; width: ${item.size.width}px; z-index: ${item.zIndex}; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); border-radius: 8px;`;

        switch(item.type) {
            case ItemType.IMAGE:
                return `<img src="${item.content}" style="${style} height: ${item.size.height}px; object-fit: cover;" />`;
            case ItemType.VIDEO:
                return `<video src="${item.content}" style="${style} height: ${item.size.height}px; object-fit: cover;" autoplay loop muted playsinline></video>`;
            case ItemType.TEXT:
                 const textContainerStyle = `${style} height: auto; background-color: rgba(0,0,0,0.6); color: white; padding: 16px; font-family: 'Courier Prime', monospace; font-size: 16px;`;
                 if (item.audioContent) {
                     return `
                        <div style="${textContainerStyle}" onclick="playAudio('${item.id}')" class="text-item-with-audio">
                            ${escapeHtml(item.content)}
                            <audio id="audio-${item.id}" src="${item.audioContent}"></audio>
                            <svg viewBox="0 0 24 24" fill="currentColor" style="position: absolute; bottom: 8px; right: 8px; width: 20px; height: 20px; opacity: 0.7;"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.72-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" /></svg>
                        </div>`;
                 }
                return `<div style="${textContainerStyle}">${escapeHtml(item.content)}</div>`;
            default:
                return '';
        }
    }).join('\\n');

    const script = `
        let currentAudio = null;
        function playAudio(id) {
            const audio = document.getElementById('audio-' + id);
            if (audio) {
                if (currentAudio && currentAudio !== audio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
                currentAudio = audio;
                audio.play();
            }
        }
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Journal - ${new Date(page.date).toLocaleDateString()}</title>
            <style>
                body { margin: 0; background-color: #f5f5f4; overflow: hidden; height: 100vh; }
                .text-item-with-audio { cursor: pointer; }
            </style>
        </head>
        <body>
            <div style="position: relative; width: 100%; height: 100%;">
                ${itemsHtml}
            </div>
            <script>${script}</script>
        </body>
        </html>
    `;
}

export const exportPageAsHtml = (page: JournalPage) => {
    const htmlString = generateHtmlContent(page);
    const blob = new Blob([htmlString], { type: 'text/html' });
    const filename = `journal-${page.date.split('T')[0]}.html`;
    triggerDownload(blob, filename);
}

// --- GIF Export ---

// Reference to the FFmpeg instance
let ffmpeg: any = null;

const dataUrlToUint8Array = async (dataUrl: string): Promise<Uint8Array> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

export const exportVideoAsGif = async (videoSrc: string, onProgress: (message: string) => void) => {
    // @ts-ignore - FFmpeg is loaded from a script tag
    const { FFmpeg } = window;
    if (!FFmpeg) {
        throw new Error("FFmpeg library not loaded. Please wait and try again.");
    }

    if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        ffmpeg.on('log', ({ message }: { message: string }) => {
            onProgress(message);
        });
    }

    if (!ffmpeg.loaded) {
        onProgress("Loading FFmpeg core (~31 MB)...");
        await ffmpeg.load({
            coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js"
        });
    }

    onProgress("Converting video data...");
    const videoData = await dataUrlToUint8Array(videoSrc);
    
    onProgress("Writing video file to memory...");
    await ffmpeg.writeFile('input.webm', videoData);

    onProgress("Executing GIF conversion command...");
    // This command creates a decent quality GIF.
    // -i: input file
    // -vf: video filter. fps=15, scale=320:-1 (width 320, height proportional)
    // -f: format
    await ffmpeg.exec(['-i', 'input.webm', '-vf', 'fps=15,scale=320:-1:flags=lanczos', '-f', 'gif', 'output.gif']);

    onProgress("Reading resulting GIF file...");
    const data = await ffmpeg.readFile('output.gif');
    const blob = new Blob([data], { type: 'image/gif' });

    onProgress("Done! Downloading GIF...");
    triggerDownload(blob, `journal-video-${Date.now()}.gif`);
};