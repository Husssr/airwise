// api.js — Mobile Menu, Real-time API (PM2.5, Weather, Extra AQ),
//          Member Count, News All Page, Contact Widget

    <script>
    // ฟังก์ชันเปิด-ปิด เมนูมือถือ (Bottom Sheet พร้อมแอนิเมชัน)
    function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu-dropdown');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        const isOpening = menu.classList.contains('hidden');

        if (isOpening) {
            // เปิดเมนู: แสดง backdrop และเลื่อนแผ่นเมนูขึ้นมา
            backdrop.classList.remove('hidden');
            menu.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => {
                backdrop.classList.remove('opacity-0');
                menu.classList.remove('translate-y-full');
            });
        } else {
            // ปิดเมนู: เลื่อนแผ่นเมนูลงและจางหาย ก่อนซ่อนจริง
            backdrop.classList.add('opacity-0');
            menu.classList.add('translate-y-full');
            document.body.style.overflow = '';
            setTimeout(() => {
                backdrop.classList.add('hidden');
                menu.classList.add('hidden');
            }, 300);
        }
    }
    // -------------------------------------------------------------
    // [ระบบดึงข้อมูล API ฝุ่น PM2.5 จริงจาก Open-Meteo ครบทั้ง 23 อำเภอ]
    // เอกสาร: https://open-meteo.com/en/docs/air-quality-api
    // -------------------------------------------------------------
    async function fetchRealtimeAirQuality() {
        try {
            const lats = districtsData.map(d => d.lat).join(',');
            const lngs = districtsData.map(d => d.lng).join(',');
            const apiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}&current=pm2_5&timezone=auto`;

            // ตั้ง timeout กันกรณีเครือข่ายช้าหรือ API ไม่ตอบสนอง
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`API Network Error: ${response.status}`);
            const apiData = await response.json();

            // เมื่อขอหลายพิกัดพร้อมกัน Open-Meteo จะตอบกลับเป็น Array หนึ่งรายการต่อหนึ่งอำเภอ
            const resultList = Array.isArray(apiData) ? apiData : [apiData];
            let updatedCount = 0;

            resultList.forEach((data, index) => {
                if (data && data.current && typeof data.current.pm2_5 === 'number' && !isNaN(data.current.pm2_5)) {
                    districtsData[index].pm25 = Math.max(0, Math.round(data.current.pm2_5));
                    updatedCount++;
                }
            });

            if (updatedCount === 0) throw new Error("API ตอบกลับมาแต่ไม่มีค่า PM2.5 ที่ใช้งานได้");

            // 1. อัปเดต Dashboard, ตาราง และหน้ารายละเอียด (ถ้าเปิดอยู่)
            renderDashboardWidgets();
            renderAirQualityTable();
            if (currentlySelectedDistrictIndex !== null) {
                const targetDistrict = districtsData[currentlySelectedDistrictIndex];
                const assess = evaluatePm25Tier(targetDistrict.pm25);
                document.getElementById('detail-pm-display').innerText = targetDistrict.pm25;
                document.getElementById('detail-status-pill').innerText = currentLang === 'th' ? assess.tierTh : assess.tierEn;
                document.getElementById('detail-status-pill').style.backgroundColor = assess.hexColor;
                document.getElementById('detail-accent-bar').style.backgroundColor = assess.hexColor;
                document.getElementById('detail-gauge-frame').style.borderColor = assess.hexColor;
                document.getElementById('detail-rec-text').innerText = currentLang === 'th' ? assess.adviceTh : assess.adviceEn;
            }

            // 2. อัปเดตหมุดบนแผนที่ทั้งสองตัว (หน้าแรก + หน้าแผนที่เต็ม)
            renderAllMapMarkers();

            // 3. อัปเดตสถานะแสดงเวลาล่าสุดที่ดึงข้อมูลสำเร็จ
            const statusEl = document.getElementById('pm25-source-status');
            if (statusEl) {
                const now = new Date();
                statusEl.innerHTML = `<i class="fas fa-circle text-emerald-500 text-[6px] mr-1.5 align-middle"></i>${currentLang === 'th' ? 'ข้อมูลจริงจาก Open-Meteo อัปเดตล่าสุด' : 'Live data from Open-Meteo, updated'} ${now.toLocaleTimeString(currentLang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
            }

            console.log(`🟢 อัปเดตค่า PM2.5 จริงสำเร็จ ${updatedCount}/${districtsData.length} อำเภอ`);
        } catch (error) {
            console.warn("🔴 ไม่สามารถดึงข้อมูล PM2.5 จาก API ได้:", error);
            const statusEl = document.getElementById('pm25-source-status');
            if (statusEl) {
                statusEl.innerHTML = `<i class="fas fa-circle text-amber-500 text-[6px] mr-1.5 align-middle"></i>${currentLang === 'th' ? 'ใช้ข้อมูลสำรอง (เชื่อมต่อ API ไม่สำเร็จ)' : 'Using fallback data (API unreachable)'}`;
            }
        }
    }

    // สั่งให้ระบบทำงานทันทีเมื่อโหลดหน้าเว็บเสร็จ
    window.addEventListener('DOMContentLoaded', () => {
        // หน่วงเวลาเล็กน้อยให้แผนที่/ตารางสร้างด้วยค่าเริ่มต้นก่อน (กันหน้าจอขาว) แล้วค่อยเอาของจริงมาทับ
        setTimeout(() => {
            fetchRealtimeAirQuality();
        }, 1200);

        // สั่งให้อัปเดตข้อมูลใหม่ทุกๆ 15 นาที
        setInterval(fetchRealtimeAirQuality, 900000);
    });

    // -------------------------------------------------------------
    // ระบบเชื่อม Weather API จริง จ.นครศรีธรรมราช (Open-Meteo Forecast API)
    // เอกสาร: https://open-meteo.com/en/docs
    // -------------------------------------------------------------
    async function fetchRealWeather() {
        const tempEl = document.getElementById('real-temp');
        const humidEl = document.getElementById('real-humid');
        const windEl = document.getElementById('real-wind');
        const iconEl = document.getElementById('real-weather-icon');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=8.4304&longitude=99.9631&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto', { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Weather API Error: ${response.status}`);
            const data = await response.json();
            if (!data.current) throw new Error("ไม่มีข้อมูล current ในผลลัพธ์");

            const temp = Math.round(data.current.temperature_2m);
            const humid = Math.round(data.current.relative_humidity_2m);
            const wind = Math.round(data.current.wind_speed_10m);
            const code = data.current.weather_code;

            if (tempEl) tempEl.innerText = temp + " °C";
            if (humidEl) humidEl.innerText = humid + "%";
            if (windEl) windEl.innerText = wind + " km/h";

            // ปรับไอคอนตามรหัสสภาพอากาศ (WMO Weather Code)
            if (iconEl) {
                let iconClass = "fa-cloud-sun-rain"; // ค่าเริ่มต้น
                if (code === 0) iconClass = "fa-sun";
                else if (code <= 2) iconClass = "fa-cloud-sun";
                else if (code === 3) iconClass = "fa-cloud";
                else if (code <= 48) iconClass = "fa-smog";
                else if (code <= 67) iconClass = "fa-cloud-rain";
                else if (code <= 77) iconClass = "fa-snowflake";
                else if (code <= 82) iconClass = "fa-cloud-showers-heavy";
                else if (code <= 99) iconClass = "fa-cloud-bolt";
                iconEl.className = `fas ${iconClass} absolute -right-2 -bottom-2 text-5xl text-slate-800 opacity-40`;
            }
        } catch (error) {
            console.warn("🔴 ไม่สามารถดึงข้อมูลสภาพอากาศได้:", error);
            if (tempEl && tempEl.innerText === '-- °C') tempEl.innerText = "N/A";
            if (humidEl && humidEl.innerText === '--') humidEl.innerText = "N/A";
            if (windEl && windEl.innerText === '--') windEl.innerText = "N/A";
        }
    }

    // สั่งให้ระบบดึงข้อมูลสภาพอากาศทันทีเมื่อเปิดเว็บ
    fetchRealWeather();
    
    // ตั้งเวลาให้อัปเดตสภาพอากาศอัตโนมัติทุกๆ 30 นาที (1800000 มิลลิวินาที)
    setInterval(fetchRealWeather, 1800000);

