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
    let lastCharWidth = 140;  // Will be updated after each conversion

    // Particles
    for (let i = 0; i < 60; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = Math.random() * 100 + '%';
        dot.style.animationDuration = (7 + Math.random() * 15) + 's';
        dot.style.animationDelay = Math.random() * 20 + 's';
        document.querySelector('.particles').appendChild(dot);
    }

    // All density maps (same as before)
    const densityMaps = {
        standard: ' .:-=+*#%@',
        devanagari: ' ।॑ंि bookmarkआईउऊऋएऐओऔअः',
        gurmukhi: ' ।੍ਂਿਆਈਉਊਏਐਓਔਅਃ',
        tamil: ' ।்ிுெோௌாீூைௗஅஃ',
        telugu: ' ।్ిుెోౌాೀూಿూఅః',
        kannada: ' ।್ಿುೆೋೌಾೀೂೈೕಅಃ',
        malayalam: ' ।്ിുെോൌാೀൂൈൗഅഃ',
        bengali: ' ।্িুেোৌাೀূৈৗঅঃ',
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

    // PERFECT SAVE — same size as original image, no border, full art
    saveBtn.addEventListener('click', () => {
        if (!currentImage || !output.textContent.trim()) return;

        html2canvas(output, {
            scale: 1,
            backgroundColor: null,
            logging: false,
            width: output.scrollWidth,
            height: output.scrollHeight
        }).then(canvas => {
            // Create final canvas with exact original image dimensions
            exportCanvas.width = currentImage.width;
            exportCanvas.height = currentImage.height;
            const ctx = exportCanvas.getContext('2d');

            // Fill black background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

            // Calculate scaling to fit ASCII art perfectly into original dimensions
            const scaleX = currentImage.width / canvas.width;
            const scaleY = currentImage.height / canvas.height;
            const scale = Math.max(scaleX, scaleY);  // Maintain aspect ratio

            const drawWidth = canvas.width * scale;
            const drawHeight = canvas.height * scale;
            const offsetX = (currentImage.width - drawWidth) / 2;
            const offsetY = (currentImage.height - drawHeight) / 2;

            ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);

            // Download
            exportCanvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'ascii-art-fullsize.jpg';
                a.click();
                URL.revokeObjectURL(a.href);
            }, 'img/jpeg', 0.95);
        });
    });

    // Drag & drop + file
    ['dragover', 'dragenterter'].forEach(e => dropzone.addEventListener(e, ev => { ev.preventDefault(); dropzone.classList.add('dragover'); }));
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

        const charWidth = smallMode ? 80 : 140;
        lastCharWidth = charWidth;

        const canvas = document.createElement('canvas');
        const aspect = currentImage.height / currentImage.width;
        canvas.width = charWidth;
        canvas.height = Math.round(charWidth * aspect * 0.55);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        const chars = densityMaps[currentDensity] || densityMaps.standard;
        let html = '';

        for (let y = 0; y < canvas.height; y += 2) {
            for (let x = 0; x < canvas.width; x += 1) {
                let r = 0, g = 0, b = 0, lum = 0, count = 0;

                for (let dy = 0; dy < 2 && y + dy < canvas.height; dy++) {
                    for (let dx = 0; dx < 1; dx++) {
                        const i = ((y + dy) * canvas.width + x) * 4;
                        r += imageData[i];
                        g += imageData[i + 1];
                        b += imageData[i + 2];
                        lum += imageData[i] * 0.2126 + imageData[i + 1] * 0.7152 + imageData[i + 2] * 0.0722;
                        count++;
                    }
                }

                const avgR = Math.round(r / count);
                const avgG = Math.round(g / count);
                const avgB = Math.round(b / count);
                const intensity = 255 - (lum / count);
                const index = Math.min(Math.floor(intensity / 255 * (chars.length - 1)), chars.length - 1);
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
