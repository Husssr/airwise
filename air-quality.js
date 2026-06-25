// air-quality.js — ประเมินระดับ PM2.5, แสดงปัญหา/แนวทางรายอำเภอ

        // -------------------------------------------------------------
        // [5] ฟังก์ชันวิเคราะห์คำนวณและประเมินเกณฑ์ค่าฝุ่นละออง (AI Analytical Core)
        // -------------------------------------------------------------
        function evaluatePm25Tier(pm25Value) {
            if (pm25Value <= 15) return {
                tierTh: translationDictionary.th["status-ex"], tierEn: translationDictionary.en["status-ex"], hexColor: "#06b6d4",
                adviceTh: "ดัชนีอากาศบริสุทธิ์ดีเยี่ยม เหมาะสมต่อการจัดกิจกรรมในพื้นที่โล่งแจ้ง สตรีมีครรภ์และผู้สูงอายุสามารถสูดอากาศภายนอกอาคารได้อย่างปลอดภัยอย่างสมบูรณ์",
                adviceEn: "Excellent air quality. Ambient air poses no health risks. Highly recommended for any outdoor sports and school recreational activities."
            };
            if (pm25Value <= 25) return {
                tierTh: translationDictionary.th["status-g"], tierEn: translationDictionary.en["status-g"], hexColor: "#10b981",
                adviceTh: "เกณฑ์คุณภาพอากาศดี สามารถเดินทางและทำกิจวัตรนอกอาคารได้ตามปกติ สภาพบรรยากาศปลอดภัยต่อระบบทางเดินหายใจ",
                adviceEn: "Good air quality. Atmospheric conditions are well within safe thresholds. Outdoor exercises and daily routines can be performed freely."
            };
            if (pm25Value <= 37) return {
                tierTh: translationDictionary.th["status-m"], tierEn: translationDictionary.en["status-m"], hexColor: "#eab308",
                adviceTh: "ระดับคุณภาพอากาศปานกลาง ประชาชนทั่วไปสามารถทำกิจกรรมได้ตามปกติ แต่ผู้ป่วยโรคปอดอุดกั้นเรื้อรังหรือหอบหืดควรลดเวลาสัมผัสควันฝุ่นนอกบ้าน",
                adviceEn: "Moderate air quality. Acceptable for the general population. Sensitive groups with respiratory illness should minimize extended outdoor exertion."
            };
            if (pm25Value <= 75) return {
                tierTh: translationDictionary.th["status-u"], tierEn: translationDictionary.en["status-u"], hexColor: "#f97316",
                adviceTh: "คุณภาพอากาศเริ่มมีผลกระทบต่อสุขภาพ ประชาชนควรสวมหน้ากากอนามัยป้องกันฝุ่นละอองทุกครั้งเมื่อออกนอกบ้าน และงดกิจกรรมหนักกลางแจ้ง",
                adviceEn: "Unhealthy level of air dust. Respiratory irritation possible. Wear protective filtering masks and restrict prolonged outdoor activities."
            };
            return {
                tierTh: translationDictionary.th["status-h"], tierEn: translationDictionary.en["status-h"], hexColor: "#ef4444",
                adviceTh: "ภาวะวิกฤตอันตรายร้ายแรงต่อสุขภาพ ควรงดออกนอกอาคาร ปิดประตูหน้าต่างให้มิดชิด เปิดระบบเครื่องฟอกอากาศ และคอยสังเกตอาการผิดปกติอย่างใกล้ชิด",
                adviceEn: "Hazardous condition. Severe environmental warning. Avoid all outdoor exposures. Stay inside closed air-filtered environments immediately."
            };
        }

        // -------------------------------------------------------------
        // [5.1] เรนเดอร์การ์ดปัญหาฝุ่นหลักและแนวทางแก้ไขรายอำเภอ
        // -------------------------------------------------------------
        function renderDistrictIssuesPanel(targetDistrict) {
            const causeListEl = document.getElementById('detail-cause-list');
            const solutionListEl = document.getElementById('detail-solution-list');
            const issues = districtIssuesData[targetDistrict.th];

            causeListEl.innerHTML = "";
            solutionListEl.innerHTML = "";

            if (!issues) {
                const noDataMsg = translationDictionary[currentLang]["detail-no-data"];
                causeListEl.innerHTML = `<li class="list-none">${noDataMsg}</li>`;
                solutionListEl.innerHTML = `<li class="list-none">${noDataMsg}</li>`;
                return;
            }

            issues.causes.forEach(item => {
                const li = document.createElement('li');
                li.innerText = item;
                causeListEl.appendChild(li);
            });
            issues.solutions.forEach(item => {
                const li = document.createElement('li');
                li.innerText = item;
                solutionListEl.appendChild(li);
            });
        }