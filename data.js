// data.js — ข้อมูลสถิติ 23 อำเภอ, เนื้อหาปัญหา/แนวทาง, พจนานุกรมแปลภาษา

// 1. [ข้อมูลพื้นฐาน] รายชื่ออำเภอ พิกัด และค่าฝุ่นเริ่มต้น (จะถูก API ทับค่า)
let districtsData = [
    { th: "อำเภอเมืองนครศรีธรรมราช", en: "Mueang District", lat: 8.4330, lng: 99.9634, pm25: 15 },
    { th: "อำเภอพรหมคีรี", en: "Phrom Khiri District", lat: 8.5211, lng: 99.8242, pm25: 15 },
    { th: "อำเภอลานสกา", en: "Lan Saka District", lat: 8.3242, lng: 99.7891, pm25: 15 },
    { th: "อำเภอฉวาง", en: "Chawang District", lat: 8.4239, lng: 99.5086, pm25: 15 },
    { th: "อำเภอพิปูน", en: "Phipun District", lat: 8.5639, lng: 99.5539, pm25: 15 },
    { th: "อำเภอเชียรใหญ่", en: "Chian Yai District", lat: 8.0833, lng: 100.1167, pm25: 15 },
    { th: "อำเภอชะอวด", en: "Cha-uat District", lat: 7.9667, lng: 99.9997, pm25: 15 },
    { th: "อำเภอท่าศาลา", en: "Tha Sala District", lat: 8.6667, lng: 99.9167, pm25: 15 },
    { th: "อำเภอทุ่งสง", en: "Thung Song District", lat: 8.1667, lng: 99.6833, pm25: 15 },
    { th: "อำเภอถ้ำพรรณรา", en: "Tham Phannara District", lat: 8.4331, lng: 99.3900, pm25: 15 },
    { th: "อำเภอทุ่งใหญ่", en: "Thung Yai District", lat: 8.3000, lng: 99.3667, pm25: 15 },
    { th: "อำเภอบางขัน", en: "Bang Khan District", lat: 8.0167, lng: 99.4667, pm25: 15 },
    { th: "อำเภอปากพนัง", en: "Pak Phanang District", lat: 8.3500, lng: 100.2000, pm25: 15 },
    { th: "อำเภอร่อนพิบูลย์", en: "Ron Phibun District", lat: 8.1833, lng: 99.8500, pm25: 15 },
    { th: "อำเภอสิชล", en: "Sichon District", lat: 8.9167, lng: 99.9000, pm25: 15 },
    { th: "อำเภอขนอม", en: "Khanom District", lat: 9.2000, lng: 99.8667, pm25: 15 },
    { th: "อำเภอหัวไทร", en: "Hua Sai District", lat: 7.8833, lng: 100.3167, pm25: 15 },
    { th: "อำเภอพระพรหม", en: "Phra Phrom District", lat: 8.3000, lng: 99.9167, pm25: 15 },
    { th: "อำเภอจุฬาภรณ์", en: "Chulabhorn District", lat: 8.0667, lng: 99.8500, pm25: 15 },
    { th: "อำเภอเฉลิมพระเกียรติ", en: "Chalerm Prakiat District", lat: 8.1281, lng: 100.0381, pm25: 15 },
    { th: "อำเภอนบพิตำ", en: "Nopphitam District", lat: 8.7119, lng: 99.7547, pm25: 15 },
    { th: "อำเภอช้างกลาง", en: "Chang Klang District", lat: 8.3578, lng: 99.5583, pm25: 15 },
    { th: "อำเภอนาบอน", en: "Na Bon District", lat: 8.2667, lng: 99.7833, pm25: 15 }
];

