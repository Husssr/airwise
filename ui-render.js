// ui-render.js — เครื่องยนต์เปลี่ยนภาษา, แสดงผล Dashboard, ซูมแผนที่

        // [8] เครื่องยนต์เปลี่ยนภาษาและการแสดงผล UI หลัก (Render Engine)
        // -------------------------------------------------------------
        window.changeLanguage = function(langCode) {
            currentLang = langCode;
            document.documentElement.lang = currentLang;
            
            // ปรับเปลี่ยนข้อความแบบคงที่ตามพจนานุกรม
            for (const key in translationDictionary[currentLang]) {
                const elements = document.querySelectorAll(`.lang-${key}`);
                elements.forEach(el => { el.innerHTML = translationDictionary[currentLang][key]; });
            }

            // เรนเดอร์ส่วนประกอบระบบใหม่เพื่อให้ข้อมูลอัปเดตภาษา
            renderDashboardWidgets();
            renderAirQualityTable();
            renderNewsCards();
            renderAboutCards();
            
            // กรณีเปิดหน้าต่างรายละเอียดค้างไว้ ให้รีเซ็ตข้อความด้วย
            if (currentlySelectedDistrictIndex !== null) {
                resetAudioPlaybackUIState(isAudioPlayingState);
                const targetDistrict = districtsData[currentlySelectedDistrictIndex];
                document.getElementById('detail-title-name').innerText = currentLang === 'th' ? targetDistrict.th : targetDistrict.en;
                const assess = evaluatePm25Tier(targetDistrict.pm25);
                document.getElementById('detail-status-pill').innerText = currentLang === 'th' ? assess.tierTh : assess.tierEn;
                document.getElementById('detail-rec-text').innerText = currentLang === 'th' ? assess.adviceTh : assess.adviceEn;
                renderDistrictIssuesPanel(targetDistrict);
            }
        };


        function renderDashboardWidgets() {
            // คำนวณค่าฝุ่นเฉลี่ยจังหวัด
            const totalPm25 = districtsData.reduce((sum, d) => sum + d.pm25, 0);
            const avgPm25 = Math.round(totalPm25 / districtsData.length);
            const avgAssess = evaluatePm25Tier(avgPm25);

            document.getElementById('overall-pm25-val').innerText = avgPm25;
            document.getElementById('air-provincial-avg').innerText = avgPm25;
            document.getElementById('overall-status-text').innerText = currentLang === 'th' ? avgAssess.tierTh : avgAssess.tierEn;
            document.getElementById('overall-card-bg').style.backgroundColor = avgAssess.hexColor;

            // อัปเดตเวลาเรียลไทม์จำลอง
            const now = new Date();
            document.getElementById('current-time-widget').innerText = now.toLocaleString(currentLang === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'short', timeStyle: 'short' });

            // ดึง 3 พื้นที่เสี่ยงสูงสุด (Top 3 Risk Areas)
            const sortedDistricts = [...districtsData].sort((a, b) => b.pm25 - a.pm25).slice(0, 3);
            const topRiskContainer = document.getElementById('top-risk-container');
            topRiskContainer.innerHTML = '';
            
            sortedDistricts.forEach((dist, i) => {
                const a = evaluatePm25Tier(dist.pm25);
                const distName = currentLang === 'th' ? dist.th : dist.en;
                topRiskContainer.innerHTML += `
                    <div class="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition cursor-pointer" onclick="enterDistrictDeepAnalysisView(${districtsData.findIndex(d => d.th === dist.th)})">
                        <div class="flex items-center"><span class="w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-black mr-2 shadow-sm" style="background-color: ${a.hexColor}">${i+1}</span> <span class="truncate max-w-[120px] text-slate-700">${distName}</span></div>
                        <div class="font-black text-slate-900">${dist.pm25} <span class="text-[9px] font-bold text-slate-400 font-normal">mcg</span></div>
                    </div>
                `;
            });

            // อัปเดตจำนวนสมาชิก
            updateJoinMemberCount();
        }

        // ===== ซูมแผนที่กลับไปที่นครศรีธรรมราช =====
        window.zoomToNakhonSiThammarat = function() {
            const nstCenter = [8.4333, 99.9667];
            if (!mainMapInstance) return;
            mainMapInstance.flyTo(nstCenter, 9, {
                animate: true,
                duration: 1.4,
                easeLinearity: 0.3
            });
        };

        // ===== ดึงจำนวนสมาชิก (นับจาก Firestore users collection หรือ fallback) =====
        async function updateJoinMemberCount() {
            const countEl = document.getElementById('join-member-count');
            if (!countEl) return;
            try {
                if (window.fbDb && window.fbModules) {
                    // นับ documents ใน "users" collection (Firebase Auth users ที่บันทึก profile)
                    // ถ้ายังไม่มี collection ให้ fallback เป็น 0
                    const snap = await window.fbModules.getDocs(window.fbModules.collection(window.fbDb, 'users'));
                    countEl.textContent = snap.size.toLocaleString();
                } else {
                    countEl.textContent = '0';
                }
            } catch (_) {
                countEl.textContent = '0';
            }
        }

        function renderAirQualityTable() {
            const tableBody = document.getElementById('main-district-table');
            tableBody.innerHTML = '';
            
            districtsData.forEach((district, index) => {
                const assess = evaluatePm25Tier(district.pm25);
                const name = currentLang === 'th' ? district.th : district.en;
                const assessTier = currentLang === 'th' ? assess.tierTh : assess.tierEn;
                const analyzeBtnText = currentLang === 'th' ? translationDictionary.th["btn-analyze"] : translationDictionary.en["btn-analyze"];
                
                tableBody.innerHTML += `
                    <tr class="hover:bg-slate-50/80 transition-colors duration-200 cursor-pointer border-b border-slate-50" onclick="enterDistrictDeepAnalysisView(${index})">
                        <td class="p-4 pl-6 font-bold text-slate-800">${name}</td>
                        <td class="p-4 text-center"><span class="font-black text-lg text-slate-900">${district.pm25}</span></td>
                        <td class="p-4"><span class="px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-wider shadow-sm" style="background-color: ${assess.hexColor};">${assessTier}</span></td>
                        <td class="p-4 text-center">
                            <button class="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:text-blue-600 hover:border-blue-200 transition"><i class="fas fa-magnifying-glass-chart mr-1.5"></i>${analyzeBtnText}</button>
                        </td>
                    </tr>
                `;
            });
        }

        // -------------------------------------------------------------
        // [9] ระบบจัดการข้อมูลอัตโนมัติ (Hybrid LocalStorage & Memory CRUD)
        // -------------------------------------------------------------