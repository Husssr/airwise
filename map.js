// map.js — GIS Map Engine (Leaflet): สร้างแผนที่ + วาดหมุด 23 อำเภอ

        // [7] เครื่องยนต์จำลองระบบแผนที่ภูมิสารสนเทศ (GIS Mapping Engine)
        // -------------------------------------------------------------
        function initializeMaps() {
            // ศูนย์กลางพิกัดจังหวัดนครศรีธรรมราช
            const nstCenter = [8.4333, 99.9667]; 
            
            // 7.1 สร้างแผนที่จิ๋วในหน้าแรก (Home Mini Map)
            homeMiniMapInstance = L.map('home-mini-map', { zoomControl: false, attributionControl: false }).setView(nstCenter, 8);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(homeMiniMapInstance);

            // 7.2 สร้างแผนที่ขนาดใหญ่หน้าหลัก (Main Map)
            mainMapInstance = L.map('full-screen-gis-map').setView(nstCenter, 9);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors & CARTO'
            }).addTo(mainMapInstance);

            // วาดหมุดข้อมูลทั้ง 23 อำเภอครั้งแรก
            renderAllMapMarkers();
        }

        // ฟังก์ชันวาดหมุดทั้งหมดลงบนแผนที่ (เรียกได้ซ้ำทุกครั้งที่ข้อมูล PM2.5 อัปเดตจาก API จริง)
        function renderAllMapMarkers() {
            if (!mainMapInstance || !homeMiniMapInstance) return;

            // ลบหมุดเก่าทั้งหมดออกก่อนวาดใหม่ ป้องกันหมุดซ้อนกัน
            mainMapMarkersArray.forEach(m => mainMapInstance.removeLayer(m));
            miniMapMarkersArray.forEach(m => homeMiniMapInstance.removeLayer(m));
            mainMapMarkersArray = [];
            miniMapMarkersArray = [];

            districtsData.forEach((district, index) => {
                const assess = evaluatePm25Tier(district.pm25);
                
                // ออกแบบไอคอนหมุดแผนที่ให้แสดงตัวเลขค่าฝุ่น
                const customIconHtml = `
                    <div style="background-color: ${assess.hexColor}; color: white; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transform: translate(-50%, -50%);">
                        ${district.pm25}
                    </div>
                    <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${assess.hexColor}; position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%);"></div>
                `;

                const markerIcon = L.divIcon({ html: customIconHtml, className: 'custom-gis-marker', iconSize: [32, 32] });

                const mapPopupTemplate = `
                    <div class="text-center p-2 space-y-2 min-w-[150px]">
                        <h4 class="font-black text-sm text-slate-800">${district.th}</h4>
                        <div class="text-2xl font-black" style="color: ${assess.hexColor}">${district.pm25} <span class="text-[9px] text-slate-400">mcg/m³</span></div>
                        <div class="text-[10px] font-bold text-white px-2 py-1 rounded-full uppercase" style="background-color: ${assess.hexColor}">${assess.tierTh}</div>
                        <button onclick="enterDistrictDeepAnalysisView(${index})" class="mt-2 w-full bg-slate-900 text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-slate-800 transition">วิเคราะห์เชิงลึก</button>
                    </div>
                `;

                const mainMarker = L.marker([district.lat, district.lng], { icon: markerIcon }).addTo(mainMapInstance).bindPopup(mapPopupTemplate);
                const miniMarker = L.marker([district.lat, district.lng], { icon: markerIcon }).addTo(homeMiniMapInstance);

                mainMapMarkersArray.push(mainMarker);
                miniMapMarkersArray.push(miniMarker);
            });
        }