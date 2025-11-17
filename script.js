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

    let currentImage = null;
    let colorsOn = false;
    let smallMode = false;
    let currentDensity = 'standard';

    // Animated pink dots background (unchanged)
    const particles = document.querySelector('.particles');
    for (let i = 0; i < 50; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = Math.random() * 100 + '%';
        dot.style.animationDuration = (8 + Math.random() * 12) + 's';
        dot.style.animationDelay = Math.random() * 20 + 's';
        dot.style.opacity = 0.3 + Math.random() * 0.4;
        particles.appendChild(dot);
    }

    // === ALL DENSITY RAMPS ===
    const densityMaps = {
        standard: ' .:-=+*#%@',

        devanagari: ' ।॑ंिआईउऊऋएऐओऔअः',     // Hindi / Sanskrit
        gurmukhi:   ' ।੍ਂਿਆਈਉਊਏਐਓਔਅਃ',     // Punjabi
        tamil:      ' ।்ிுெோௌாீூைௗஅஃ',     // Tamil
        telugu:     ' ।్ిుెోౌాీూిూఅః',     // Telugu
        kannada:    ' ।್ಿುೆೋೌಾೀೂೈೕಅಃ',     // Kannada
        malayalam:  ' ।്ിുെോൌാീൂൈൗഅഃ',     // Malayalam
        bengali:    ' ।্িুেোৌাীূৈৗঅঃ',     // Bengali / Assamese
        gujarati:   ' ।્િાીુૂેોૌૈઅઃ'      // Gujarati
    };

    // Populate the dropdown with all Indian options
    Object.keys(densityMaps).forEach(key => {
        if (key !== 'standard') {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = key.charAt(0).toUpperCase() + key.slice(1) + ' Script';
            densitySelect.appendChild(opt);
        }
    });

    // Toggle colors
    colorsBtn.addEventListener('click', () => {
        colorsOn = !colorsOn;
        colorsBtn.textContent = colorsOn ? 'Mono' : 'Colors';
        if (currentImage) convertImage();
    });

    // Toggle small mode
    smallBtn.addEventListener('click', () => {
        smallMode = !smallMode;
        smallBtn.textContent = smallMode ? 'Large' : 'Small';
        if (currentImage) convertImage();
    });

    // Density change
    densitySelect.addEventListener('change', (e) => {
        currentDensity = e.target.value;
        if (currentImage) convertImage();
    });

    // Upload / Save / Regenerate (unchanged)
    uploadBtn.addEventListener('click', () => fileInput.click());
    saveBtn.addEventListener('click', () => {
        if (output.textContent.trim()) {
            const blob = new Blob([output.textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ascii-art.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
    });
    regenerateBtn.addEventListener('click', () => {
        if (currentImage) convertImage();
    });

    // File handling & drag-drop (unchanged)
    fileInput.addEventListener('change', handleFile);
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile({ target: { files: e.dataTransfer.files } });
    });

    function handleFile(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    currentImage = img;
                    convertImage();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    // Main conversion function
    async function convertImage() {
        if (!currentImage) return;

        const width = smallMode ? 50 : 100;  // Slightly higher res for better script rendering
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

        const lineHeight = 2;
        const charWidth = 1;

        for (let y = 0; y < canvas.height; y += lineHeight) {
            let lineHtml = '';
            let lineText = '';
            for (let x = 0; x < canvas.width; x += charWidth) {
                let r = 0, g = 0, b = 0, brightness = 0, count = 0;

                for (let dy = 0; dy < lineHeight && y + dy < canvas.height; dy++) {
                    for (let dx = 0; dx < charWidth && x + dx < canvas.width; dx++) {
                        const i = ((y + dy) * canvas.width + (x + dx)) * 4;
                        r += imageData[i];
                        g += imageData[i + 1];
                        b += imageData[i + 2];
                        brightness += imageData[i] * 0.299 + imageData[i + 1] * 0.587 + imageData[i + 2] * 0.114;
                        count++;
                    }
                }

                const avgR = Math.round(r / count);
                const avgG = Math.round(g / count);
                const avgB = Math.round(b / count);
                const avgBrightness = brightness / count;

                // Darker areas = denser characters
                const intensity = 255 - avgBrightness;
                const charIndex = Math.min(Math.floor((intensity / 255) * numChars), numChars - 1);
                const char = charList[charIndex];

                if (colorsOn) {
                    lineHtml += `<span style="color:rgb(${avgR},${avgG},${avgB})">${char}</span>`;
                } else {
                    lineHtml += char;
                }
                lineText += char;
            }
            htmlOutput += lineHtml + '\n';
            textOutput += lineText + '\n';
        }

        if (colorsOn) {
            output.innerHTML = htmlOutput;
        } else {
            output.textContent = textOutput;
        }
        output.dataset.plain = textOutput; // for saving
    }
});
