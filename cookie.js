// cookie.js — Cookie Consent Banner

        // ฟังก์ชันจัดการ Cookie Banner — accepted=true (ยอมรับ) / false (ปฏิเสธ/ปิด)
        function dismissCookieBanner(accepted) {
            localStorage.setItem('breathsafe_cookie_accepted', accepted ? 'true' : 'false');

            // ทำให้แถบเลื่อนลงไปด้านล่างอย่างนุ่มนวล
            const banner = document.getElementById('cookie-banner');
            banner.classList.add('translate-y-full');

            // ซ่อน element หลังจากอนิเมชันเลื่อนลงทำงานจบ
            setTimeout(() => {
                banner.style.display = 'none';
            }, 500);
        }
        // คงชื่อฟังก์ชันเดิมไว้เผื่อมีการอ้างอิงที่อื่น (alias)
        function acceptCookies() { dismissCookieBanner(true); }

        // ตรวจสอบสถานะเมื่อโหลดหน้าเว็บเสร็จสิ้น
        window.addEventListener('DOMContentLoaded', () => {
            // หากยังไม่เคยกดยอมรับคุกกี้ ให้แสดงแถบขึ้นมา
            if (!localStorage.getItem('breathsafe_cookie_accepted')) {
                setTimeout(() => {
                    const banner = document.getElementById('cookie-banner');
                    banner.classList.remove('translate-y-full');
                }, 800); // ดีเลย์โชว์นิดหน่อยเพื่อให้หน้าเว็บโหลดดูเนียนตา
            }
        });