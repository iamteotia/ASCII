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

    // Animated pink dots
    const particles = document.querySelector('.particles');
    for (let i = 0; i < 60; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = Math.random() * 100 + '%';
        dot.style.animationDuration = (7 + Math.random() * 15) + 's';
        dot.style.animationDelay = Math.random() * 20 + 's';
        particles.appendChild(dot);
    }

    // ALL DENSITY RAMPS (17 total!)
    const densityMaps = {
        standard:   ' .:-=+*#%@',

        // Indian Scripts
        devanagari: ' ।॑ंिआईउऊऋएऐओऔअः',
        gurmukhi:   ' ।੍ਂਿਆਈਉਊਏਐਓਔਅਃ',
        tamil:      ' ।்ிுெோௌாீூைௗஅஃ',
        telugu:     ' ।్ిుెోౌాీూిూఅః',
        kannada:    ' ।್ಿುೆೋೌಾೀೂೈೕಅಃ',
        malayalam:  ' ।്ിുെോൌാീൂൈൗഅഃ',
        bengali:    ' ।্িুেোৌাীূৈৗঅঃ',
        gujarati:   ' ।્િાીુૂેોૌૈઅઃ',

        // International Scripts
        chinese:    ' 。，、；：？！…—～「」『』【】（）［］｛｝《》',
        japanese:   ' 。゛゜ゃゅょっゎァィゥェォャュョッヮ',
        hebrew:     ' .ֹּׁׂ׳״ֽֿֿֿֿֿֿֿ',        // Limited useful diacritics + letters
        arabic:     ' .ٌٍَُِّْْٰٱٻپڀٺ',         // Harakat + some letters
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
    colorsBtn.addEventListener('click', () => { colorsOn = !colorsOn; colorsBtn.textContent = colorsOn ? 'Mono' : 'Colors'; if(currentImage) convertImage(); });
    smallBtn.addEventListener('click', () => { smallMode = !smallMode; smallBtn.textContent = smallMode ? 'Large' : 'Small'; if(currentImage) convertImage(); });
    densitySelect.addEventListener('change', e => { currentDensity = e.target.value; if(currentImage) convertImage(); });
    uploadBtn.addEventListener('click', () => fileInput.click());
    regenerateBtn.addEventListener('click', () => { if(currentImage) convertImage(); });

    // SAVE AS JPEG (the big new feature!)
    saveBtn.addEventListener('click', () => {
        if (!output.textContent.trim()) return;

        const lines = output.innerHTML.split('\n');
        const lineHeight = output.scrollHeight / lines.length;
        const padding = 60;
        const width = output.scrollWidth + padding * 2;
        const height = output.scrollHeight + padding * 2;

        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');

        // Neon pink background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Glowing border
        ctx.strokeStyle = '#ff1493';
        ctx.lineWidth = 12;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff1493';
        ctx.strokeRect(20, 20, width - 40, height - 40);

        // Render the ASCII art
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = output.innerHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.font = window.getComputedStyle(output).font;
        tempDiv.style.lineHeight = window.getComputedStyle(output).lineHeight;
        tempDiv.style.letterSpacing = window.getComputedStyle(output).letterSpacing;
        tempDiv.style.whiteSpace = 'pre';
        document.body.appendChild(tempDiv);

        html2canvas(tempDiv).then(canvas => {
            document.body.removeChild(tempDiv);
            ctx.drawImage(canvas, padding, padding);

            // Watermark
            ctx.font = 'bold 30px Courier New';
            ctx.fillStyle = '#ff1493';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff1493';
            ctx.fillText('by vivek teotia', width - 380, height - 40);

            exportCanvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ascii-art-vivek-teotia.jpg';
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/jpeg', 0.98);
        });
    });

    // Drag & drop + file handling (unchanged)
    fileInput.addEventListener('change', e => handleFile(e));
    ['dragover', 'dragenter'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
    dropzone.addEventListener('drop', e => { if (e.dataTransfer.files.length) handleFile({ target: { files: e.dataTransfer.files } }); });

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

    async function convertImage() {
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

        for (let y = 0; y < canvas.height; y += 2) {
            let lineHtml = '';
            let lineText = '';
            for (let x = 0; x < canvas.width; x++) {
                let brightness = 0, r = 0, g = 0, b = 0, count = 0;
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 1; dx++) {
                        if (y + dy >= canvas.height || x + dx >= canvas.width) continue;
                        const i = ((y + dy) * canvas.width + (x + dx)) * 4;
                        r += imageData[i]; g += imageData[i+1]; b += imageData[i+2];
                        brightness += imageData[i] * 0.299 + imageData[i+1] * 0.587 + imageData[i+2] * 0.114;
                        count++;
                    }
                }
                const avgR = Math.round(r / count);
                const avgG = Math.round(g / count);
                const avgB = Math.round(b / count);
                const intensity = 255 - (brightness / count);
                const charIndex = Math.min(Math.floor((intensity / 255) * numChars), numChars - 1);
                const char = charList[charIndex];

                if (colorsOn) {
                    lineHtml += `<span style="color:rgb(${avgR},${avgG},${avgB})">${char}</span>`;
                } else lineHtml += char;
                lineText += char;
            }
            htmlOutput += lineHtml + '\n';
            textOutput += lineText + '\n';
        }

        output.innerHTML = colorsOn ? htmlOutput : textOutput;
        output.textContent = textOutput;
    }
});

// Add html2canvas library (required for JPEG export)
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
document.head.appendChild(script);