// 1.1 [ข้อมูลเชิงลึก] ปัญหาฝุ่นหลักและแนวทางแก้ไขรายอำเภอ (ทั้ง 23 อำเภอ)
const districtIssuesData = {
    "อำเภอขนอม": { causes: ["ควันดำจากเรือประมงและเรือท่องเที่ยว", "ฝุ่นจากรถยนต์และการคมนาคม", "การเผาเศษวัสดุทางการเกษตร"], solutions: ["ตรวจสภาพเครื่องยนต์เรือและรถยนต์อย่างสม่ำเสมอ", "ลดการเผาในพื้นที่เกษตร", "เพิ่มพื้นที่สีเขียวและต้นไม้ริมถนน"] },
    "อำเภอสิชล": { causes: ["ควันจากเรือประมง", "ฝุ่นจากรถยนต์", "การเผาเศษวัสดุทางการเกษตร"], solutions: ["ควบคุมควันดำจากเรือและรถยนต์", "ส่งเสริมการทำปุ๋ยหมักแทนการเผา", "เพิ่มการตรวจวัดคุณภาพอากาศ"] },
    "อำเภอท่าศาลา": { causes: ["ฝุ่นจากรถยนต์", "ควันจากเรือประมง", "การเผาเศษวัสดุทางการเกษตร"], solutions: ["ลดการเผาในพื้นที่เกษตร", "ตรวจสภาพรถยนต์และเรือ", "เพิ่มพื้นที่สีเขียวในชุมชน"] },
    "อำเภอปากพนัง": { causes: ["โรงงานแปรรูปปลา", "ควันจากเรือประมง", "ฝุ่นจากรถยนต์"], solutions: ["ติดตั้งระบบบำบัดฝุ่นและกลิ่นในโรงงาน", "ควบคุมการปล่อยมลพิษจากเรือ", "ลดการเผาในพื้นที่เกษตร"] },
    "อำเภอหัวไทร": { causes: ["ควันจากเรือประมง", "ฝุ่นจากรถยนต์", "การเผาเศษวัสดุทางการเกษตร"], solutions: ["ลดการเผาในพื้นที่โล่ง", "ตรวจสภาพเครื่องยนต์เรือและรถ", "เพิ่มพื้นที่สีเขียว"] },
    "อำเภอเชียรใหญ่": { causes: ["การเผาเศษวัสดุทางการเกษตร", "ฝุ่นจากการคมนาคม"], solutions: ["ส่งเสริมเกษตรปลอดการเผา", "ควบคุมควันดำจากรถยนต์", "รณรงค์ลดการเผาในชุมชน"] },
    "อำเภอลานสกา": { causes: ["การเผากิ่งไม้และใบไม้ในสวน", "ฝุ่นจากสารเคมีทางการเกษตร"], solutions: ["ทำปุ๋ยหมักจากเศษพืช", "ลดการใช้สารเคมี", "ส่งเสริมเกษตรอินทรีย์"] },
    "อำเภอพรหมคีรี": { causes: ["การเผาในสวนผลไม้และสวนยาง", "ฝุ่นจากการทำเกษตร"], solutions: ["งดเผาเศษวัสดุทางการเกษตร", "ส่งเสริมการไถกลบ", "ลดการใช้สารเคมี"] },
    "อำเภอนบพิตำ": { causes: ["การเผาเศษวัสดุทางการเกษตร", "ฝุ่นจากสารเคมี"], solutions: ["ส่งเสริมเกษตรอินทรีย์", "ลดการเผาในสวน", "อนุรักษ์พื้นที่ป่า"] },
    "อำเภอพิปูน": { causes: ["การเผาในสวนยางพารา", "ฝุ่นจากกิจกรรมเกษตร"], solutions: ["งดการเผาในสวน", "ทำปุ๋ยหมักจากเศษพืช", "เฝ้าระวังไฟป่า"] },
    "อำเภอฉวาง": { causes: ["โรงงานแปรรูปไม้ยาง", "การเผาเศษวัสดุทางการเกษตร"], solutions: ["ติดตั้งระบบกรองฝุ่นในโรงงาน", "ลดการเผาในสวน", "เพิ่มการตรวจวัดคุณภาพอากาศ"] },
    "อำเภอถ้ำพรรณรา": { causes: ["การเผาเศษวัสดุทางการเกษตร", "ฝุ่นจากสารเคมี"], solutions: ["ส่งเสริมการทำปุ๋ยหมัก", "ลดการใช้สารเคมี", "ป้องกันไฟป่า"] },
    "อำเภอช้างกลาง": { causes: ["โรงงานแปรรูปไม้ยาง", "การเผาในสวนผลไม้และสวนยาง"], solutions: ["ควบคุมฝุ่นจากโรงงาน", "ลดการเผาในพื้นที่เกษตร", "ส่งเสริมเกษตรยั่งยืน"] },
    "อำเภอจุฬาภรณ์": { causes: ["โรงงานแปรรูปไม้ยาง", "การเผาเศษวัสดุทางการเกษตร"], solutions: ["ติดตั้งระบบกรองฝุ่น", "งดการเผาในสวน", "เพิ่มพื้นที่สีเขียว"] },
    "อำเภอเมืองนครศรีธรรมราช": { causes: ["การจราจรหนาแน่น", "ฝุ่นจากถนน", "ควันจากรถยนต์"], solutions: ["ลดปัญหาการจราจรติดขัด", "ตรวจสภาพรถยนต์", "ล้างถนนและเพิ่มพื้นที่สีเขียว"] },
    "อำเภอทุ่งสง": { causes: ["โรงงานปูนซีเมนต์", "โรงโม่หิน", "รถบรรทุกขนส่ง"], solutions: ["ติดตั้งระบบดักจับฝุ่น", "ฉีดพ่นน้ำลดฝุ่น", "ควบคุมรถบรรทุก"] },
    "อำเภอร่อนพิบูลย์": { causes: ["โรงงานปูนซีเมนต์", "โรงโม่หิน", "การระเบิดหินปูน"], solutions: ["ควบคุมการระเบิดหิน", "ติดตั้งระบบกรองฝุ่น", "ตรวจวัดคุณภาพอากาศอย่างต่อเนื่อง"] },
    "อำเภอทุ่งใหญ่": { causes: ["โรงเลื่อยไม้", "การเผาขยะ"], solutions: ["ควบคุมฝุ่นจากโรงเลื่อย", "งดการเผาขยะ", "ส่งเสริมการคัดแยกขยะ"] },
    "อำเภอชะอวด": { causes: ["การเผาใบยางพารา", "ไฟป่าพรุ", "ฝุ่นควันข้ามพื้นที่"], solutions: ["งดการเผาใบยาง", "จัดทำแนวกันไฟ", "เฝ้าระวังไฟป่าพรุ"] },
    "อำเภอบางขัน": { causes: ["การเผาใบยางพารา", "ฝุ่นจากกิจกรรมเกษตร"], solutions: ["ส่งเสริมเกษตรปลอดการเผา", "ทำปุ๋ยหมักจากเศษพืช", "ลดการใช้สารเคมี"] },
    "อำเภอนาบอน": { causes: ["การเผาเศษวัสดุทางการเกษตร", "ฝุ่นจากการทำเกษตร"], solutions: ["งดการเผาในพื้นที่เกษตร", "ส่งเสริมการใช้ประโยชน์จากเศษวัสดุเหลือใช้", "ลดการใช้สารเคมี"] },
    "อำเภอพระพรหม": { causes: ["การเผาฟางข้าวหลังเก็บเกี่ยว", "ฝุ่นจากการเกษตร"], solutions: ["ส่งเสริมการไถกลบตอซัง", "งดเผาฟางข้าว", "เพิ่มพื้นที่สีเขียว"] },
    "อำเภอเฉลิมพระเกียรติ": { causes: ["การเผาฟางข้าวและเศษวัสดุทางการเกษตร", "ฝุ่นจากกิจกรรมเกษตร"], solutions: ["ส่งเสริมเกษตรปลอดการเผา", "ผลิตปุ๋ยหมักจากเศษพืช", "รณรงค์ลดการเผาในชุมชน"] }
};

        // -------------------------------------------------------------
        // [2] พจนานุกรมการแปลสลับภาษาเรียลไทม์ (Comprehensive Translation Dictionary)
        // -------------------------------------------------------------
        const translationDictionary = {
            th: {
                "nav-home": "<i class='fas fa-home mr-1.5'></i>หน้าแรก", "nav-air": "<i class='fas fa-chart-pie mr-1.5'></i>ข้อมูลคุณภาพอากาศ", "nav-map": "<i class='fas fa-map-marked-alt mr-1.5'></i>แผนที่มลพิษ", "nav-about": "<i class='fas fa-id-card mr-1.5'></i>คณะผู้จัดทำ", "nav-join": "<i class='fas fa-sign-in-alt mr-1.5'></i>เข้าสู่ระบบ",
                "edit-hero": "เปลี่ยนภาพหน้าปก", "hero-badge": "Nakhon Si Thammarat PM2.5 Watch", "hero-title": "อากาศบริสุทธิ์<br><span class='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'>เพื่อชุมชนสุขภาพดี</span>", "hero-desc": "นวัตกรรมระบบฐานข้อมูลภูมิสารสนเทศและการรายงานสถิติฝุ่นละอองขนาดเล็กเรียลไทม์ ครอบคลุมพื้นที่ทั้ง 23 อำเภอ ขับเคลื่อนการเฝ้าระวังโดยโรงเรียนเตรียมอุดมศึกษาภาคใต้", "hero-btn1": "<i class='fas fa-chart-line mr-2'></i>ตรวจสอบรายอำเภอ", "hero-btn2": "<i class='fas fa-map-marked-alt mr-2'></i>เปิดแผนที่ขนาดใหญ่",
                "dash-status": "<i class='fas fa-gauge-high text-blue-500 mr-2'></i>สถานการณ์ภาพรวมจังหวัด", "dash-aqi": "ค่าเฉลี่ยฝุ่นละออง", "dash-time": "อัปเดต:", "dash-map": "<i class='fas fa-map-location-dot text-blue-500 mr-2'></i>พิกัดความหนาแน่นเชิงพื้นที่", "dash-map-btn": "ขยายแผนที่", "dash-top": "<i class='fas fa-triangle-exclamation text-amber-500 mr-2'></i>พื้นที่เฝ้าระวังค่าฝุ่นสูงสุด", "dash-weather": "สภาพอากาศเฉลี่ย",
                "news-header": "<i class='fas fa-newspaper text-blue-600 mr-2'></i>ข่าวสารประชาสัมพันธ์และกิจกรรมความเคลื่อนไหว", "news-empty": "ขณะนี้ยังไม่มีข่าวสารหรือประกาศแจ้งเตือนหน้าเว็บไซต์",
                "air-avg-title": "<i class='fas fa-calculator text-blue-500 mr-2.5'></i>คำนวณค่าดัชนีเฉลี่ยถ่วงน้ำหนักรวมจังหวัด", "air-avg-desc": "ระบบทำการเชื่อมโยงข้อมูลและดึงค่าเฉลี่ยค่าน้ำหนักฝุ่นละอองจากสถานีเครือข่ายชุมชนในพิกัดทั้ง 23 อำเภอของจังหวัดนครศรีธรรมราชแบบเรียลไทม์", "air-table-title": "<i class='fas fa-table-list text-blue-500 mr-2'></i>รายงานดัชนีคุณภาพอากาศแยกตามเขตการปกครอง", "air-hint": "คำแนะนำผู้ใช้งาน: ท่านสามารถคลิกเลือกที่แถวรายชื่อของอำเภอใดๆ ที่ต้องการ เพื่อเข้าสู่โหมดวิเคราะห์ระดับลึก พร้อมรับฟังเสียงสรุปรายงานและคำแนะนำด้านการดูแลสุขภาวะอนามัย", "th-district": "เขตพื้นที่ปกครอง (District)", "th-pm": "ปริมาณฝุ่น PM2.5 (mcg/m³)", "th-status": "เกณฑ์การประเมินสภาวะแวดล้อม", "th-action": "ตัวเลือกการวิเคราะห์",
                "detail-back": "ย้อนกลับไปตารางสรุปรวม", "detail-sub": "ข้อมูลรายงานจากสถานีเครือข่าย", "detail-rec-title": "<i class='fas fa-user-doctor mr-1.5 text-sm'></i>ข้อแนะนำการปฏิบัติปฏิบัติตนด้านสาธารณสุข", "detail-voice": "รับฟังรายงานเสียงสรุป", "audio-listen": "รับฟังรายงานเสียงสรุป", "audio-stop": "หยุดฟังรายงานเสียง",
                "detail-cause-title": "ปัญหาหลักที่ก่อให้เกิดฝุ่นในพื้นที่", "detail-solution-title": "แนวทางการแก้ไขปัญหา", "detail-no-data": "ยังไม่มีข้อมูลรายละเอียดสำหรับอำเภอนี้",
                "map-main-title": "<i class='fas fa-map-location text-blue-500 mr-2'></i>ศูนย์ข้อมูลภูมิสารสนเทศแสดงพิกัดมลพิษสิ่งแวดล้อมทางอากาศ",
                "about-title": "คณะผู้จัดทำและพัฒนาโครงงาน", "about-desc": "โครงงานระบบฐานข้อมูลสารสนเทศเพื่อความปลอดภัยทางสิ่งแวดล้อม พัฒนาโดยนักเรียนโรงเรียนเตรียมอุดมศึกษาภาคใต้", "about-add": "เพิ่มข้อมูลคณะผู้จัดทำ",
                "auth-title": "ยืนยันตัวตนเข้าใช้งาน", "auth-subtitle": "ระบบสมาชิกเพื่อบันทึกและติดตามสถิติการรับมลพิษรายวัน", "auth-email": "บัญชีอีเมลผู้ใช้งาน (Email)", "auth-pass": "รหัสผ่านความปลอดภัย (Password)", "auth-btn-in": "ลงชื่อเข้าใช้ระบบ", "auth-btn-up": "สมัครเปิดบัญชีใหม่", "auth-or": "หรือล็อกอินผ่านช่องทาง", "auth-google": "เข้าสู่ระบบด้วยบัญชี Google",
                "btn-analyze": "วิเคราะห์เชิงลึก", "btn-edit": "แก้ไข", "btn-delete": "ลบ",
                "lbl-nickname": "ชื่อเล่น:", "lbl-age": "อายุ:", "lbl-years": "ปี", "lbl-grade": "ชั้น ม.:", "lbl-school": "โรงเรียน:",
                "status-ex": "ดีมาก", "status-g": "ดี", "status-m": "ปานกลาง", "status-u": "เริ่มมีผลกระทบ", "status-h": "อันตราย",
                "news-view-all": "ดูข่าวทั้งหมด",
                "join-section-title": "เข้าร่วมเป็นส่วนหนึ่งของการเปลี่ยนแปลง",
                "join-section-desc": "ร่วมกันเฝ้าระวังคุณภาพอากาศเพื่อชุมชนที่ดีขึ้น เป็นส่วนหนึ่งของเครือข่าย BREATHSAFE",
                "join-section-btn": "<i class='fas fa-user-plus mr-2'></i>เข้าร่วมเครือข่าย",
                "join-section-count": "สมาชิกที่เข้าร่วมแล้ว",
                "map-zoom-nst": "<i class='fas fa-location-crosshairs mr-1.5'></i>นครศรีธรรมราช"
            },
            en: {
                "nav-home": "<i class='fas fa-home mr-1.5'></i>Home", "nav-air": "<i class='fas fa-chart-pie mr-1.5'></i>Air Quality", "nav-map": "<i class='fas fa-map-marked-alt mr-1.5'></i>Pollution Map", "nav-about": "<i class='fas fa-id-card mr-1.5'></i>About Us", "nav-join": "<i class='fas fa-sign-in-alt mr-1.5'></i>Join Us",
                "edit-hero": "Change Cover", "hero-badge": "Nakhon Si Thammarat PM2.5 Watch", "hero-title": "Clean Air For<br><span class='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'>Healthy Communities</span>", "hero-desc": "Innovative Geospatial GIS database and real-time PM2.5 monitoring software covering all 23 districts. Driven by Triam Udom Suksa School of the South.", "hero-btn1": "<i class='fas fa-chart-line mr-2'></i>Check Districts", "hero-btn2": "<i class='fas fa-map-marked-alt mr-2'></i>View GIS Map",
                "dash-status": "<i class='fas fa-gauge-high text-blue-500 mr-2'></i>Provincial Overview", "dash-aqi": "Average PM2.5", "dash-time": "Updated:", "dash-map": "<i class='fas fa-map-location-dot text-blue-500 mr-2'></i>Density Analysis View", "dash-map-btn": "Expand Map", "dash-top": "<i class='fas fa-triangle-exclamation text-amber-500 mr-2'></i>Highest PM2.5 High Alerts", "dash-weather": "Weather Avg",
                "news-header": "<i class='fas fa-newspaper text-blue-600 mr-2'></i>Public News & Environment Updates", "news-empty": "Currently, there are no news updates or announcements published on this website.",
                "air-avg-title": "<i class='fas fa-calculator text-blue-500 mr-2.5'></i>Provincial Weighted PM2.5 Average", "air-avg-desc": "The platform aggregates and calculates the real-time average dust weight distribution directly from community stations across all 23 districts in Nakhon Si Thammarat.", "air-table-title": "<i class='fas fa-table-list text-blue-500 mr-2'></i>Air Quality Index Table by Administrative District", "air-hint": "User Guide: You can click anywhere on a district's row to enter deep analysis mode, trigger AI voice summaries, and read public healthcare recommendations.", "th-district": "District Boundary", "th-pm": "PM2.5 Level (mcg/m³)", "th-status": "Environmental Assessment", "th-action": "Analysis Tools",
                "detail-back": "Return to Summary Board", "detail-sub": "Live Station Broadcast Network", "detail-rec-title": "<i class='fas fa-user-doctor mr-1.5 text-sm'></i>Public Healthcare Recommendation Advice", "detail-voice": "Listen to AI Audio Summary", "audio-listen": "Listen to AI Summary", "audio-stop": "Stop Audio Playback",
                "detail-cause-title": "Main Sources of PM2.5 in This Area", "detail-solution-title": "Recommended Solutions", "detail-no-data": "Detailed data is not yet available for this district",
                "map-main-title": "<i class='fas fa-map-location text-blue-500 mr-2'></i>Geospatial GIS Pollution Map Information Center",
                "about-title": "Our Innovation Team", "about-desc": "Environmental database management architecture developed by students of Triam Udom Suksa School of the South.", "about-add": "Add Team Member",
                "auth-title": "User Identity Login", "auth-subtitle": "Member portal to log and track personal daily pollution intake exposure", "auth-email": "Email Address", "auth-pass": "Security Password", "auth-btn-in": "Sign In to Account", "auth-btn-up": "Sign Up Account", "auth-or": "Or Continue With", "auth-google": "Sign In with Google Account",
                "btn-analyze": "Deep Analysis", "btn-edit": "Edit Data", "btn-delete": "Delete",
                "lbl-nickname": "Nickname:", "lbl-age": "Age:", "lbl-years": "Y/O", "lbl-grade": "Grade:", "lbl-school": "School:",
                "status-ex": "Excellent", "status-g": "Good", "status-m": "Moderate", "status-u": "Unhealthy", "status-h": "Hazardous",
                "news-view-all": "View All News",
                "join-section-title": "Be Part of the Change",
                "join-section-desc": "Join our air quality monitoring network and help build a healthier community together with BREATHSAFE.",
                "join-section-btn": "<i class='fas fa-user-plus mr-2'></i>Join the Network",
                "join-section-count": "Members Joined",
                "map-zoom-nst": "<i class='fas fa-location-crosshairs mr-1.5'></i>Nakhon Si Thammarat"
            }
        };