</script>


<!-- ====== Image Crop Modal (ใช้ร่วมทุกช่อง) ====== -->
<div id="crop-modal" class="hidden fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[10000] justify-center items-center p-3 md:p-6">
    <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col" style="max-height:92vh">
        <!-- Header -->
        <div class="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                    <i class="fas fa-crop-simple text-white"></i>
                </div>
                <div>
                    <div class="text-white font-extrabold text-sm">ครอปรูปภาพ</div>
                    <div id="crop-mode-label" class="text-slate-400 text-[10px] font-medium"></div>
                </div>
            </div>
            <button onclick="closeCropModal()" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
                <i class="fas fa-xmark text-sm"></i>
            </button>
        </div>

        <!-- Canvas Area -->
        <div class="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-3" style="min-height:200px">
            <div class="relative inline-block select-none" style="line-height:0">
                <canvas id="crop-canvas" class="block rounded-xl shadow-lg" style="cursor:move; max-width:100%; touch-action:none;"></canvas>
            </div>
        </div>

        <!-- Instructions + Buttons -->
        <div class="px-5 py-4 border-t border-slate-100 bg-white shrink-0">
            <div class="text-[10px] text-slate-400 font-medium mb-3 flex items-center gap-1.5">
                <i class="fas fa-circle-info text-blue-400"></i>
                ลากกล่องเพื่อเลื่อน · ลากมุมเพื่อปรับขนาด (อัตราส่วนล็อกอัตโนมัติ)
            </div>
            <div class="flex gap-3 justify-end">
                <button onclick="closeCropModal()" class="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition">
                    ยกเลิก
                </button>
                <button onclick="applyCrop()" class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-300/40 transition flex items-center gap-2">
                    <i class="fas fa-check"></i> ใช้รูปนี้
                </button>
            </div>
        </div>
    </div>
