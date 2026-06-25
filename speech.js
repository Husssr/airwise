// speech.js — หน้ารายละเอียดอำเภอ + ระบบเสียง AI TTS (Text-to-Speech)

        // [6] โมดูลจัดการหน้าต่างเจาะลึกและฟังก์ชันควบคุมเสียงบรรยาย AI
        // -------------------------------------------------------------
        window.enterDistrictDeepAnalysisView = function(districtIndex) {
            currentlySelectedDistrictIndex = districtIndex;
            const targetDistrict = districtsData[districtIndex];
            const assessment = evaluatePm25Tier(targetDistrict.pm25);
            
            document.getElementById('detail-title-name').innerText = currentLang === 'th' ? targetDistrict.th : targetDistrict.en;
            document.getElementById('detail-pm-display').innerText = targetDistrict.pm25;
            
            const pillBadge = document.getElementById('detail-status-pill');
            pillBadge.innerText = currentLang === 'th' ? assessment.tierTh : assessment.tierEn;
            pillBadge.style.backgroundColor = assessment.hexColor;
            
            document.getElementById('detail-accent-bar').style.backgroundColor = assessment.hexColor;
            document.getElementById('detail-gauge-frame').style.borderColor = assessment.hexColor;
            document.getElementById('detail-rec-text').innerText = currentLang === 'th' ? assessment.adviceTh : assessment.adviceEn;
            
            renderDistrictIssuesPanel(targetDistrict);
            
            switchView('district-detail');
        };

        window.toggleSpeechSynthesis = function() {
            if (currentlySelectedDistrictIndex === null) return;
            
            if (isAudioPlayingState) {
                terminateSpeechAudio();
            } else {
                executeSpeechAudioPlayback();
            }
        };

        // แบ่งสคริปต์เป็นประโยคย่อยๆ สำหรับซับไตเติล (รองรับทั้งไทยและอังกฤษ)
        function splitIntoSubtitleChunks(text) {
            // แบ่งข้อความเป็นประโยคย่อยๆ สำหรับแสดงเป็น subtitle ทีละชิ้น
            return text
                .split(/(?<=[.!?:.])\s+|(?<=[\u0E00-\u0E7F])\s{2,}|\n+/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        let mascotMouthInterval = null;
        let mascotBlinkTimeout = null;

        // ขยับปากตัวการ์ตูนระหว่างพูด (สลับระหว่าง mouth-open และ mouth-closed ตามจังหวะแบบธรรมชาติ)
        function startMascotTalking() {
            const mouthClosed = document.getElementById('mouth-closed');
            const mouthOpen   = document.getElementById('mouth-open');
            const mouthTeeth  = document.getElementById('mouth-teeth');
            const mouthTongue = document.getElementById('mouth-tongue');
            const bubble      = document.getElementById('char-speaking-bubble');
            if (!mouthClosed) return;
            if (bubble) bubble.classList.remove('hidden');
            stopMascotTalking();
            let mouthIsOpen = false;
            mascotMouthInterval = setInterval(() => {
                if (!window.speechSynthesis.speaking) return;
                mouthIsOpen = !mouthIsOpen;
                if (mouthIsOpen) {
                    mouthClosed.classList.add('hidden');
                    mouthOpen.classList.remove('hidden');
                    mouthTeeth.classList.remove('hidden');
                    // ลิ้นโชว์เป็นครั้งคราวให้ดูน่ารัก
                    if (mouthTongue) mouthTongue.classList.toggle('hidden', Math.random() > 0.4);
                    // สุ่มขนาดปาก ry ให้ดูเป็นธรรมชาติ
                    const openness = (4 + Math.random() * 5).toFixed(1);
                    mouthOpen.setAttribute('ry', openness);
                    if (mouthTeeth) mouthTeeth.setAttribute('cy', (parseFloat(mouthOpen.getAttribute('cy')) - parseFloat(openness) * 0.55).toFixed(1));
                } else {
                    mouthClosed.classList.remove('hidden');
                    mouthOpen.classList.add('hidden');
                    mouthTeeth.classList.add('hidden');
                    if (mouthTongue) mouthTongue.classList.add('hidden');
                }
            }, 110);
        }

        function stopMascotTalking() {
            if (mascotMouthInterval) { clearInterval(mascotMouthInterval); mascotMouthInterval = null; }
            const mouthClosed = document.getElementById('mouth-closed');
            const mouthOpen   = document.getElementById('mouth-open');
            const mouthTeeth  = document.getElementById('mouth-teeth');
            const mouthTongue = document.getElementById('mouth-tongue');
            const bubble      = document.getElementById('char-speaking-bubble');
            if (mouthClosed) mouthClosed.classList.remove('hidden');
            if (mouthOpen)   mouthOpen.classList.add('hidden');
            if (mouthTeeth)  mouthTeeth.classList.add('hidden');
            if (mouthTongue) mouthTongue.classList.add('hidden');
            if (bubble)      bubble.classList.add('hidden');
        }

        // กระพริบตาเป็นช่วงๆ ให้ตัวการ์ตูนดูมีชีวิตชีวา (ไม่ได้ใช้กับ SVG ตัวการ์ตูนใหม่ที่ไม่มี mascot-eyes แต่ไว้สำรอง)
        function scheduleMascotBlink() {
            // ตัวการ์ตูนใหม่ใช้ CSS animation แทน JS blink ตรงนี้จึงไม่ต้องทำอะไร
            mascotBlinkTimeout = setTimeout(scheduleMascotBlink, 3000 + Math.random() * 2000);
        }

        function stopMascotBlink() {
            if (mascotBlinkTimeout) { clearTimeout(mascotBlinkTimeout); mascotBlinkTimeout = null; }
        }

        function executeSpeechAudioPlayback() {
            terminateSpeechAudio();
            const currentDistrict = districtsData[currentlySelectedDistrictIndex];
            const evaluation = evaluatePm25Tier(currentDistrict.pm25);
            const issues = districtIssuesData[currentDistrict.th];
            const speechLocaleCode = currentLang === 'th' ? 'th-TH' : 'en-US';
            let speechStringText = '';

            if (currentLang === 'th') {
                const causesText = issues ? issues.causes.join(' และ ') : 'ไม่มีข้อมูล';
                const solutionsText = issues ? issues.solutions.join(' ') : 'ไม่มีข้อมูล';
                speechStringText = `สวัสดีค่ะ! หนูจะรายงานคุณภาพอากาศของพื้นที่ ${currentDistrict.th} นะคะ. ตรวจวัดปริมาณฝุ่นละอองพีเอ็มสองจุดห้าได้ ${currentDistrict.pm25} ไมโครกรัมต่อลูกบาศก์เมตร. เกณฑ์การประเมินอยู่ในระดับ ${evaluation.tierTh}. ข้อแนะนำด้านสาธารณสุขคือ ${evaluation.adviceTh}. ปัญหาหลักในพื้นที่ได้แก่ ${causesText}. แนวทางการแก้ไขปัญหาคือ ${solutionsText}. ขอบคุณที่รับฟังค่ะ!`;
            } else {
                const causesText = issues ? issues.causes.join(', and ') : 'no data';
                const solutionsText = issues ? issues.solutions.join(' ') : 'no data';
                speechStringText = `Hello! I will report the air quality for ${currentDistrict.en}. PM 2.5 concentration is ${currentDistrict.pm25} micrograms per cubic meter. Status: ${evaluation.tierEn}. Health advice: ${evaluation.adviceEn}. Main causes: ${causesText}. Solutions: ${solutionsText}. Thank you!`;
            }

            const subtitleChunks = splitIntoSubtitleChunks(speechStringText);
            let chunkStartPositions = [];
            let searchCursor = 0;
            subtitleChunks.forEach(chunk => {
                const idx = speechStringText.indexOf(chunk, searchCursor);
                chunkStartPositions.push(idx >= 0 ? idx : searchCursor);
                searchCursor = (idx >= 0 ? idx : searchCursor) + chunk.length;
            });

            const subtitleEl = document.getElementById('speech-subtitle');
            if (subtitleEl) subtitleEl.innerHTML = `<span class="text-blue-700">${subtitleChunks[0] || ''}</span>`;

            currentSpeechInstance = new SpeechSynthesisUtterance(speechStringText);
            currentSpeechInstance.lang = speechLocaleCode;
            currentSpeechInstance.rate = 1.0;
            currentSpeechInstance.pitch = 1.4;

            const preferredVoice = pickFriendliestVoice(speechLocaleCode);
            if (preferredVoice) currentSpeechInstance.voice = preferredVoice;

            let currentChunkIndex = 0;
            currentSpeechInstance.onboundary = (event) => {
                const pos = event.charIndex;
                while (currentChunkIndex < chunkStartPositions.length - 1 && pos >= chunkStartPositions[currentChunkIndex + 1]) {
                    currentChunkIndex++;
                }
                if (subtitleEl) subtitleEl.innerHTML = `<span class="text-blue-700">${subtitleChunks[currentChunkIndex] || ''}</span>`;
            };
            currentSpeechInstance.onstart = () => { startMascotTalking(); };
            currentSpeechInstance.onend = () => {
                if (subtitleEl) subtitleEl.innerHTML = '<span class="text-slate-500">✅ จบการรายงาน</span>';
                setTimeout(() => { if (subtitleEl) subtitleEl.textContent = 'กดปุ่มด้านล่างเพื่อให้น้องอ่านสรุปให้ฟัง 🎙️'; }, 2500);
                resetAudioPlaybackUIState(false);
            };
            currentSpeechInstance.onerror = () => { resetAudioPlaybackUIState(false); };

            window.speechSynthesis.speak(currentSpeechInstance);
            resetAudioPlaybackUIState(true);
        }

        // เลือกเสียงพูดที่ฟังดูสดใส/เหมาะกับเด็กที่สุดจากรายการเสียงที่เครื่องผู้ใช้มีอยู่
        function pickFriendliestVoice(localeCode) {
            const voices = window.speechSynthesis.getVoices();
            if (!voices || voices.length === 0) return null;
            const langPrefix = localeCode.split('-')[0];
            const sameLangVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
            if (sameLangVoices.length === 0) return null;
            // เรียงให้เสียงที่มีคำว่า child/kid/female/Google ขึ้นก่อน (มักฟังดูสดใสกว่าเสียงมาตรฐาน)
            const priorityKeywords = ['child', 'kid', 'female', 'girl', 'google', 'natural'];
            sameLangVoices.sort((a, b) => {
                const score = (v) => priorityKeywords.reduce((acc, kw) => acc + (v.name.toLowerCase().includes(kw) ? 1 : 0), 0);
                return score(b) - score(a);
            });
            return sameLangVoices[0];
        }
        // เบราว์เซอร์บางตัวโหลดรายชื่อเสียงแบบ async ต้อง trigger ล่วงหน้าเพื่อให้ getVoices() พร้อมใช้งานทันที
        if (typeof window.speechSynthesis !== 'undefined') {
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }

        function terminateSpeechAudio() {
            window.speechSynthesis.cancel();
            resetAudioPlaybackUIState(false);
        }

        function resetAudioPlaybackUIState(isPlaying) {
            isAudioPlayingState = isPlaying;
            const btnIcon = document.getElementById('audio-icon');
            const btnText = document.getElementById('audio-text');
            
            if (isPlaying) {
                if (btnIcon) btnIcon.className = "fas fa-circle-stop text-rose-500 animate-pulse";
                if (btnText) btnText.innerText = currentLang === 'th' ? translationDictionary.th["audio-stop"] : translationDictionary.en["audio-stop"];
            } else {
                if (btnIcon) btnIcon.className = "fas fa-volume-high";
                if (btnText) btnText.innerText = currentLang === 'th' ? translationDictionary.th["audio-listen"] : translationDictionary.en["audio-listen"];
                stopMascotTalking();
            }
        }