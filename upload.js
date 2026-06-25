// upload.js — ระบบอัปโหลดรูปภาพ (Imgur API), Image Cropper,
//             จัดการ Hero Cover / ข่าวสาร / คณะผู้จัดทำ (CRUD)

        // --- 9.1 โหลดข้อมูลจำลองเมื่อเปิดระบบครั้งแรก (หากไม่มีข้อมูล) ---
        function seedInitialData() {
            if (!localStorage.getItem('breathsafe_hero')) {
                localStorage.setItem('breathsafe_hero', 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop');
            }
            if (!localStorage.getItem('breathsafe_news')) {
                localStorage.setItem('breathsafe_news', JSON.stringify([]));
            }
            // ไม่ seed default member แล้ว — ให้แสดง empty state ถ้ายังไม่มีข้อมูล
            // (Firestore onSnapshot จะอัปเดตให้อัตโนมัติเมื่อโหลดเสร็จ)
        }

        // --- 9.2 ระบบจัดการภาพหน้าปก (Hero Section) ---
        // ------------------------------------------------------------------
        // ------------------------------------------------------------------
        // Imgur Anonymous Upload API — ไม่ต้องสมัคร ไม่ต้องมี key ใดๆ
        // Client-ID เป็น public key ของ Imgur app (ไม่ใช่ secret)
        // docs: https://apidocs.imgur.com/#de179b6a-3eda-4406-a8d7-1fb06c17cb9c
        // ------------------------------------------------------------------
        const IMGUR_CLIENT_ID = '546c25a59c58ad7';  // Public Client-ID (ปลอดภัยใส่ใน frontend ได้)

        // Compress รูปก่อน upload — ลดขนาดเพื่อป้องกัน timeout
        async function compressBase64Image(base64DataUrl, maxWidth = 1200, quality = 0.82) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => resolve(base64DataUrl);
                img.src = base64DataUrl;
            });
        }

        // อัปโหลดรูปไป Imgur (Anonymous — ไม่ต้อง login ไม่ต้อง preset ไม่ต้อง signature)
        async function uploadImageToStorage(base64DataUrl, _storagePath) {
            // 1. Compress ก่อน
            const compressed = await compressBase64Image(base64DataUrl);
            const estimatedKB = Math.round(compressed.length * 0.75 / 1024);
            console.log(`📤 Imgur upload (~${estimatedKB} KB)`);

            // 2. ตัด header ออก → เหลือแค่ base64 string ล้วน
            const base64Pure = compressed.split(',')[1];

            // 3. Retry สูงสุด 3 ครั้ง
            let lastError;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const controller = new AbortController();
                    const tid = setTimeout(() => controller.abort(), 30000);

                    const res = await fetch('https://api.imgur.com/3/image', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ image: base64Pure, type: 'base64' }),
                        signal: controller.signal
                    });
                    clearTimeout(tid);

                    const json = await res.json();

                    if (!res.ok || !json.success) {
                        throw new Error(`Imgur: ${json?.data?.error || `HTTP ${res.status}`}`);
                    }

                    const url = json.data.link.replace('http://', 'https://');
                    console.log(`✅ Imgur OK (attempt ${attempt}): ${url}`);
                    return url;

                } catch (err) {
                    lastError = err;
                    console.warn(`⚠️ Imgur attempt ${attempt}/3:`, err.message);
                    if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt));
                }
            }
            throw new Error(`อัปโหลดไม่สำเร็จ (3 ครั้ง): ${lastError?.message}`);
        }

        // Imgur Anonymous ไม่รองรับ delete (ต้องมี account) — ไม่กระทบการทำงาน
        async function deleteImageFromStorage(_url) {
            console.info('ℹ️ Imgur anonymous: delete ไม่รองรับ — Firestore ชี้ URL ใหม่แทน');
        }

        // ------------------------------------------------------------------
        // Helper: แสดงรูปหน้าปกจาก URL
        // ------------------------------------------------------------------
        function renderHeroCoverFromUrl(url) {
            if (!url) return;
            const el = document.getElementById('hero-section');
            if (el) el.style.backgroundImage = `linear-gradient(to right, rgba(255,255,255,0.96) 35%, rgba(255,255,255,0.2)), url('${url}')`;
        }
        function renderHeroCover() {
            renderHeroCoverFromUrl(localStorage.getItem('breathsafe_hero'));
        }
        window.openHeroModal = () => {
            const existing = localStorage.getItem('breathsafe_hero');
            const previewImg = document.getElementById('hero-preview-img');
            const placeholder = document.getElementById('hero-upload-placeholder');
            document.getElementById('form-hero-file').value = '';
            if (existing) {
                previewImg.src = existing;
                previewImg.classList.remove('hidden');
                placeholder.classList.add('hidden');
                previewImg.dataset.base64 = existing;
            } else {
                previewImg.classList.add('hidden');
                placeholder.classList.remove('hidden');
                delete previewImg.dataset.base64;
            }
            openModal('modal-admin-hero');
        };
        window.processSaveHeroBanner = async () => {
            const previewImg = document.getElementById('hero-preview-img');
            const base64Data = previewImg.dataset.base64;
            if (!base64Data) return Swal.fire({ icon: 'warning', title: currentLang === 'th' ? 'ยังไม่ได้เลือกรูปภาพ' : 'No image selected', text: currentLang === 'th' ? 'กรุณาเลือกรูปภาพหน้าปกก่อนบันทึก' : 'Please choose a cover image first.', confirmButtonColor: '#3b82f6' });

            // แสดง loading
            showDustLoading(); closeActiveModal('modal-admin-hero');

            try {
                // อัปโหลดรูปไป Firebase Storage (path คงที่ — ทับรูปเก่าเสมอ)
                const imageUrl = await uploadImageToStorage(base64Data, 'hero/cover.jpg');

                if (window.fbDb && window.fbModules) {
                    // บันทึก URL ลง Firestore document "siteConfig/heroCover"
                    // onSnapshot ด้านบนจะ trigger renderHeroCoverFromUrl อัตโนมัติสำหรับทุก session
                    await window.fbModules.setDoc(
                        window.fbModules.doc(window.fbDb, 'siteConfig', 'heroCover'),
                        { imageUrl, updatedAt: Date.now() }
                    );
                } else {
                    // Offline fallback
                    localStorage.setItem('breathsafe_hero', imageUrl);
                    renderHeroCoverFromUrl(imageUrl);
                }

                hideDustLoading();
                Swal.fire({ icon: 'success', title: currentLang === 'th' ? 'บันทึกสำเร็จ! 🎉' : 'Saved! 🎉', text: currentLang === 'th' ? 'เปลี่ยนภาพหน้าปกเรียบร้อย — ผู้ใช้ทุกคนจะเห็นทันที' : 'Cover updated — all users will see it now.', timer: 2000, showConfirmButton: false });
            } catch (err) {
                console.error('processSaveHeroBanner error:', err);
                hideDustLoading();
                Swal.fire({ icon: 'error', title: currentLang === 'th' ? 'อัปโหลดไม่สำเร็จ' : 'Upload Failed', text: err.message, confirmButtonColor: '#ef4444' });
            }
        };

        // -------------------------------------------------------------
        // ระบบ Image Cropper แบบ Interactive (ไม่ใช้ library ภายนอก)
        // รองรับ 3 mode: 16:9 (hero/news), 1:1 circle (about member)
        // -------------------------------------------------------------
        let _cropState = {
            img: null, previewImgId: null, placeholderId: null,
            mode: '16:9', isCircle: false,
            // drag state
            dragging: false, resizing: false, resizeHandle: null,
            startX: 0, startY: 0,
            // crop box (normalised 0-1 relative to canvas display size)
            box: { x: 0, y: 0, w: 0, h: 0 },
            // canvas display scale: natural → displayed
            scale: 1
        };

        function handleImageFileSelect(inputEl, previewImgId, placeholderId) {
            const file = inputEl.files && inputEl.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                Swal.fire({ icon: 'error', title: currentLang === 'th' ? 'ไฟล์ไม่ถูกต้อง' : 'Invalid file', text: currentLang === 'th' ? 'กรุณาเลือกไฟล์รูปภาพเท่านั้น' : 'Please select an image file.', confirmButtonColor: '#ef4444' });
                inputEl.value = ''; return;
            }
            if (file.size > 8 * 1024 * 1024) {
                Swal.fire({ icon: 'error', title: currentLang === 'th' ? 'ไฟล์ใหญ่เกินไป' : 'File too large', text: currentLang === 'th' ? 'ขนาดไฟล์ต้องไม่เกิน 8MB' : 'File size must not exceed 8MB.', confirmButtonColor: '#ef4444' });
                inputEl.value = ''; return;
            }

            // กำหนด mode และ aspect ratio ตามช่องที่อัปโหลด
            const isAbout = previewImgId === 'about-preview-img';
            const isHero  = previewImgId === 'hero-preview-img';
            const isNews  = previewImgId === 'news-preview-img';
            _cropState.mode     = isAbout ? '1:1' : '16:9';
            _cropState.isCircle = isAbout;
            _cropState.outputW  = isAbout ? 400 : (isHero ? 1280 : 960);
            _cropState.outputH  = isAbout ? 400 : (isHero ? 720  : 540);
            _cropState.previewImgId  = previewImgId;
            _cropState.placeholderId = placeholderId;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    _cropState.img = img;
                    _openCropModal();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            inputEl.value = ''; // reset input ให้เลือกซ้ำได้
        }

        function _openCropModal() {
            const modal = document.getElementById('crop-modal');
            const canvas = document.getElementById('crop-canvas');
            const label  = document.getElementById('crop-mode-label');
            modal.classList.remove('hidden');
            modal.classList.add('flex');

            label.textContent = _cropState.isCircle
                ? 'โปรไฟล์วงกลม (1:1)'
                : (_cropState.outputW === 1280 ? 'หน้าปกเว็บ (16:9)' : 'รูปข่าว (16:9)');

            // ปรับขนาด canvas ให้พอดีหน้าจอ
            requestAnimationFrame(() => _initCropCanvas(canvas));
        }

        function _initCropCanvas(canvas) {
            const img = _cropState.img;
            const container = canvas.parentElement;
            const maxW = Math.min(container.clientWidth - 8, 680);
            const maxH = Math.min(window.innerHeight * 0.55, 420);
            const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
            const dW = Math.round(img.naturalWidth  * scale);
            const dH = Math.round(img.naturalHeight * scale);

            canvas.width  = dW;
            canvas.height = dH;
            _cropState.scale = scale;

            // คำนวณ crop box เริ่มต้นให้พอดี aspect ratio กึ่งกลางรูป
            const ar = _cropState.outputW / _cropState.outputH; // เช่น 16/9 หรือ 1
            let bW, bH;
            if (dW / dH > ar) { bH = dH * 0.9; bW = bH * ar; }
            else               { bW = dW * 0.9; bH = bW / ar; }
            bW = Math.round(bW); bH = Math.round(bH);
            _cropState.box = {
                x: Math.round((dW - bW) / 2),
                y: Math.round((dH - bH) / 2),
                w: bW, h: bH
            };
            _drawCrop(canvas);
            _attachCropEvents(canvas);
        }

        function _drawCrop(canvas) {
            const ctx = canvas.getContext('2d');
            const { img, box, isCircle, scale } = _cropState;
            const dW = canvas.width, dH = canvas.height;

            // วาดรูปต้นฉบับ
            ctx.clearRect(0, 0, dW, dH);
            ctx.drawImage(img, 0, 0, dW, dH);

            // overlay มืดนอก crop box
            ctx.fillStyle = 'rgba(0,0,0,0.52)';
            ctx.fillRect(0, 0, dW, dH);

            // เปิดแสงใน crop box
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            if (isCircle) {
                ctx.beginPath();
                ctx.ellipse(box.x + box.w/2, box.y + box.h/2, box.w/2, box.h/2, 0, 0, Math.PI*2);
                ctx.fill();
            } else {
                ctx.fillRect(box.x, box.y, box.w, box.h);
            }
            ctx.restore();

            // วาดรูปกลับมาใน crop box เพื่อให้เห็นสีจริง
            ctx.save();
            if (isCircle) {
                ctx.beginPath();
                ctx.ellipse(box.x + box.w/2, box.y + box.h/2, box.w/2, box.h/2, 0, 0, Math.PI*2);
                ctx.clip();
            } else {
                ctx.beginPath();
                ctx.rect(box.x, box.y, box.w, box.h);
                ctx.clip();
            }
            ctx.drawImage(img, 0, 0, dW, dH);
            ctx.restore();

            // เส้นขอบ crop box
            ctx.strokeStyle = '#60A5FA';
            ctx.lineWidth = 2;
            if (isCircle) {
                ctx.beginPath();
                ctx.ellipse(box.x + box.w/2, box.y + box.h/2, box.w/2, box.h/2, 0, 0, Math.PI*2);
                ctx.stroke();
            } else {
                ctx.strokeRect(box.x, box.y, box.w, box.h);
                // Rule of thirds grid
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 0.8;
                for (let i=1; i<3; i++) {
                    const gx = box.x + box.w*(i/3), gy = box.y + box.h*(i/3);
                    ctx.beginPath(); ctx.moveTo(gx, box.y); ctx.lineTo(gx, box.y+box.h); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(box.x, gy); ctx.lineTo(box.x+box.w, gy); ctx.stroke();
                }
            }

            // corner handles (ไม่แสดงถ้าเป็น circle)
            if (!isCircle) {
                const handles = _getHandles();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 2;
                handles.forEach(h => {
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, 6, 0, Math.PI*2);
                    ctx.fill(); ctx.stroke();
                });
            } else {
                // วงกลม: แสดง 4 handle resize รอบวง
                const cx = box.x + box.w/2, cy = box.y + box.h/2, r = box.w/2;
                [[cx, cy-r],[cx, cy+r],[cx-r, cy],[cx+r, cy]].forEach(([hx, hy]) => {
                    ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI*2);
                    ctx.fillStyle='#fff'; ctx.fill();
                    ctx.strokeStyle='#3B82F6'; ctx.lineWidth=2; ctx.stroke();
                });
            }
        }

        function _getHandles() {
            const { box } = _cropState;
            return [
                { id:'tl', x: box.x,           y: box.y            },
                { id:'tr', x: box.x + box.w,    y: box.y            },
                { id:'bl', x: box.x,             y: box.y + box.h   },
                { id:'br', x: box.x + box.w,     y: box.y + box.h   },
            ];
        }

        function _getCanvasPos(canvas, e) {
            const rect = canvas.getBoundingClientRect();
            const src = e.touches ? e.touches[0] : e;
            return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
        }

        function _hitHandle(pos) {
            const handles = _cropState.isCircle
                ? (() => {
                    const {box} = _cropState;
                    const cx=box.x+box.w/2, cy=box.y+box.h/2, r=box.w/2;
                    return [{id:'t',x:cx,y:cy-r},{id:'b',x:cx,y:cy+r},{id:'l',x:cx-r,y:cy},{id:'r',x:cx+r,y:cy}];
                  })()
                : _getHandles();
            for (const h of handles) {
                if (Math.hypot(pos.x-h.x, pos.y-h.y) < 12) return h.id;
            }
            return null;
        }

        function _insideBox(pos) {
            const {box} = _cropState;
            return pos.x >= box.x && pos.x <= box.x+box.w && pos.y >= box.y && pos.y <= box.y+box.h;
        }

        function _attachCropEvents(canvas) {
            // ลบ listener เก่าก่อน (clone trick)
            const fresh = canvas.cloneNode(true);
            canvas.parentNode.replaceChild(fresh, canvas);
            const c = document.getElementById('crop-canvas');

            const onStart = (e) => {
                e.preventDefault();
                const pos = _getCanvasPos(c, e);
                const handle = _hitHandle(pos);
                if (handle) {
                    _cropState.resizing = true; _cropState.resizeHandle = handle;
                } else if (_insideBox(pos)) {
                    _cropState.dragging = true;
                }
                _cropState.startX = pos.x; _cropState.startY = pos.y;
                _cropState.boxSnap = { ..._cropState.box };
            };
            const onMove = (e) => {
                e.preventDefault();
                if (!_cropState.dragging && !_cropState.resizing) return;
                const pos = _getCanvasPos(c, e);
                const dx = pos.x - _cropState.startX, dy = pos.y - _cropState.startY;
                const W = c.width, H = c.height;
                const snap = _cropState.boxSnap;
                const ar = _cropState.outputW / _cropState.outputH;

                if (_cropState.dragging) {
                    _cropState.box.x = Math.max(0, Math.min(W - snap.w, snap.x + dx));
                    _cropState.box.y = Math.max(0, Math.min(H - snap.h, snap.y + dy));
                } else if (_cropState.resizing) {
                    let { x, y, w, h } = snap;
                    const MIN = 40;
                    const h_id = _cropState.resizeHandle;

                    if (_cropState.isCircle) {
                        // สำหรับ circle: ขยายจาก center
                        const cx = x + w/2, cy = y + h/2;
                        let newR;
                        if (h_id==='t'||h_id==='b') newR = Math.abs((h_id==='t' ? snap.y+snap.h/2-pos.y : pos.y-snap.y-snap.h/2));
                        else                         newR = Math.abs((h_id==='l' ? snap.x+snap.w/2-pos.x : pos.x-snap.x-snap.w/2));
                        newR = Math.max(MIN/2, newR);
                        const maxR = Math.min(cx, W-cx, cy, H-cy);
                        newR = Math.min(newR, maxR);
                        _cropState.box = { x: cx-newR, y: cy-newR, w: newR*2, h: newR*2 };
                    } else {
                        // สำหรับ rectangle: lock aspect ratio
                        if (h_id==='br') { w = Math.max(MIN, snap.w+dx); h = w/ar; }
                        else if (h_id==='bl') { w = Math.max(MIN, snap.w-dx); h = w/ar; x = snap.x + snap.w - w; }
                        else if (h_id==='tr') { w = Math.max(MIN, snap.w+dx); h = w/ar; y = snap.y + snap.h - h; }
                        else if (h_id==='tl') { w = Math.max(MIN, snap.w-dx); h = w/ar; x = snap.x+snap.w-w; y = snap.y+snap.h-h; }
                        // clamp ไม่ให้เกินขอบ canvas
                        if (x < 0) { w += x; h = w/ar; x = 0; }
                        if (y < 0) { h += y; w = h*ar; y = 0; }
                        if (x+w > W) { w = W-x; h = w/ar; }
                        if (y+h > H) { h = H-y; w = h*ar; }
                        _cropState.box = { x, y, w: Math.max(MIN,w), h: Math.max(MIN/ar,h) };
                    }
                }
                _drawCrop(c);
            };
            const onEnd = () => { _cropState.dragging = false; _cropState.resizing = false; };

            c.addEventListener('mousedown',  onStart);
            c.addEventListener('mousemove',  onMove);
            c.addEventListener('mouseup',    onEnd);
            c.addEventListener('touchstart', onStart, { passive: false });
            c.addEventListener('touchmove',  onMove,  { passive: false });
            c.addEventListener('touchend',   onEnd);
        }

        window.applyCrop = function() {
            const canvas = document.getElementById('crop-canvas');
            const { img, box, isCircle, outputW, outputH, previewImgId, placeholderId, scale } = _cropState;

            // สร้าง output canvas ด้วยขนาดจริงที่กำหนด (ไม่ใช่ขนาด display)
            const outCanvas = document.createElement('canvas');
            outCanvas.width  = outputW;
            outCanvas.height = outputH;
            const ctx = outCanvas.getContext('2d');

            // แปลง crop box จาก canvas display coordinates → natural image coordinates
            const srcX = Math.round(box.x / scale);
            const srcY = Math.round(box.y / scale);
            const srcW = Math.round(box.w / scale);
            const srcH = Math.round(box.h / scale);

            if (isCircle) {
                ctx.beginPath();
                ctx.ellipse(outputW/2, outputH/2, outputW/2, outputH/2, 0, 0, Math.PI*2);
                ctx.clip();
            }
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH);

            const dataUrl = outCanvas.toDataURL('image/jpeg', 0.88);

            // ใส่ลง preview
            const previewImg = document.getElementById(previewImgId);
            const placeholder = document.getElementById(placeholderId);
            previewImg.src = dataUrl;
            previewImg.dataset.base64 = dataUrl;
            previewImg.classList.remove('hidden');
            if (placeholder) placeholder.classList.add('hidden');

            // ใส่ใน hidden input (สำหรับ news / about)
            if (previewImgId === 'news-preview-img') document.getElementById('form-news-image').value = dataUrl;
            if (previewImgId === 'about-preview-img') document.getElementById('form-about-image').value = dataUrl;

            // ปิด modal
            document.getElementById('crop-modal').classList.add('hidden');
            document.getElementById('crop-modal').classList.remove('flex');
        };

        window.closeCropModal = function() {
            document.getElementById('crop-modal').classList.add('hidden');
            document.getElementById('crop-modal').classList.remove('flex');
        };

        // --- 9.3 ระบบจัดการข่าวสาร (News Engine) ---
        window.renderNewsCards = () => {
            const newsData = JSON.parse(localStorage.getItem('breathsafe_news') || "[]");
            const container = document.getElementById('news-grid-container');
            const emptyState = document.getElementById('news-empty-state');
            container.innerHTML = '';
            
            if (newsData.length === 0) {
                emptyState.classList.remove('hidden'); container.classList.add('hidden');
            } else {
                emptyState.classList.add('hidden'); container.classList.remove('hidden');
                newsData.forEach(news => {
                    const editButtons = isUserAdmin ? `
                        <div class="absolute top-3 right-3 flex space-x-1.5 z-20">
                            <button onclick="editNewsRecord('${news.id}', event)" class="w-8 h-8 bg-white/90 backdrop-blur rounded-lg text-blue-600 shadow flex items-center justify-center hover:bg-blue-50 transition"><i class="fas fa-pen text-xs"></i></button>
                            <button onclick="deleteNewsRecord('${news.id}', event)" class="w-8 h-8 bg-white/90 backdrop-blur rounded-lg text-rose-600 shadow flex items-center justify-center hover:bg-rose-50 transition"><i class="fas fa-trash text-xs"></i></button>
                        </div>
                    ` : '';

                    container.innerHTML += `
                        <div onclick="viewFullNews('${news.id}')" class="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer relative flex flex-col h-full">
                            ${editButtons}
                            <div class="h-44 w-full overflow-hidden relative">
                                <img src="${news.image}" alt="News" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                            </div>
                            <div class="p-5 flex-grow flex flex-col">
                                <div class="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 bg-blue-50 w-max px-2.5 py-1 rounded-md"><i class="fas fa-clock mr-1"></i>${news.date}</div>
                                <h4 class="font-black text-slate-900 text-sm leading-snug mb-2 line-clamp-2">${news.title}</h4>
                                <p class="text-xs text-slate-500 line-clamp-2 font-medium flex-grow">${news.desc}</p>
                            </div>
                        </div>
                    `;
                });
            }
        };

        window.openNewsModal = () => {
            document.getElementById('form-news-edit-id').value = '';
            document.getElementById('form-news-title').value = '';
            document.getElementById('form-news-desc').value = '';
            document.getElementById('form-news-image').value = '';
            document.getElementById('form-news-file').value = '';
            document.getElementById('form-news-date').value = '';
            const previewImg = document.getElementById('news-preview-img');
            previewImg.classList.add('hidden');
            delete previewImg.dataset.base64;
            document.getElementById('news-upload-placeholder').classList.remove('hidden');
            document.getElementById('news-modal-title').innerHTML = `<i class="fas fa-bullhorn text-blue-500 mr-2"></i>${currentLang === 'th' ? "เขียนข่าวประกาศประชาสัมพันธ์ใหม่" : "Create New Announcement"}`;
            openModal('modal-admin-news');
        };
        
        window.processSaveNewsRecord = async () => {
            const id = document.getElementById('form-news-edit-id').value;
            const title = document.getElementById('form-news-title').value.trim();
            const desc = document.getElementById('form-news-desc').value.trim();
            const date = document.getElementById('form-news-date').value;
            // รูปภาพ: ถ้ามี base64 ใหม่ (จากการ crop) ให้ upload; ถ้าไม่มีแต่เป็นการ edit ให้ใช้ URL เดิม
            const previewImg = document.getElementById('news-preview-img');
            const newBase64 = previewImg.dataset.base64 || '';
            const existingUrl = document.getElementById('form-news-image').value.trim();
            const isBase64 = newBase64.startsWith('data:');

            if (!title || !desc || !date) return Swal.fire({ icon: 'warning', title: currentLang === 'th' ? 'ข้อมูลไม่ครบถ้วน' : 'Missing information', text: currentLang === 'th' ? 'กรุณากรอกข้อมูลให้ครบทุกช่อง' : 'Please fill in all fields.', confirmButtonColor: '#3b82f6' });
            if (!isBase64 && !existingUrl) return Swal.fire({ icon: 'warning', title: currentLang === 'th' ? 'ยังไม่มีรูปภาพ' : 'No image', text: currentLang === 'th' ? 'กรุณาอัปโหลดและครอปรูปภาพก่อนบันทึก' : 'Please upload and crop an image first.', confirmButtonColor: '#3b82f6' });

            showDustLoading(); closeActiveModal('modal-admin-news');

            try {
                let imageUrl = existingUrl;

                if (isBase64) {
                    // อัปโหลดรูปใหม่ไป Imgur
                    const timestamp = Date.now();
                    const storagePath = `news/${id || timestamp}.jpg`;
                    imageUrl = await uploadImageToStorage(newBase64, storagePath);
                }

                const newsData = { title, desc, image: imageUrl, date, timestamp: Date.now() };

                if (window.fbDb && window.fbModules) {
                    if (id) {
                        // แก้ไขข่าวเดิม (update document ที่มี id นั้น)
                        await window.fbModules.updateDoc(
                            window.fbModules.doc(window.fbDb, 'news', id), newsData
                        );
                    } else {
                        // เพิ่มข่าวใหม่ (Firestore จะสร้าง id ให้อัตโนมัติ)
                        await window.fbModules.addDoc(
                            window.fbModules.collection(window.fbDb, 'news'), newsData
                        );
                    }
                    // onSnapshot จะ trigger renderNewsCards() อัตโนมัติ ไม่ต้อง call เอง
                } else {
                    // Offline fallback
                    let list = JSON.parse(localStorage.getItem('breathsafe_news') || '[]');
                    if (id) { const i = list.findIndex(n => n.id === id); if (i > -1) list[i] = { id, ...newsData }; }
                    else list.unshift({ id: Date.now().toString(), ...newsData });
                    localStorage.setItem('breathsafe_news', JSON.stringify(list));
                    renderNewsCards();
                }

                hideDustLoading();
                Swal.fire({ icon: 'success', title: currentLang === 'th' ? 'บันทึกสำเร็จ! 🎉' : 'Saved! 🎉', text: currentLang === 'th' ? 'ข่าวถูกเผยแพร่แล้ว — ผู้ใช้ทุกคนจะเห็นทันที' : 'News published — all users will see it now.', timer: 2000, showConfirmButton: false });
            } catch (err) {
                console.error('processSaveNewsRecord error:', err);
                hideDustLoading();
                Swal.fire({ icon: 'error', title: currentLang === 'th' ? 'อัปโหลดไม่สำเร็จ' : 'Upload Failed', text: err.message, confirmButtonColor: '#ef4444' });
            }
        };

        window.editNewsRecord = (id, event) => {
            event.stopPropagation();
            const newsList = JSON.parse(localStorage.getItem('breathsafe_news') || "[]");
            const news = newsList.find(n => n.id === id);
            if(news) {
                document.getElementById('form-news-edit-id').value = news.id;
                document.getElementById('form-news-title').value = news.title;
                document.getElementById('form-news-desc').value = news.desc;
                document.getElementById('form-news-image').value = news.image;
                document.getElementById('form-news-file').value = '';
                document.getElementById('form-news-date').value = news.date;
                const previewImg = document.getElementById('news-preview-img');
                previewImg.src = news.image;
                previewImg.dataset.base64 = news.image;
                previewImg.classList.remove('hidden');
                document.getElementById('news-upload-placeholder').classList.add('hidden');
                document.getElementById('news-modal-title').innerHTML = `<i class="fas fa-pen text-amber-500 mr-2"></i>${currentLang === 'th' ? "แก้ไขข่าวสาร" : "Edit Announcement"}`;
                openModal('modal-admin-news');
            }
        };

        window.deleteNewsRecord = async (id, event) => {
            event.stopPropagation();
            const result = await Swal.fire({
                icon: 'warning',
                title: currentLang === 'th' ? 'ยืนยันการลบข่าว' : 'Confirm Delete',
                text: currentLang === 'th' ? 'ต้องการลบข่าวสารนี้ออกจากระบบหรือไม่? ไม่สามารถกู้คืนได้' : 'Delete this news permanently? This cannot be undone.',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: currentLang === 'th' ? '✕ ลบเลย' : 'Yes, delete',
                cancelButtonText: currentLang === 'th' ? 'ยกเลิก' : 'Cancel'
            });
            if (!result.isConfirmed) return;

            try {
                if (window.fbDb && window.fbModules) {
                    // หา imageUrl ก่อนลบ เพื่อลบรูปใน Storage ด้วย
                    const newsList = JSON.parse(localStorage.getItem('breathsafe_news') || '[]');
                    const targetNews = newsList.find(n => n.id === id);
                    if (targetNews?.image) await deleteImageFromStorage(targetNews.image);
                    await window.fbModules.deleteDoc(window.fbModules.doc(window.fbDb, 'news', id));
                    // onSnapshot จะ trigger renderNewsCards() อัตโนมัติ
                } else {
                    let list = JSON.parse(localStorage.getItem('breathsafe_news') || '[]');
                    localStorage.setItem('breathsafe_news', JSON.stringify(list.filter(n => n.id !== id)));
                    renderNewsCards();
                }
                Swal.fire({ icon: 'success', title: currentLang === 'th' ? 'ลบสำเร็จ' : 'Deleted', timer: 1200, showConfirmButton: false });
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#ef4444' });
            }
        };

        window.viewFullNews = (id) => {
            const newsList = JSON.parse(localStorage.getItem('breathsafe_news') || "[]");
            const news = newsList.find(n => n.id === id);
            if(news) {
                document.getElementById('view-news-img').src = news.image;
                document.getElementById('view-news-date').innerText = news.date;
                document.getElementById('view-news-title').innerText = news.title;
                document.getElementById('view-news-desc').innerText = news.desc;
                openModal('modal-news-viewer');
            }
        };

        // --- 9.4 ระบบจัดการคณะผู้จัดทำ (About Us Engine) ---
        window.renderAboutCards = () => {
            const members = JSON.parse(localStorage.getItem('breathsafe_about') || "[]");
            const container = document.getElementById('about-cards-grid');
            const loadingState = document.getElementById('about-loading-state');
            const emptyState = document.getElementById('about-empty-state');
            container.innerHTML = '';

            // ซ่อน loading, แสดง empty ถ้าไม่มีสมาชิก
            if (loadingState) loadingState.classList.add('hidden');
            if (members.length === 0) {
                if (emptyState) {
                    emptyState.classList.remove('hidden');
                    emptyState.classList.add('flex');
                }
                return;
            }
            if (emptyState) {
                emptyState.classList.add('hidden');
                emptyState.classList.remove('flex');
            }
            
            const lNickname = currentLang === 'th' ? translationDictionary.th["lbl-nickname"] : translationDictionary.en["lbl-nickname"];
            const lAge = currentLang === 'th' ? translationDictionary.th["lbl-age"] : translationDictionary.en["lbl-age"];
            const lYears = currentLang === 'th' ? translationDictionary.th["lbl-years"] : translationDictionary.en["lbl-years"];
            const lGrade = currentLang === 'th' ? translationDictionary.th["lbl-grade"] : translationDictionary.en["lbl-grade"];
            const lSchool = currentLang === 'th' ? translationDictionary.th["lbl-school"] : translationDictionary.en["lbl-school"];
            const btnEdit = currentLang === 'th' ? translationDictionary.th["btn-edit"] : translationDictionary.en["btn-edit"];
            const btnDel = currentLang === 'th' ? translationDictionary.th["btn-delete"] : translationDictionary.en["btn-delete"];

            members.forEach(member => {
                const adminControls = isUserAdmin ? `
                    <div class="flex justify-between items-center px-4 py-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                        <button onclick="editAboutRecord('${member.id}')" class="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg transition"><i class="fas fa-edit mr-1"></i>${btnEdit}</button>
                        <button onclick="deleteAboutRecord('${member.id}')" class="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg transition"><i class="fas fa-trash mr-1"></i>${btnDel}</button>
                    </div>
                ` : '';

                container.innerHTML += `
                    <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative overflow-hidden">
                        <div class="h-2 w-full bg-gradient-to-r from-blue-400 to-indigo-500 absolute top-0 left-0"></div>
                        <div class="p-6 text-center pt-8">
                            <div class="w-24 h-24 mx-auto rounded-full p-1 border border-slate-200 bg-white mb-4 shadow-sm relative group-hover:scale-105 transition duration-500">
                                <img src="${member.image || 'https://via.placeholder.com/150'}" alt="${member.name}" class="w-full h-full rounded-full object-cover">
                            </div>
                            <h4 class="font-black text-slate-900 text-base mb-1 truncate">${member.name}</h4>
                            <div class="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full inline-block mb-4 shadow-inner">${member.custom || "Team Member"}</div>
                            
                            <div class="space-y-2 text-left text-xs text-slate-600 font-medium border-t border-slate-50 pt-4">
                                <div class="flex justify-between pb-1 border-b border-slate-50">
                                    <span class="text-slate-400 font-bold">${lNickname}</span>
                                    <span class="font-bold text-slate-700">${member.nickname || '-'}</span>
                                </div>
                                <div class="flex justify-between pb-1 border-b border-slate-50">
                                    <span class="text-slate-400 font-bold">${lAge}</span>
                                    <span class="font-bold text-slate-700">${member.age ? member.age + ' ' + lYears : '-'}</span>
                                </div>
                                <div class="flex justify-between pb-1 border-b border-slate-50">
                                    <span class="text-slate-400 font-bold">${lGrade}</span>
                                    <span class="font-bold text-slate-700">${member.grade || '-'}</span>
                                </div>
                                <div class="flex flex-col pt-1">
                                    <span class="text-slate-400 font-bold mb-0.5">${lSchool}</span>
                                    <span class="font-bold text-slate-700 truncate">${member.school || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex-grow"></div>
                        ${adminControls}
                    </div>
                `;
            });
        };

        window.openAboutModal = () => {
            document.getElementById('form-about-edit-id').value = ''; document.getElementById('form-about-name').value = ''; document.getElementById('form-about-nickname').value = ''; document.getElementById('form-about-age').value = ''; document.getElementById('form-about-grade').value = ''; document.getElementById('form-about-school').value = 'โรงเรียนเตรียมอุดมศึกษาภาคใต้'; document.getElementById('form-about-image').value = ''; document.getElementById('form-about-file').value = ''; document.getElementById('form-about-custom').value = '';
            const previewImg = document.getElementById('about-preview-img');
            const placeholder = document.getElementById('about-upload-placeholder');
            previewImg.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
            delete previewImg.dataset.base64;
            document.getElementById('about-modal-title').innerHTML = `<i class="fas fa-user-plus text-blue-500 mr-2"></i>${currentLang === 'th' ? "เพิ่มข้อมูลคณะผู้จัดทำใหม่" : "Add New Member"}`; openModal('modal-admin-about');
        };

        window.processSaveAboutRecord = async () => {
            const id = document.getElementById('form-about-edit-id').value;
            const name = document.getElementById('form-about-name').value.trim();
            const nickname = document.getElementById('form-about-nickname').value.trim();
            const age = document.getElementById('form-about-age').value.trim();
            const grade = document.getElementById('form-about-grade').value.trim();
            const school = document.getElementById('form-about-school').value.trim();
            const custom = document.getElementById('form-about-custom').value.trim();
            const previewImg = document.getElementById('about-preview-img');
            const newBase64 = previewImg.dataset.base64 || '';
            const existingUrl = document.getElementById('form-about-image').value.trim();
            const isBase64 = newBase64.startsWith('data:');

            if (!name) return Swal.fire({ icon: 'warning', title: currentLang === 'th' ? 'ข้อมูลไม่ครบถ้วน' : 'Missing information', text: currentLang === 'th' ? 'กรุณาระบุชื่อ-นามสกุล' : 'Please provide a name.', confirmButtonColor: '#4f46e5' });

            showDustLoading(); closeActiveModal('modal-admin-about');

            try {
                let imageUrl = existingUrl;
                if (isBase64) {
                    // รูปโปรไฟล์วงกลม — ใช้ path unique ต่อสมาชิก
                    const uid = id || Date.now().toString();
                    imageUrl = await uploadImageToStorage(newBase64, `about/member_${uid}.jpg`);
                }

                const memberData = { name, nickname, age, grade, school, image: imageUrl, custom, order: Date.now() };

                if (window.fbDb && window.fbModules) {
                    if (id) {
                        await window.fbModules.updateDoc(
                            window.fbModules.doc(window.fbDb, 'aboutMembers', id), memberData
                        );
                    } else {
                        await window.fbModules.addDoc(
                            window.fbModules.collection(window.fbDb, 'aboutMembers'), memberData
                        );
                    }
                    // onSnapshot จะ trigger renderAboutCards() อัตโนมัติ
                } else {
                    let members = JSON.parse(localStorage.getItem('breathsafe_about') || '[]');
                    if (id) { const i = members.findIndex(m => m.id === id); if (i > -1) members[i] = { id, ...memberData }; }
                    else members.push({ id: Date.now().toString(), ...memberData });
                    localStorage.setItem('breathsafe_about', JSON.stringify(members));
                    renderAboutCards();
                }

                hideDustLoading();
                Swal.fire({ icon: 'success', title: currentLang === 'th' ? 'บันทึกสำเร็จ! 🎉' : 'Saved! 🎉', text: currentLang === 'th' ? 'ข้อมูลคณะผู้จัดทำอัปเดตแล้ว — ผู้ใช้ทุกคนจะเห็นทันที' : 'Member updated — visible to all users now.', timer: 2000, showConfirmButton: false });
            } catch (err) {
                console.error('processSaveAboutRecord error:', err);
                hideDustLoading();
                Swal.fire({ icon: 'error', title: currentLang === 'th' ? 'บันทึกไม่สำเร็จ' : 'Save Failed', text: err.message, confirmButtonColor: '#ef4444' });
            }
        };

        window.editAboutRecord = (id) => {
            const members = JSON.parse(localStorage.getItem('breathsafe_about') || "[]");
            const member = members.find(m => m.id === id);
            if(member) {
                document.getElementById('form-about-edit-id').value = member.id; document.getElementById('form-about-name').value = member.name; document.getElementById('form-about-nickname').value = member.nickname; document.getElementById('form-about-age').value = member.age; document.getElementById('form-about-grade').value = member.grade; document.getElementById('form-about-school').value = member.school; document.getElementById('form-about-image').value = member.image; document.getElementById('form-about-file').value = ''; document.getElementById('form-about-custom').value = member.custom;
                const previewImg = document.getElementById('about-preview-img');
                if (member.image) {
                    previewImg.src = member.image;
                    previewImg.dataset.base64 = member.image;
                    previewImg.classList.remove('hidden');
                    document.getElementById('about-upload-placeholder').classList.add('hidden');
                } else {
                    previewImg.classList.add('hidden');
                    delete previewImg.dataset.base64;
                    document.getElementById('about-upload-placeholder').classList.remove('hidden');
                }
                document.getElementById('about-modal-title').innerHTML = `<i class="fas fa-user-pen text-amber-500 mr-2"></i>${currentLang === 'th' ? "แก้ไขประวัติผู้จัดทำ" : "Edit Member Profile"}`; openModal('modal-admin-about');
            }
        };

        window.deleteAboutRecord = async (id) => {
            const result = await Swal.fire({
                icon: 'warning',
                title: currentLang === 'th' ? 'ยืนยันการลบสมาชิก' : 'Confirm Delete',
                text: currentLang === 'th' ? 'ต้องการลบสมาชิกคณะผู้จัดทำออกจากระบบหรือไม่? ไม่สามารถกู้คืนได้' : 'Remove this member permanently? This cannot be undone.',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: currentLang === 'th' ? '✕ ลบเลย' : 'Yes, remove',
                cancelButtonText: currentLang === 'th' ? 'ยกเลิก' : 'Cancel'
            });
            if (!result.isConfirmed) return;

            try {
                if (window.fbDb && window.fbModules) {
                    const members = JSON.parse(localStorage.getItem('breathsafe_about') || '[]');
                    const target = members.find(m => m.id === id);
                    if (target?.image) await deleteImageFromStorage(target.image);
                    await window.fbModules.deleteDoc(window.fbModules.doc(window.fbDb, 'aboutMembers', id));
                    // onSnapshot จะ trigger renderAboutCards() อัตโนมัติ
                } else {
                    let members = JSON.parse(localStorage.getItem('breathsafe_about') || '[]');
                    localStorage.setItem('breathsafe_about', JSON.stringify(members.filter(m => m.id !== id)));
                    renderAboutCards();
                }
                Swal.fire({ icon: 'success', title: currentLang === 'th' ? 'ลบสำเร็จ' : 'Removed', timer: 1200, showConfirmButton: false });
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#ef4444' });
            }
        };