</div>

<!-- ====== Contact Widget ลอยมุมขวาล่าง (ข้อ 9) ====== -->
<div id="contact-widget" class="fixed bottom-5 right-4 z-[990] flex flex-col items-end gap-2 transition-all duration-300">
    <!-- Card ข้อมูลติดต่อ (ย่อ/ขยายได้) -->
    <div id="contact-card" class="hidden bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl shadow-slate-900/15 overflow-hidden w-64 transition-all duration-300 origin-bottom-right">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <i class="fas fa-wind text-white text-sm"></i>
                </div>
                <span class="text-white font-extrabold text-sm tracking-tight">ติดต่อ BREATHSAFE</span>
            </div>
            <button onclick="toggleContactCard()" class="text-white/80 hover:text-white transition w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20">
                <i class="fas fa-xmark text-xs"></i>
            </button>
        </div>
        <!-- Body -->
        <div class="p-4 space-y-3">
            <p class="text-[11px] text-slate-500 font-medium leading-relaxed">โครงงาน BREATHSAFE พัฒนาโดยนักเรียนโรงเรียนเตรียมอุดมศึกษาภาคใต้ ติดต่อเราผ่านช่องทางด้านล่าง</p>
            <!-- Facebook -->
            <a href="https://www.facebook.com/triamudomsouth/?locale=th_TH" target="_blank" rel="noopener noreferrer"
               class="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all group">
                <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <i class="fab fa-facebook-f text-white text-sm"></i>
                </div>
                <div>
                    <div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Facebook Page</div>
                    <div class="text-xs font-bold text-blue-700 truncate max-w-[140px]">ทรม. ภาคใต้ (Official)</div>
                </div>
                <i class="fas fa-arrow-up-right-from-square text-blue-400 text-[10px] ml-auto shrink-0"></i>
            </a>
            <!-- Instagram -->
            <a href="https://www.instagram.com/tus_breathsafe?igsh=MWp1dXlqeHhpMHgwZw==" target="_blank" rel="noopener noreferrer"
               class="flex items-center gap-3 p-3 rounded-2xl bg-pink-50 hover:bg-pink-100 transition-all group">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform" style="background: linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)">
                    <i class="fab fa-instagram text-white text-sm"></i>
                </div>
                <div>
                    <div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instagram</div>
                    <div class="text-xs font-bold text-pink-700">@tus_breathsafe</div>
                </div>
                <i class="fas fa-arrow-up-right-from-square text-pink-400 text-[10px] ml-auto shrink-0"></i>
            </a>
        </div>
    </div>

    <!-- ปุ่มลอย FAB -->
    <button id="contact-fab" onclick="toggleContactCard()"
        class="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-500/40 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
        title="ติดต่อเรา">
        <i id="contact-fab-icon" class="fas fa-headset text-xl"></i>
    </button>
</div>


