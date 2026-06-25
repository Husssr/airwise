// firebase-init.js — Firebase setup + Realtime onSnapshot listeners
// โหลดใน index.html ด้วย <script type="module" src="js/firebase-init.js">

        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
        import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

        // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCKdLVy7fcWRcAW72zrtR6H1oIrJoPFsQQ",
  authDomain: "airwise-project-d3556.firebaseapp.com",
  projectId: "airwise-project-d3556",
  storageBucket: "airwise-project-d3556.firebasestorage.app",
  messagingSenderId: "104485361484",
  appId: "1:104485361484:web:d0e490eed63a11e99861e9",
  measurementId: "G-HTER90T3GJ"
};

        let app, auth, db, googleProvider;
        if(firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY_HERE") {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            googleProvider = new GoogleAuthProvider();

            window.fbAuth = auth;
            window.fbDb = db;
            window.googleProvider = googleProvider;
            window.fbModules = {
                collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc, onSnapshot,
                createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut
            };

            onAuthStateChanged(auth, (user) => {
                if (user) {
                    const isSystemAdmin = user.email === "admin@breathsafe.app";
                    setLoginState(isSystemAdmin, user);
                }
            });

            // ============================================================
            // Realtime Listeners — ทุกคนเห็นข้อมูลพร้อมกันทันทีผ่าน Firestore
            // ============================================================

            // 1) Hero cover
            onSnapshot(doc(db, 'siteConfig', 'heroCover'), (snap) => {
                if (snap.exists()) {
                    const url = snap.data().imageUrl;
                    if (url) {
                        localStorage.setItem('breathsafe_hero', url);
                        renderHeroCoverFromUrl(url);
                    }
                }
            });

            // 2) News — เรียงตาม timestamp ล่าสุดขึ้นก่อน
            onSnapshot(collection(db, 'news'), (snap) => {
                const newsList = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                localStorage.setItem('breathsafe_news', JSON.stringify(newsList));
                if (typeof renderNewsCards === 'function') renderNewsCards();
                if (typeof window.renderNewsAll === 'function') window.renderNewsAll();
            });

            // 3) About Members — เรียงตาม order
            onSnapshot(collection(db, 'aboutMembers'), (snap) => {
                const members = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (a.order || 0) - (b.order || 0));
                // บันทึกข้อมูลจาก Firestore ทับ localStorage เสมอ (ป้องกันข้อมูลเก่าค้าง)
                localStorage.setItem('breathsafe_about', JSON.stringify(members));
                if (typeof renderAboutCards === 'function') renderAboutCards();
            });
        }