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
    let originalDimensions = { width: 0, height: 0 };

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
        telugu: ' ।্িుెోౌాీూిూఅః',
        kannada: ' ।്ിುೆೋೌಾೀೂೂೈೕಅಃ',
        malayalam: ' ।്ിുെോൌാീൂൈൗഅഃ',
        bengali: ' ।्িুেোৌাীূৈৗঅঃ',
        gujarati: ' ।୍ાીુૂેોૌૈઅઃ',
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

    // PURE JPEG EXPORT: Exact original dimensions, NO borders/padding
    saveBtn.addEventListener('click', () => {
        if (!currentImage || !output.textContent.trim()) return;

        const origW = originalDimensions.width;
        const origH = originalDimensions.height;

        html2canvas(output, {
            scale: 3,  // Higher scale for crisp ASCII at large sizes
            backgroundColor: '#000',
            logging: false,
            useCORS: true
        }).then(tempCanvas => {
            // Create export canvas at EXACT original dimensions
            exportCanvas.width = origW;
            exportCanvas.height = origH;
            const ctx = exportCanvas.getContext('2d');

            // Black background fill
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, origW, origH);

            // Scale & draw ASCII canvas to fit exactly (no borders, no padding)
            ctx.drawImage(tempCanvas, 0, 0, origW, origH);

            // Download as JPEG
            exportCanvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'ascii-art.jpg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }, 'image/jpeg', 0.98);  // High quality
        }).catch(err => {
            console.error('Export error:', err);
            alert('Export failed – check console for details.');
        });
    });

    // Drag & drop
    ['dragover', 'dragenter'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.classList.remove('dragover'); }));
    dropzone.addEventListener('drop', e => { if (e.dataTransfer.files[0]) handleFile({target:{files: e.dataTransfer.files}}); });
    fileInput.addEventListener('change', handleFile);

    function handleFile(e) {
        const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => { 
                    currentImage = img;
                    originalDimensions = { width: img.naturalWidth, height: img.naturalHeight };  // Capture original dims
                    convertImage(); 
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            if (e.target) e.target.value = '';  // Reset input
        }
    }

    function convertImage() {
        if (!currentImage) return;

        // Use original aspect for char grid (higher res for better detail)
        const aspect = originalDimensions.height / originalDimensions.width;
        const charWidth = smallMode ? 120 : 200;  // More chars for finer detail
        const charHeight = Math.round(charWidth * aspect);

        const canvas = document.createElement('canvas');
        canvas.width = charWidth;
        canvas.height = charHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(currentImage, 0, 0, charWidth, charHeight);
        const imageData = ctx.getImageData(0, 0, charWidth, charHeight).data;

        const chars = densityMaps[currentDensity];
        let html = '';

        for (let y = 0; y < charHeight; y += 2) {  // Line sampling for density
            for (let x = 0; x < charWidth; x += 1) {
                let r = 0, g = 0, b = 0, lum = 0, samples = 0;
                for (let dy = 0; dy < 2 && y + dy < charHeight; dy++) {
                    for (let dx = 0; dx < 1 && x + dx < charWidth; dx++) {
                        const i = ((y + dy) * charWidth + (x + dx)) * 4;
                        r += imageData[i];
                        g += imageData[i + 1];
                        b += imageData[i + 2];
                        lum += (imageData[i] * 0.2126 + imageData[i + 1] * 0.7152 + imageData[i + 2] * 0.0722);
                        samples++;
                    }
                }
                const avgR = Math.round(r / samples);
                const avgG = Math.round(g / samples);
                const avgB = Math.round(b / samples);
                const intensity = 255 - (lum / samples);
                const index = Math.floor((intensity / 255) * (chars.length - 1));
                const ch = chars[index];

                if (colorsOn) {
                    html += `<span style="color:rgb(${avgR},${avgG},${avgB}); text-shadow:none;">${ch}</span>`;
                } else {
                    html += ch;
                }
            }
            html += '\n';
        }
        output.innerHTML = html;
    }
});
