// auth.js — ระบบยืนยันตัวตน Firebase Auth / Admin Login,
//           setLoginState, Modal Controllers, Bootstrap (init), URL Hash Router

        // [10] ระบบยืนยันตัวตนและความปลอดภัย (Authentication Engine)
        // -------------------------------------------------------------
        window.switchAuthBoxMode = (mode) => {
            ['box-user-authentication','box-register-authentication','box-admin-authentication','box-profile-authenticated']
                .forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('hidden'); });
            const show = {
                user:     'box-user-authentication',
                register: 'box-register-authentication',
                admin:    'box-admin-authentication',
                profile:  'box-profile-authenticated'
            }[mode];
            if (show) document.getElementById(show)?.classList.remove('hidden');
        };

        // ===== Password strength + confirm match validator =====
        window.validateRegisterForm = () => {
            const email    = document.getElementById('input-reg-email')?.value.trim() || '';
            const pw       = document.getElementById('input-reg-password')?.value || '';
            const confirm  = document.getElementById('input-reg-confirm')?.value || '';
            const btnReg   = document.getElementById('btn-register');
            const bars     = [1,2,3,4].map(i => document.getElementById(`pw-bar-${i}`));
            const label    = document.getElementById('pw-strength-label');
            const matchOk  = document.getElementById('confirm-match-icon');
            const matchNo  = document.getElementById('confirm-nomatch-icon');
            const matchMsg = document.getElementById('confirm-match-msg');

            // --- strength score ---
            let score = 0;
            if (pw.length >= 6)  score++;
            if (pw.length >= 10) score++;
            if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
            if (/[^A-Za-z0-9]/.test(pw)) score++;

            const colors  = ['bg-rose-400','bg-amber-400','bg-yellow-400','bg-emerald-500'];
            const labels  = ['อ่อนมาก','พอใช้','ดี','แข็งแกร่ง'];
            const txtCols = ['text-rose-500','text-amber-500','text-yellow-600','text-emerald-600'];
            bars.forEach((b, i) => {
                b.className = `h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score-1] : 'bg-slate-200'}`;
            });
            if (label) {
                label.textContent = pw.length > 0 ? `ความแข็งแกร่ง: ${labels[score-1] || labels[0]}` : '';
                label.className   = `text-[10px] font-bold ${score > 0 ? txtCols[score-1] : 'text-slate-400'}`;
            }

            // --- confirm match ---
            const pwMatch = confirm.length > 0 && pw === confirm;
            const pwNoMatch = confirm.length > 0 && pw !== confirm;
            matchOk?.classList[pwMatch   ? 'remove' : 'add']('hidden');
            matchNo?.classList[pwNoMatch ? 'remove' : 'add']('hidden');
            if (matchMsg) {
                if (pwMatch)   { matchMsg.textContent = '✓ รหัสผ่านตรงกัน'; matchMsg.className = 'text-[10px] font-bold text-emerald-600'; }
                else if (pwNoMatch) { matchMsg.textContent = '✗ รหัสผ่านไม่ตรงกัน'; matchMsg.className = 'text-[10px] font-bold text-rose-500'; }
                else { matchMsg.textContent = ''; }
            }

            // --- enable register button only when all valid ---
            const canRegister = email.includes('@') && pw.length >= 6 && pw === confirm;
            if (btnReg) { btnReg.disabled = !canRegister; }
        };

        // ===== Firebase Register =====
        window.executeFirebaseRegister = async () => {
            const email   = document.getElementById('input-reg-email')?.value.trim();
            const pw      = document.getElementById('input-reg-password')?.value;
            const confirm = document.getElementById('input-reg-confirm')?.value;

            if (!email || !pw || pw !== confirm) return;

            Swal.fire({ title: '🔐 กำลังสร้างบัญชี...', html: '<p class="text-sm text-slate-500">กำลังเชื่อมต่อ Firebase Auth</p>', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

            try {
                if (window.fbAuth && window.fbModules) {
                    const cred = await window.fbModules.createUserWithEmailAndPassword(window.fbAuth, email, pw);

                    // บันทึก user profile ลง Firestore "users" collection
                    // เพื่อให้ member count (updateJoinMemberCount) นับได้จริง
                    try {
                        await window.fbModules.setDoc(
                            window.fbModules.doc(window.fbDb, 'users', cred.user.uid),
                            {
                                email: cred.user.email,
                                displayName: cred.user.displayName || null,
                                joinedAt: Date.now(),
                                provider: 'email'
                            }
                        );
                    } catch (dbErr) {
                        console.warn('บันทึก user profile ไม่สำเร็จ (ไม่กระทบการ login):', dbErr.message);
                    }

                    Swal.fire({
                        icon: 'success',
                        title: 'สมัครสมาชิกสำเร็จ! 🎉',
                        html: `<p class="text-sm text-slate-600">ยินดีต้อนรับสู่เครือข่าย BREATHSAFE<br><b class="text-blue-600">${email}</b></p>`,
                        timer: 2500, showConfirmButton: false
                    });
                    setLoginState(false, cred.user);

                    // รีเฟรช member count ทันที
                    updateJoinMemberCount();
                } else {
                    Swal.fire({ icon: 'info', title: 'โหมดออฟไลน์', text: 'ยังไม่ได้ตั้งค่า Firebase กรุณาเปิดใช้งาน Firebase ก่อน', confirmButtonColor: '#3b82f6' });
                }
            } catch (err) {
                let msg = err.message;
                if (err.code === 'auth/email-already-in-use') msg = 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบแทน';
                if (err.code === 'auth/invalid-email')        msg = 'รูปแบบอีเมลไม่ถูกต้อง';
                if (err.code === 'auth/weak-password')        msg = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
                Swal.fire({ icon: 'error', title: 'สมัครไม่สำเร็จ', text: msg, confirmButtonColor: '#ef4444' });
            }
        };

        window.toggleInputPasswordVisibility = (inputId) => {
            const input = document.getElementById(inputId);
            const icon = input.nextElementSibling.querySelector('i');
            if(input.type === 'password') {
                input.type = 'text'; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye');
            }
        };

        // โลจิกสำหรับการเข้าสู่ระบบแบบ Hardcode เฉพาะแอดมินตามที่โจทย์กำหนด (Adminpmproject / Admin123)
        window.executeSystemAdminLogin = () => {
            const user = document.getElementById('input-admin-username').value;
            const pass = document.getElementById('input-admin-password').value;
            
            if (user === "Adminpmproject" && pass === "Admin123") {
                document.getElementById('input-admin-username').value = '';
                document.getElementById('input-admin-password').value = '';
                Swal.fire({ icon: 'success', title: currentLang === 'th' ? 'เข้าสู่ระบบแอดมินสำเร็จ!' : 'Admin Access Granted!', text: currentLang === 'th' ? 'ยินดีต้อนรับผู้ดูแลระบบ BREATHSAFE' : 'Welcome, BREATHSAFE Administrator', timer: 1800, showConfirmButton: false });
                const mockAdminUser = { email: "admin@breathsafe.app", displayName: "System Administrator" };
                setLoginState(true, mockAdminUser);
            } else {
                Swal.fire({ icon: 'error', title: currentLang === 'th' ? 'รหัสผ่านไม่ถูกต้อง' : 'Access Denied', text: currentLang === 'th' ? 'รหัสแอดมินหรือรหัสผ่านไม่ถูกต้อง ปฏิเสธการเข้าถึง' : 'Invalid admin credentials. Access denied.', confirmButtonColor: '#ef4444' });
            }
        };

        // โลจิกสำหรับ Firebase (ถูกออกแบบให้มี Alert Fallback กรณีที่ไม่ได้ต่อ Firebase ไว้)
        window.executeFirebaseEmailAuth = async (action) => {
            const email = document.getElementById('input-auth-email').value;
            const password = document.getElementById('input-auth-password').value;
            
            if (!email || !password) return Swal.fire({ icon: 'warning', title: currentLang === 'th' ? 'กรุณากรอกข้อมูลให้ครบ' : 'Missing Info', text: currentLang === 'th' ? 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน' : 'Please enter both email and password.', confirmButtonColor: '#3b82f6' });

            if (window.fbAuth) {
                try {
                    if (action === 'register') {
                        const userCredential = await window.fbModules.createUserWithEmailAndPassword(window.fbAuth, email, password);
                        Swal.fire({ icon: 'success', title: currentLang === 'th' ? 'สมัครสมาชิกสำเร็จ!' : 'Account Created!', text: currentLang === 'th' ? 'สร้างบัญชีใหม่บนระบบ BREATHSAFE เรียบร้อยแล้ว' : 'Your BREATHSAFE account has been created.', timer: 1800, showConfirmButton: false });
                        setLoginState(false, userCredential.user);
                    } else {
                        const userCredential = await window.fbModules.signInWithEmailAndPassword(window.fbAuth, email, password);
                        const isAdmin = email === "admin@breathsafe.app";
                        Swal.fire({ icon: 'success', title: currentLang === 'th' ? 'เข้าสู่ระบบสำเร็จ' : 'Signed In', text: currentLang === 'th' ? 'ยินดีต้อนรับเข้าสู่ระบบ BREATHSAFE' : 'Welcome back to BREATHSAFE!', timer: 1500, showConfirmButton: false });
                        setLoginState(isAdmin, userCredential.user);
                    }
                } catch (error) {
                    console.error("Auth Error:", error);
                    Swal.fire({ icon: 'error', title: currentLang === 'th' ? 'เกิดข้อผิดพลาด' : 'Authentication Failed', text: error.message, confirmButtonColor: '#ef4444' });
                }
            } else {
                Swal.fire({ icon: 'info', title: currentLang === 'th' ? 'โหมดออฟไลน์' : 'Offline Mode', text: currentLang === 'th' ? 'ยังไม่ได้ตั้งค่า Firebase กรุณาใช้ระบบแอดมินจำลองแทน' : 'Firebase not configured. Please use the admin panel.', confirmButtonColor: '#3b82f6' });
            }
        };

        window.executeFirebaseGoogleAuth = async () => {
            if (window.fbAuth && window.googleProvider) {
                try {
                    const result = await window.fbModules.signInWithPopup(window.fbAuth, window.googleProvider);
                    const user = result.user;
                    const isAdmin = user.email === "admin@breathsafe.app";

                    // บันทึก/อัปเดต user profile ลง Firestore
                    if (window.fbDb) {
                        try {
                            await window.fbModules.setDoc(
                                window.fbModules.doc(window.fbDb, 'users', user.uid),
                                { email: user.email, displayName: user.displayName, photoURL: user.photoURL, lastLoginAt: Date.now(), provider: 'google' },
                                { merge: true }
                            );
                            updateJoinMemberCount();
                        } catch (dbErr) { console.warn('user profile upsert:', dbErr.message); }
                    }

                    Swal.fire({ icon: 'success', title: currentLang === 'th' ? 'เข้าสู่ระบบสำเร็จ 🎉' : 'Signed In 🎉', html: `<p class="text-sm text-slate-600">${currentLang === 'th' ? 'ยินดีต้อนรับ' : 'Welcome'} <b class="text-blue-600">${user.displayName || user.email}</b></p>`, timer: 1800, showConfirmButton: false });
                    setLoginState(isAdmin, user);
                } catch (error) {
                    console.error("Google Auth Error:", error);

                    // แสดง error message ที่เข้าใจง่ายสำหรับ redirect_uri_mismatch
                    let title = 'Google Sign-In Failed';
                    let html = `<p class="text-sm text-slate-600">${error.message}</p>`;

                    if (error.code === 'auth/unauthorized-domain' || error.message?.includes('redirect_uri_mismatch') || error.message?.includes('invalid_request')) {
                        title = '⚙️ ต้องตั้งค่า Firebase ก่อน';
                        html = `
                            <div class="text-left text-xs text-slate-600 space-y-2 mt-2">
                                <p class="font-bold text-rose-600">Domain ยังไม่ได้รับอนุญาตใน Firebase</p>
                                <p>ให้แอดมินทำตามขั้นตอนนี้:</p>
                                <ol class="list-decimal ml-4 space-y-1">
                                    <li>ไปที่ Firebase Console → Authentication</li>
                                    <li>แท็บ <b>Settings</b> → Authorized domains</li>
                                    <li>กด <b>Add domain</b> → ใส่ <code class="bg-slate-100 px-1 rounded">husssr.github.io</code></li>
                                    <li>Save แล้วลองใหม่</li>
                                </ol>
                            </div>`;
                    } else if (error.code === 'auth/popup-closed-by-user') {
                        return; // ผู้ใช้ปิด popup เอง ไม่ต้องแสดง error
                    } else if (error.code === 'auth/popup-blocked') {
                        title = '🚫 Popup ถูกบล็อก';
                        html = '<p class="text-sm text-slate-600">กรุณาอนุญาต popup สำหรับเว็บนี้ แล้วลองใหม่</p>';
                    }

                    Swal.fire({ icon: 'error', title, html, confirmButtonColor: '#ef4444', width: 480 });
                }
            } else {
                Swal.fire({ icon: 'info', title: currentLang === 'th' ? 'โหมดออฟไลน์' : 'Offline Mode', text: currentLang === 'th' ? 'ยังไม่ได้ตั้งค่า Firebase' : 'Firebase not configured.', confirmButtonColor: '#3b82f6' });
            }
        };

        window.executeSignOutAction = async () => {
            if (window.fbAuth && window.fbAuth.currentUser) {
                try {
                    await window.fbModules.signOut(window.fbAuth);
                } catch (error) { console.error(error); }
            }
            setLoginState(false, null);
            Swal.fire({ icon: 'info', title: currentLang === 'th' ? 'ออกจากระบบแล้ว' : 'Signed Out', text: currentLang === 'th' ? 'ออกจากระบบ BREATHSAFE เรียบร้อยแล้ว' : 'You have been signed out successfully.', timer: 1500, showConfirmButton: false });
        };

        // ฟังก์ชันควบคุม UI เมื่อสถานะ Login เปลี่ยนแปลง
        function setLoginState(isAdmin, userObject) {
            isUserAdmin = isAdmin;

            if (userObject) {
                // ซ่อนทุก box แล้วแสดง profile
                switchAuthBoxMode('profile');
                document.getElementById('authenticated-user-name').innerText =
                    userObject.displayName || userObject.email || "Breathsafe User";

                const adminBadge = document.getElementById('admin-badge');
                const starBadge  = document.getElementById('badge-admin-profile-star');
                [adminBadge, starBadge].forEach(el => el?.classList[isAdmin ? 'remove' : 'add']('hidden'));
                if (adminBadge) adminBadge.classList[isAdmin ? 'add' : 'remove']('inline-flex');
                if (starBadge)  starBadge.classList[isAdmin ? 'add' : 'remove']('flex');

                ['btn-edit-hero','btn-add-news','btn-add-member-card'].forEach(id => {
                    document.getElementById(id)?.classList[isAdmin ? 'remove' : 'add']('hidden');
                });
            } else {
                switchAuthBoxMode('user');
                // clear ฟอร์ม login
                ['input-auth-email','input-auth-password','input-reg-email','input-reg-password','input-reg-confirm']
                    .forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
                document.getElementById('admin-badge')?.classList.add('hidden');
                ['btn-edit-hero','btn-add-news','btn-add-member-card'].forEach(id =>
                    document.getElementById(id)?.classList.add('hidden'));
            }

            renderNewsCards();
            renderAboutCards();
        }

        // -------------------------------------------------------------
        // [11] ระบบจัดการป๊อปอัป (Modal Controllers)
        // -------------------------------------------------------------
        window.openModal = (modalId) => {
            const modal = document.getElementById(modalId);
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // ล็อกหน้าจอไม่ให้สกอร์ลง
            document.body.style.overflow = 'hidden';
        };

        window.closeActiveModal = (modalId) => {
            const modal = document.getElementById(modalId);
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = 'auto';
        };

        // -------------------------------------------------------------
        // [12] ระบบเริ่มต้นการทำงานอัตโนมัติ (Bootstrapping / Initialization)
        // -------------------------------------------------------------
        window.onload = function() {
            // โหลดข้อมูลเริ่มต้นและเรนเดอร์โครงสร้าง UI
            seedInitialData();
            renderHeroCover();
            renderDashboardWidgets();
            renderAirQualityTable();
            renderNewsCards();
            
            // แสดง loading state บนหน้า about ถ้า Firebase กำลังโหลด
            if (window.fbDb) {
                // Firebase connected — แสดง loading state รอ onSnapshot
                const loadingState = document.getElementById('about-loading-state');
                const emptyState = document.getElementById('about-empty-state');
                const container = document.getElementById('about-cards-grid');
                if (loadingState) { loadingState.classList.remove('hidden'); loadingState.classList.add('flex'); }
                if (emptyState) emptyState.classList.add('hidden');
                if (container) container.innerHTML = '';
            } else {
                // ไม่มี Firebase — render จาก localStorage ทันที
                renderAboutCards();
            }
            
            initializeMaps();
            
            // อัปเดตภาษาเริ่มต้นให้เป็นภาษาไทย
            changeLanguage('th');

            // หน่วงเวลาหน้าจอโหลดเพื่อให้ระบบเตรียมกราฟิกและแผนที่เสร็จสิ้นสมบูรณ์
            setTimeout(() => {
                const loader = document.getElementById('global-loader');
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    // อัปเดตขนาดแผนที่หลังจากซ่อนหน้าจอโหลด เพื่อกันบั๊กกล่องแผนที่เทา
                    if(homeMiniMapInstance) homeMiniMapInstance.invalidateSize();
                }, 500);
            }, 1800);
        };
        // 1. ปรับฟังก์ชันเปลี่ยนหน้าให้ไปเปลี่ยน URL Hash แทน
window.switchView = function(view) {
    window.location.hash = view; // สั่งให้ URL ด้านบนต่อท้ายด้วย #ชื่อหน้า
};

// 2. สร้างระบบดักจับ (Router) เมื่อ URL เปลี่ยน หรือผู้ใช้กดย้อนกลับ/ไปข้างหน้า
window.addEventListener('hashchange', () => {
    // ปิดเสียง AI และตัวการ์ตูนทันทีเมื่อเปลี่ยนไปหน้าอื่น
    terminateSpeechAudio();

    // อ่านค่าว่าตอนนี้อยู่หน้าอะไร
    let hash = window.location.hash.replace('#', '');
    if (!hash) hash = 'home'; // ถ้าไม่มีให้ค่าเริ่มต้นเป็นหน้า home

    // ซ่อนทุกหน้าต่าง (ที่มีคลาส .view-section)
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
    });

    // โชว์เฉพาะหน้าต่างที่ตรงกับ URL ตอนนี้
    const activeView = document.getElementById(`view-${hash}`);
    if (activeView) {
        activeView.classList.add('active');
    }

    // คืนค่าสีแถบเมนูด้านบน (เฉพาะปุ่มเนวบาร์หลักที่มี id nav-*)
    document.querySelectorAll('[id^="nav-"]').forEach(btn => {
        btn.classList.remove('text-blue-600', 'bg-blue-50/50', 'bg-slate-50');
    });
    const activeNav = document.getElementById(`nav-${hash}`);
    if (activeNav) {
        activeNav.classList.add('text-blue-600', 'bg-blue-50/50'); // ใส่แถบสีให้เมนูที่กำลังเปิดอยู่
    }

    // ป้องกันบั๊กกล่องแผนที่เทา (ถ้าหน้านั้นมีแผนที่ ให้สั่งวาดใหม่)
    if (hash === 'map' && typeof mainMapInstance !== 'undefined' && mainMapInstance) {
        setTimeout(() => mainMapInstance.invalidateSize(), 250);
    }
    if (hash === 'home' && typeof homeMiniMapInstance !== 'undefined' && homeMiniMapInstance) {
        setTimeout(() => homeMiniMapInstance.invalidateSize(), 250);
    }

    // render หน้าข่าวทั้งหมดเมื่อเข้าหน้านั้น
    if (hash === 'news-all' && typeof window.renderNewsAll === 'function') {
        window.renderNewsAll();
    }

    // เมื่อเปลี่ยนหน้าแล้วให้เลื่อนสมูทกลับไปบนสุดเสมอ
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // แสดง/ซ่อน contact widget (แสดงทุกหน้ายกเว้น join/admin)
    const contactWidget = document.getElementById('contact-widget');
    const contactCard = document.getElementById('contact-card');
    const contactIcon = document.getElementById('contact-fab-icon');
    if (contactWidget) {
        const hideOn = ['join'];
        if (hideOn.includes(hash)) {
            contactWidget.classList.add('hidden');
            if (contactCard) contactCard.classList.add('hidden');
            if (contactIcon) contactIcon.className = 'fas fa-headset text-xl';
        } else {
            contactWidget.classList.remove('hidden');
        }
    }
});

// 3. เมื่อเปิดเว็บครั้งแรก ให้ระบบทำงานอัตโนมัติตาม URL ปัจจุบัน
// (fire hashchange ทันทีเพื่อ init หน้าและ nav highlight)
(function initRouter() {
    const e = new Event('hashchange');
    window.dispatchEvent(e);
})();