<!-- ====== Bouncing Dust Balls Loading (ไม่ปิดกั้น UI) ====== -->
<style>
    #dust-loading-overlay {
        display: none;
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        background: rgba(255,255,255,0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(99,102,241,0.15);
        border-radius: 99px;
        padding: 14px 28px;
        box-shadow: 0 8px 32px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.08);
        align-items: center;
        gap: 10px;
    }
    html.dark #dust-loading-overlay {
        background: rgba(15,23,42,0.88);
        border-color: rgba(99,102,241,0.25);
    }
    .dust-ball {
        width: 12px; height: 12px;
        border-radius: 50%;
        display: inline-block;
        animation: dustBounce 0.9s ease-in-out infinite;
    }
    .dust-ball:nth-child(1){ background: #6366f1; animation-delay: 0s;    box-shadow: 0 0 8px #6366f180; }
    .dust-ball:nth-child(2){ background: #3b82f6; animation-delay: 0.12s; box-shadow: 0 0 8px #3b82f680; }
    .dust-ball:nth-child(3){ background: #a855f7; animation-delay: 0.24s; box-shadow: 0 0 8px #a855f780; }
    .dust-ball:nth-child(4){ background: #06b6d4; animation-delay: 0.36s; box-shadow: 0 0 8px #06b6d480; }
    .dust-ball:nth-child(5){ background: #f472b6; animation-delay: 0.48s; box-shadow: 0 0 8px #f472b680; }
    @keyframes dustBounce {
        0%,100% { transform: translateY(0) scale(1);    opacity: 0.5; }
        30%      { transform: translateY(-18px) scale(1.15); opacity: 1; }
        60%      { transform: translateY(3px) scale(0.92);  opacity: 0.7; }
    }
</style>
<div id="dust-loading-overlay" role="status" aria-label="กำลังอัปโหลด">
    <span class="dust-ball"></span>
    <span class="dust-ball"></span>
    <span class="dust-ball"></span>
    <span class="dust-ball"></span>
    <span class="dust-ball"></span>
</div>


<script>
    // API สำหรับเปิด/ปิด dust loading
    window.showDustLoading = function() {
        const el = document.getElementById('dust-loading-overlay');
        el.style.display = 'flex';
        el.style.opacity = '0';
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.25s ease';
            el.style.opacity = '1';
        });
        // ไม่ lock scroll — ให้ overlay ลอยด้านหน้าโดยไม่เปลี่ยนพื้นหลัง
    };
    window.hideDustLoading = function() {
        const el = document.getElementById('dust-loading-overlay');
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => { el.style.display = 'none'; el.style.transition = ''; }, 310);
        document.body.style.overflow = '';
    };

    // ============================================================
    // Dark / Light Mode Toggle
    // ============================================================
    window.toggleTheme = function() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('breathsafe_theme', isDark ? 'dark' : 'light');
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = isDark
                ? 'fas fa-moon text-indigo-300'
                : 'fas fa-sun text-yellow-500';
        }
    };
    // โหลด theme ที่บันทึกไว้
    (function initTheme() {
        const saved = localStorage.getItem('breathsafe_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'dark' || (!saved && prefersDark)) {
            document.documentElement.classList.add('dark');
            const icon = document.getElementById('theme-icon');
            if (icon) icon.className = 'fas fa-moon text-indigo-300';
        }
    })();

    // ============================================================
    // Member Count จาก Firestore จริง — นับทุกครั้งที่มีการ auth
    // ============================================================
    window.updateJoinMemberCount = async function() {
        const el = document.getElementById('join-member-count');
        if (!el) return;
        try {
            if (window.fbDb && window.fbModules) {
                const snap = await window.fbModules.getDocs(
                    window.fbModules.collection(window.fbDb, 'users')
                );
                el.textContent = snap.size.toLocaleString();
            } else { el.textContent = '0'; }
        } catch (_) { el.textContent = '0'; }
    };
    // เรียกทันทีเมื่อโหลด
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.updateJoinMemberCount, 2000);
    });

    // ============================================================
    // หน้าข่าวทั้งหมด (view-news-all)
    // ============================================================
    window.renderNewsAll = function() {
        const list = JSON.parse(localStorage.getItem('breathsafe_news') || '[]');
        const grid = document.getElementById('news-all-grid');
        const empty = document.getElementById('news-all-empty');
        if (!grid) return;
        const isAdmin = window.isUserAdmin || false;
        if (list.length === 0) {
            grid.innerHTML = '';
            empty?.classList.remove('hidden');
            empty?.classList.add('flex');
            return;
        }
        empty?.classList.add('hidden');
        empty?.classList.remove('flex');
        grid.innerHTML = list.map(n => `
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer" onclick="viewFullNews('${n.id}')">
                ${n.image ? `<div class="h-44 overflow-hidden"><img src="${n.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.parentElement.style.display='none'"></div>` : ''}
                <div class="p-4 space-y-2">
                    <div class="text-[10px] font-black text-blue-500 uppercase tracking-widest">${n.date || ''}</div>
                    <h3 class="font-black text-slate-900 text-sm leading-snug line-clamp-2">${n.title || ''}</h3>
                    <p class="text-xs text-slate-500 leading-relaxed line-clamp-3">${n.desc || ''}</p>
                    ${isAdmin ? `<div class="flex gap-2 pt-2 border-t border-slate-100">
                        <button onclick="event.stopPropagation();openNewsModal('${n.id}')" class="text-[10px] font-bold text-blue-600 hover:underline"><i class="fas fa-pen mr-1"></i>แก้ไข</button>
                        <button onclick="event.stopPropagation();deleteNewsRecord('${n.id}',event)" class="text-[10px] font-bold text-rose-500 hover:underline"><i class="fas fa-trash mr-1"></i>ลบ</button>
                    </div>` : ''}
                </div>
            </div>`).join('');

        // แสดงปุ่มเพิ่มข่าวถ้าเป็น admin
        const addBtn = document.getElementById('btn-add-news-all');
        if (addBtn) addBtn.classList[isAdmin ? 'remove' : 'add']('hidden');
    };

    window.filterNewsAll = function(q) {
        const list = JSON.parse(localStorage.getItem('breathsafe_news') || '[]');
        const filtered = q.trim()
            ? list.filter(n => (n.title+n.desc).toLowerCase().includes(q.toLowerCase()))
            : list;
        const grid = document.getElementById('news-all-grid');
        if (!grid) return;
        grid.innerHTML = filtered.map(n => `
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" onclick="viewFullNews('${n.id}')">
                ${n.image ? `<div class="h-44 overflow-hidden"><img src="${n.image}" class="w-full h-full object-cover" loading="lazy" onerror="this.parentElement.style.display='none'"></div>` : ''}
                <div class="p-4 space-y-2">
                    <div class="text-[10px] font-black text-blue-500 uppercase tracking-widest">${n.date || ''}</div>
                    <h3 class="font-black text-slate-900 text-sm leading-snug line-clamp-2">${n.title || ''}</h3>
                    <p class="text-xs text-slate-500 leading-relaxed line-clamp-3">${n.desc || ''}</p>
                </div>
            </div>`).join('');
    };

    // ============================================================
    // PM10 / O3 / CO จาก Open-Meteo Air Quality API (จริง)
    // ============================================================
    async function fetchExtraAirQuality() {
        try {
            // ใช้พิกัดใจกลาง นครศรีธรรมราช
            const res = await fetch(
                'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=8.4304&longitude=99.9631&current=pm10,ozone,carbon_monoxide&timezone=auto',
                { signal: AbortSignal.timeout(12000) }
            );
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const cur = data.current;
            if (!cur) return;

            // PM10
            const pm10El  = document.getElementById('real-pm10');
            const pm10Dot = document.getElementById('real-pm10-dot');
            if (pm10El && typeof cur.pm10 === 'number') {
                pm10El.textContent = Math.round(cur.pm10) + ' mcg/m³';
                const color = cur.pm10 <= 50 ? '#10b981' : cur.pm10 <= 100 ? '#f59e0b' : '#ef4444';
                if (pm10Dot) pm10Dot.style.backgroundColor = color;
            }

            // O3 (Ozone) — μg/m³
            const o3El  = document.getElementById('real-o3');
            const o3Dot = document.getElementById('real-o3-dot');
            if (o3El && typeof cur.ozone === 'number') {
                o3El.textContent = Math.round(cur.ozone) + ' μg/m³';
                const color = cur.ozone <= 100 ? '#10b981' : cur.ozone <= 160 ? '#f59e0b' : '#ef4444';
                if (o3Dot) o3Dot.style.backgroundColor = color;
            }

            // CO (Carbon Monoxide) — μg/m³
            const coEl  = document.getElementById('real-co');
            const coDot = document.getElementById('real-co-dot');
            if (coEl && typeof cur.carbon_monoxide === 'number') {
                coEl.textContent = Math.round(cur.carbon_monoxide) + ' μg/m³';
                const color = cur.carbon_monoxide <= 4000 ? '#10b981' : cur.carbon_monoxide <= 9000 ? '#f59e0b' : '#ef4444';
                if (coDot) coDot.style.backgroundColor = color;
            }
        } catch (e) {
            console.warn('fetchExtraAirQuality:', e.message);
        }
    }
    fetchExtraAirQuality();
    setInterval(fetchExtraAirQuality, 900000); // อัปเดตทุก 15 นาที

    // ============================================================
    // Contact Widget fix — ให้ toggle ได้ทุก view
    // ============================================================
    window.toggleContactCard = function() {
        const card = document.getElementById('contact-card');
        const icon = document.getElementById('contact-fab-icon');
        if (!card) return;
        const isOpen = !card.classList.contains('hidden');
        if (isOpen) {
            card.classList.add('hidden');
            if (icon) icon.className = 'fas fa-headset text-xl';
        } else {
            card.classList.remove('hidden');
            if (icon) icon.className = 'fas fa-xmark text-xl';
        }
    };
</script>