# 🌬️ BREATHSAFE
### ระบบรายงานคุณภาพอากาศและภูมิสารสนเทศ จังหวัดนครศรีธรรมราช

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?logo=github)](https://husssr.github.io/BREATHSAFE/)

---

## 📁 โครงสร้างไฟล์

```
BREATHSAFE/
├── index.html          ← หน้าหลัก
├── style.css           ← Dark mode, animations, Cropper, Map styles
├── firebase-init.js    ← Firebase config + Realtime onSnapshot
├── data.js             ← ข้อมูล 23 อำเภอ, ปัญหาฝุ่น, พจนานุกรมภาษา
├── app-state.js        ← ตัวแปรสถานะแอป (lang, isAdmin ฯลฯ)
├── air-quality.js      ← ประเมินระดับ PM2.5 + แนวทางสุขภาพ
├── speech.js           ← หน้ารายละเอียดอำเภอ + TTS เสียง AI
├── map.js              ← Leaflet GIS Map + หมุด 23 อำเภอ
├── ui-render.js        ← เปลี่ยนภาษา, แสดงผล Dashboard
├── upload.js           ← อัปโหลดรูป (Imgur), Cropper, CRUD Hero/ข่าว/สมาชิก
├── auth.js             ← Firebase Auth, Admin Login, Modal, Router
├── api.js              ← API จริง (PM2.5, Weather), Member Count, News
├── cookie.js           ← Cookie Consent Banner
├── .gitignore
└── README.md
```

---

## 🚀 วิธีเปิดใช้งาน GitHub Pages

1. Push โค้ดขึ้น repository
2. ไปที่ **Settings → Pages**
3. Source: **Deploy from a branch** → branch `main` → folder `/ (root)`
4. กด **Save** แล้วรอสักครู่
5. เข้าใช้งานได้ที่ `https://<username>.github.io/<repo-name>/`

---

## ✏️ วิธีแก้ไขแต่ละส่วน

| ต้องการแก้อะไร | แก้ที่ไฟล์ |
|---|---|
| ข้อมูลอำเภอ / ค่าฝุ่นเริ่มต้น | `data.js` |
| คำแปลภาษาไทย-อังกฤษ | `data.js` → `translationDictionary` |
| สีธีม / Dark mode / Animation | `style.css` |
| Firebase config / API Key | `firebase-init.js` |
| ระบบอัปโหลดรูปภาพ | `upload.js` |
| ระบบ Login / Admin | `auth.js` |
| แผนที่ Leaflet | `map.js` |
| API ดึงค่าฝุ่นจริง / สภาพอากาศ | `api.js` |
| โครงสร้าง HTML / Layout | `index.html` |

---

## 🔧 Dependencies (CDN — ไม่ต้อง install)

- [Tailwind CSS](https://tailwindcss.com/)
- [Font Awesome 6](https://fontawesome.com/)
- [Leaflet.js](https://leafletjs.com/) — แผนที่
- [Cropper.js](https://fengyuanchen.github.io/cropperjs/) — ครอปรูป
- [SweetAlert2](https://sweetalert2.github.io/) — popup แจ้งเตือน
- [Firebase 10](https://firebase.google.com/) — Auth + Firestore
- [Open-Meteo API](https://open-meteo.com/) — ข้อมูลฝุ่นและสภาพอากาศจริง
- [Imgur API](https://api.imgur.com/) — เก็บรูปภาพ

---

## 👥 พัฒนาโดย

โรงเรียนเตรียมอุดมศึกษาภาคใต้ — โครงงานระบบฐานข้อมูลสารสนเทศเพื่อความปลอดภัยทางสิ่งแวดล้อม
