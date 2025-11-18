document.addEventListener('DOMContentLoaded', () => {
    const densitySelect = document.getElementById('density');
    const colorsBtn = document.getElementById('colors');
    const smallBtn = document.getElementById('small');
    const uploadBtn = document.getElementById('upload');
    const saveBtn = document.getElementById('save');
    const regenerateBtn = document.getElementById('regenerate');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const output = document.getElementById('output');
    const exportCanvas = document.getElementById('exportCanvas');

    let currentImage = null;
    let colorsOn = false;
    let smallMode = false;
    let currentDensity = 'standard';

    // Animated particles
    for (let i = 0; i < 60; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = Math.random() * 100 + '%';
        dot.style.animationDuration = (7 + Math.random() * 15) + 's';
        dot.style.animationDelay = Math.random() * 20 + 's';
        document.querySelector('.particles').appendChild(dot);
    }

    // All 17 density maps
    const densityMaps = {
        standard: ' .:-=+*#%@',
        devanagari: ' ।॑ंिआईउऊऋएऐओऔअः',
        gurmukhi: ' ।੍ਂਿਆਈਉਊਏਐਓਔਅਃ',
        tamil: ' ।்ிுெோௌாீூைௗஅஃ',
        telugu: ' ।్ిుెోౌాీూిూఅః',
        kannada: ' ।್ಿುೆೋೌಾೀೂೈೕಅಃ',
        malayalam: ' ।್ಿുെോൌാീൂൈൗഅഃ',
        bengali: ' ।্িুেোৌাীূৈৗঅঃ',
        gujarati: ' ।્િાીુૂેોૌૈઅઃ',
        chinese: ' 。，、；：？！…—～「」『』【】（）［］｛｝《》',
        japanese: ' 。゛゜ゃゅょっゎァィゥェォャュョッヮ',
        hebrew: ' .ֹּׁׂ׳״ֽֿ',
        arabic: ' .ٌٍَُِّْْٰٱٻپڀٺ',
        thai: ' .ะัิีึืุูเแโใไๅๆฯ',
        korean: ' .ㅤㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ',
        cyrillic: ' .:-=+*абвгдежзийклмнопрстуфхцчшщъыьэюя',
        greek: ' .·¨˙˚˝˛ˇάέήίϊΐόύϋΰώ'
    };

    Object.keys(densityMaps).forEach(key => {
        if (key !== 'standard') {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = key.charAt(0).toUpperCase() + key.slice(1) + ' Script';
            densitySelect.appendChild(opt);
        }
    });

    colorsBtn.addEventListener('click', () => { colorsOn = !colorsOn; colorsBtn.textContent = colorsOn ? 'Mono' : 'Colors'; if(currentImage) convertImage(); });
    smallBtn.addEventListener('click', () => { smallMode = !smallMode; smallBtn.textContent = smallMode ? 'Large' : 'Small'; if(currentImage) convertImage(); });
    densitySelect.addEventListener('change', e => { currentDensity = e.target.value; if(currentImage) convertImage(); });
    uploadBtn.addEventListener('click', () => fileInput.click());
    regenerateBtn.addEventListener('click', () => { if(currentImage) convertImage(); });

    // PURE JPEG EXPORT – no watermark at all
    saveBtn.addEventListener('click', () => {
        if (!output.textContent.trim()) return;

        const padding = 80;
        const borderWidth = 12;

        html2canvas(output, {
            scale: 2,
            backgroundColor: '#000',
            logging: false
        }).then(canvas => {
            exportCanvas.width = canvas.width + padding * 2 + borderWidth * 2;
            exportCanvas.height = canvas.height + padding * 2 + borderWidth * 2;
            const ctx = exportCanvas.getContext('2d');

            // Black background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

            // Neon pink glowing border
            ctx.lineWidth = borderWidth;
            ctx.strokeStyle = '#ff1493';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ff1493';
            ctx.strokeRect(borderWidth/2, borderWidth/2, exportCanvas.width - borderWidth, exportCanvas.height - borderWidth);

            // Draw the ASCII art
            ctx.shadowBlur = 0;
            ctx.drawImage(canvas, padding + borderWidth/2, padding + borderWidth/2);

            // Download
            exportCanvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'ascii-art.jpg';
                a.click();
                URL.revokeObjectURL(a.href);
            }, 'image/jpeg', 0.95);
        });
    });

    // Drag & drop
    ['dragover', 'dragenter'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.classList.remove('dragover'); }));
    dropzone.addEventListener('drop', e => { if (e.dataTransfer.files[0]) handleFile({target:{files: e.dataTransfer.files}}); });
    fileInput.addEventListener('change', handleFile);

    function handleFile(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => { currentImage = img; convertImage(); };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function convertImage() {
        if (!currentImage) return;

        const width = smallMode ? 80 : 140;
        const canvas = document.createElement('canvas');
        const aspect = currentImage.height / currentImage.width;
        canvas.width = width;
        canvas.height = Math.round(width * aspect * 0.55);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        const chars = densityMaps[currentDensity];
        let html = '';

        for (let y = 0; y < canvas.height; y += 2) {
            for (let x = 0; x < canvas.width; x += 1) {
                let r = 0, g = 0, b = 0, lum = 0, samples = 0;
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 1; dx++) {
                        if (y + dy >= canvas.height || x + dx >= canvas.width) continue;
                        const i = ((y + dy) * canvas.width + (x + dx)) * 4;
                        r += imageData[i];
                        g += imageData[i+1];
                        b += imageData[i+2];
                        lum += imageData[i] * 0.2126 + imageData[i+1] * 0.7152 + imageData[i+2] * 0.0722;
                        samples++;
                    }
                }
                const avgR = Math.round(r / samples);
                const avgG = Math.round(g / samples);
                const avgB = Math.round(b / samples);
                const intensity = 255 - (lum / samples);
                const index = Math.floor(intensity / 255 * (chars.length - 1));
                const ch = chars[index];

                if (colorsOn) {
                    html += `<span style="color:rgb(${avgR},${avgG},${avgB})">${ch}</span>`;
                } else {
                    html += ch;
                }
            }
            html += '\n';
        }
        output.innerHTML = html;
    }
});
