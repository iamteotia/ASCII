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

    // IMPROVED 10-LEVEL DENSITY RAMPS (curated for visual density: light → dense)
    const densityMaps = {
        standard: ' .\'`^",:;Il!i><~+_-?][}{1)(|@%#*#$@',

        // Indian Scripts (light diacritics → full consonants/blocks)
        devanagari: ' ।् ं ि ी ु ू ए ऐ ओ औ क ख ग घ ङ',  // Progresses from dots to filled matras to consonants
        gurmukhi: ' ਿ ੀ ੁ ੂ ਏ ਐ ਓ ਔ ਕ ਖ ਗ ਘ ਙ',      // Sparse vowels to dense Gurmukhi letters
        tamil: ' ி ீ ு ூ எ ஏ ஐ ஒ ஓ க ங ச ஞ',          // Light uyir to filled mei
        telugu: ' ి ీ ు ూ ఎ ఏ ఐ ఒ ఓ క ఖ గ ఘ',         // Diacritics to bold Telugu forms
        kannada: ' ಿ ೀ ು ೂ ಎ ಏ ಐ ಒ ಓ ಕ ಖ ಗ ಘ',         // Vowel signs to consonant clusters
        malayalam: ' ി ീ ു ൂ എ ഏ ഐ ഒ ഓ ക ഖ ഗ ഘ',      // Chillu to reformed letters for density
        bengali: ' ি ী ু ূ এ ঐ ও ঔ ক খ গ ঘ',            // Matras to rounded bengali forms
        gujarati: ' િ ી ુ ૂ એ ઐ ઓ ઔ ક ખ ગ ઘ',           // Light to implosive gujarati

        // International Scripts (punctuation → sparse → ideographs/letters)
        chinese: ' 。，、；：？！…—～「」『』【】（）［］',       // Dots to full brackets (simulates CJK density)
        japanese: ' 。゛゜ゃゅょっゎァィゥェォャュョッヮ',   // Hiragana particles to katakana blocks
        hebrew: ' ־ ֿ ֽ ְ ֱ ֲ ֳ ִ ֵ ֶ ַ ָ ֹ ֻ ו ה ח',       // Niqqud dots to full letters
        arabic: ' َ ِ ُ ّ ْ ٰ ٱ ٻ پ ڑ ڐ ډ ڊ',            // Harakat to joined forms
        thai: ' ะ ั ิ ี ึ ื ุ ู เ แ โ ใ ไ ำ',              // Tone marks to vowel traps
        korean: ' ㅡ ㅣ ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ',    // Lines to jamo blocks
        cyrillic: ' .:-=+*абвгдежзийклмнопрстуфхцчшщ',    // Latin-like + cyrillic fills
        greek: ' .·¨˙˚˝˛ˇάέήίϊόύώαβγδεζηθικλμνξοπρστυφχψω'  // Accents to full greek letters
    };

    // Populate dropdown
    Object.keys(densityMaps).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = key === 'standard' ? 'Standard ASCII' : key.charAt(0).toUpperCase() + key.slice(1) + ' Script';
        densitySelect.appendChild(opt);
    });

    // Event listeners (unchanged)
    colorsBtn.addEventListener('click', () => { colorsOn = !colorsOn; colorsBtn.textContent = colorsOn ? 'Mono' : 'Colors'; if (currentImage) convertImage(); });
    smallBtn.addEventListener('click', () => { smallMode = !smallMode; smallBtn.textContent = smallMode ? 'Large' : 'Small'; if (currentImage) convertImage(); });
    densitySelect.addEventListener('change', e => { currentDensity = e.target.value; if (currentImage) convertImage(); });
    uploadBtn.addEventListener('click', () => fileInput.click());
    regenerateBtn.addEventListener('click', () => { if (currentImage) convertImage(); });

    // CLEAN PNG EXPORT: Exact original dimensions, NO BORDER, full art scaled perfectly
    saveBtn.addEventListener('click', () => {
        if (!currentImage || !output.textContent.trim()) return;

        html2canvas(output, {
            scale: 2,  // Higher scale for crisp text
            backgroundColor: '#000000',
            logging: false,
            width: output.scrollWidth,
            height: output.scrollHeight
        }).then(previewCanvas => {
            // Set canvas to EXACT original image size
            exportCanvas.width = currentImage.naturalWidth || currentImage.width;
            exportCanvas.height = currentImage.naturalHeight || currentImage.height;
            const ctx = exportCanvas.getContext('2d');

            // Pure black background (no border!)
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

            // Scale & center ASCII art to fit original dimensions exactly (no cropping)
            const scaleX = exportCanvas.width / previewCanvas.width;
            const scaleY = exportCanvas.height / previewCanvas.height;
            const scale = Math.min(scaleX, scaleY);  // Fit without distortion
            const drawWidth = previewCanvas.width * scale;
            const drawHeight = previewCanvas.height * scale;
            const offsetX = (exportCanvas.width - drawWidth) / 2;
            const offsetY = (exportCanvas.height - drawHeight) / 2;

            ctx.drawImage(previewCanvas, offsetX, offsetY, drawWidth, drawHeight);

            // Export as PNG (clean, color-accurate, no artifacts)
            exportCanvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ascii-art.png';  // PNG for perfect text/colors
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/png', 1.0);  // 100% quality
        }).catch(err => console.error('Export error:', err));
    });

    // Drag & drop
    ['dragover', 'dragenter'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
    dropzone.addEventListener('drop', e => { if (e.dataTransfer.files[0]) handleFile({ target: { files: e.dataTransfer.files } }); });
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
            fileInput.value = '';  // Reset
        }
    }

    // HIGH-RES CONVERSION for accuracy
    function convertImage() {
        if (!currentImage) return;

        const charWidth = smallMode ? 120 : 200;  // Higher res for detail
        const canvas = document.createElement('canvas');
        const aspect = currentImage.height / currentImage.width;
        canvas.width = charWidth;
        canvas.height = Math.round(charWidth * aspect * 0.6);  // Adjusted aspect for better monospace fit
        const ctx = canvas.getContext('2d');
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        const chars = densityMaps[currentDensity] || densityMaps.standard;
        let html = '';

        // Finer sampling: 1px width, 1.5px height for precision
        for (let y = 0; y < canvas.height; y += 1.5) {
            for (let x = 0; x < canvas.width; x += 1) {
                let r = 0, g = 0, b = 0, lum = 0, count = 0;

                // Sample 2x1 block for density
                for (let dy = 0; dy < 1.5 && y + dy < canvas.height; dy += 0.5) {
                    for (let dx = 0; dx < 1 && x + dx < canvas.width; dx += 0.5) {
                        const px = Math.floor(x + dx);
                        const py = Math.floor(y + dy);
                        if (px >= 0 && py >= 0 && px < canvas.width && py < canvas.height) {
                            const i = (py * canvas.width + px) * 4;
                            r += imageData[i];
                            g += imageData[i + 1];
                            b += imageData[i + 2];
                            lum += imageData[i] * 0.2126 + imageData[i + 1] * 0.7152 + imageData[i + 2] * 0.0722;
                            count++;
                        }
                    }
                }

                if (count === 0) continue;

                const avgR = Math.round(r / count);
                const avgG = Math.round(g / count);
                const avgB = Math.round(b / count);
                const intensity = 255 - (lum / count);
                const index = Math.min(Math.floor((intensity / 255) * (chars.length - 1)), chars.length - 1);
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
