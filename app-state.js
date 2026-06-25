// app-state.js — ตัวแปรควบคุมสถานะหลักของแอปพลิเคชัน

        // [3] ตัวแปรควบคุมสถานะแอปพลิเคชันหลัก (App State Variables)
        // -------------------------------------------------------------
        let currentLang = "th";
        let isUserAdmin = false;
        let mainMapInstance = null;
        let homeMiniMapInstance = null;
        let mainMapMarkersArray = [];
        let miniMapMarkersArray = [];
        let currentlySelectedDistrictIndex = null;
        let currentSpeechInstance = null;
        let isAudioPlayingState = false;

        // -------------------------------------------------------------
        // [4] (router หลักอยู่ด้านล่างสุดของไฟล์ ใช้ระบบ URL Hash)
        // -------------------------------------------------------------