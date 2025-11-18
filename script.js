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

    // Animated pink dots (increased to 60 for more vibe)
    const particles = document.querySelector('.particles');
    for (let i = 0; i < 60; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = Math.random() * 100 + '%';
        dot.style.animationDuration = (7 + Math.random() * 15) + 's';
        dot.style.animationDelay = Math.random() * 20 + 's';
        dot.style.opacity = 0.3 + Math.random() * 0.4;
        particles.appendChild(dot);
    }

    // ALL DENSITY RAMPS (17 total — unchanged)
    const densityMaps = {
        standard:   ' .:-=+*#%@',

        // Indian Scripts
        devanagari: ' ।॑ंिआईउऊऋएऐओऔअः',
        gurmukhi:   ' ।੍ਂਿਆਈਉਊਏਐਓਔਅਃ',
        tamil:      ' ।்ிுெோௌாீூைௗஅஃ',
        telugu:     ' ।్ిుెోౌాీూిూఅః',
        kannada:    ' ।્િುೆೋೌಾೀೂೈೕಅಃ',
        malayalam:  ' ।്ിുെോൌാീೂൈൗഅഃ',
        bengali:    ' ।্িুেোৌাীূৈৗঅঃ',
        gujarati:   ' ।્િાીુૂેોૌૈઅઃ',

        // International Scripts
        chinese:    ' 。，、；：？！…—～「」『』【】（）［］｛｝《》',
        japanese:   ' 。゛゜ゃゅょっゎァィゥェォャュョッヮ',
        hebrew:     ' .ֹּׁׂ׳״ֽֿֿֿֿֿֿֿ',
        arabic:     ' .ٌٍَُِّْْٰٱٻپڀٺ',
        thai:       ' .ะัิีึืุูเแโใไๅๆฯ',
        korean:     ' .ㅤㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ',
        cyrillic:   ' .:-=+*абвгдежзийклмнопрстуфхцчшщъыьэюя',
        greek:      ' .·¨˙˚˝˛ˇάέήίϊΐόύϋΰώ'
    };

    // Populate dropdown
    Object.keys(densityMaps).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        if (key === 'standard') {
            opt.textContent = 'Standard ASCII';
        } else {
            opt.textContent = key.charAt(0).toUpperCase() + key.slice(1) + ' Script';
        }
        densitySelect.appendChild(opt);
    });

    // Event Listeners
    colorsBtn.addEventListener('click', () => { 
        colorsOn = !colorsOn; 
        colorsBtn.textContent = colorsOn ? 'Mono' : 'Colors'; 
        if (currentImage) convertImage(); 
    });
    smallBtn.addEventListener('click', () => { 
        smallMode = !smallMode; 
        smallBtn.textContent = smallMode ? 'Large' : 'Small'; 
        if (currentImage) convertImage(); 
    });
    densitySelect.addEventListener('change', e => { 
        currentDensity = e.target.value; 
        if (currentImage) convertImage(); 
    });
    uploadBtn.addEventListener('click', () => fileInput.click());
    regenerateBtn.addEventListener('click', () => { if (currentImage) convertImage(); });

    // SAVE AS JPEG (updated: no watermark, pure ASCII art only)
    saveBtn.addEventListener('click', () => {
        if (!output.textContent.trim()) return;

        const lines = output.innerHTML.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const lineHeight = output.scrollHeight / lines.length;
        const padding = 60;
        const width = output.scrollWidth + padding * 2;
        const height = (lines.length * lineHeight) + padding * 2;

        exportCanvas.width = width * 2;  // Hi-res for crisp text
        exportCanvas.height = height * 2;
        const ctx = exportCanvas.getContext('2d');
        ctx.scale(2, 2);  // Scale for sharpness

        // Black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Neon pink glowing border (kept for style)
        ctx.strokeStyle = '#ff1493';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff1493';
        ctx.strokeRect(padding / 2, padding / 2, width - padding, height - padding);

        // Render ASCII art via html2canvas (preserves colors perfectly)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = output.innerHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.fontFamily = window.getComputedStyle(output).fontFamily;
        tempDiv.style.fontSize = window.getComputedStyle(output).fontSize;
        tempDiv.style.lineHeight = window.getComputedStyle(output).lineHeight;
        tempDiv.style.letterSpacing = '0';
        tempDiv.style.whiteSpace = 'pre';
        tempDiv.style.background = 'transparent';
        tempDiv.style.color = 'inherit';  // Ensure colors render
        document.body.appendChild(tempDiv);

        html2canvas(tempDiv, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            allowTaint: true
        }).then(canvas => {
            document.body.removeChild(tempDiv);
            ctx.drawImage(canvas, padding, padding, canvas.width / 2, canvas.height / 2);

            // Export as high-quality JPEG (pure art only — no watermark)
            exportCanvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ascii-art-${Date.now()}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/jpeg', 0.95);  // Slightly lower quality for smaller file size
        }).catch(err => {
            console.error('Export failed:', err);
            alert('Export failed — try again or check console.');
        });
    });

    // Drag & drop + file handling
    fileInput.addEventListener('change', e => handleFile(e));
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile({ target: { files: e.dataTransfer.files } });
    });

    function handleFile(e) {
        const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => { 
                    currentImage = img; 
                    convertImage(); 
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            fileInput.value = '';  // Reset for re-upload
        }
    }

    // Main conversion (fixed colors: refined brightness, explicit span styles)
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
        const charList = densityMaps[currentDensity] || densityMaps.standard;
        const numChars = charList.length;

        let htmlOutput = '';
        let textOutput = '';

        const charStep = 1;
        const lineStep = 2;

        for (let y = 0; y < canvas.height; y += lineStep) {
            let lineHtml = '';
            let lineText = '';
            for (let x = 0; x < canvas.width; x += charStep) {
                let r = 0, g = 0, b = 0, brightness = 0, count = 0;

                for (let dy = 0; dy < lineStep && y + dy < canvas.height; dy++) {
                    for (let dx = 0; dx < charStep && x + dx < canvas.width; dx++) {
                        const i = ((y + dy) * canvas.width + (x + dx)) * 4;
                        const pixelR = imageData[i];
                        const pixelG = imageData[i + 1];
                        const pixelB = imageData[i + 2];
                        r += pixelR;
                        g += pixelG;
                        b += pixelB;
                        // Improved luminance (ITU-R BT.709) for better color accuracy
                        brightness += (pixelR * 0.2126 + pixelG * 0.7152 + pixelB * 0.0722);
                        count++;
                    }
                }

                const avgR = Math.max(0, Math.min(255, Math.round(r / count)));
                const avgG = Math.max(0, Math.min(255, Math.round(g / count)));
                const avgB = Math.max(0, Math.min(255, Math.round(b / count)));
                const avgBrightness = Math.max(0, Math.min(255, brightness / count));

                // Invert for density: darker = denser char
                const intensity = 255 - avgBrightness;
                const charIndex = Math.floor((intensity / 255) * (numChars - 1));
                const char = charList[charIndex] || charList[numChars - 1];

                if (colorsOn) {
                    // Explicit inline style for bulletproof color rendering
                    lineHtml += `<span style="color: rgb(${avgR}, ${avgG}, ${avgB}); text-shadow: none;">${char}</span>`;
                } else {
                    lineHtml += char;
                }
                lineText += char;
            }
            htmlOutput += lineHtml + '\n';
            textOutput += lineText + '\n';
        }

        // Set output (colors now guaranteed to show)
        if (colorsOn) {
            output.innerHTML = htmlOutput;
        } else {
            output.innerHTML = textOutput.replace(/\n/g, '<br>');  // Use <br> for mono to match pre behavior
            output.style.color = '#fff';  // White for mono
        }
        output.dataset.plainText = textOutput;  // Backup for potential text save fallback
    }
});
