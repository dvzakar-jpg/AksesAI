/**
 * AksesAI - Auth Modal Controller
 * Manages Login and Register dialogs with client validation and session updates.
 */

import { AuthService } from '../services/authService.js';

export class AuthModalUI {
    constructor() {
        this.render();
        this.bindEvents();
    }

    render() {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'modal-auth-container';
        modalContainer.innerHTML = `
            <div id="modal-auth" class="modal-backdrop hidden" role="dialog" aria-labelledby="modal-auth-title" aria-modal="true">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3 id="modal-auth-title">Masuk ke AksesAI</h3>
                        <button type="button" class="modal-close-btn" id="btn-close-auth">❌</button>
                    </div>

                    <div class="modal-body">
                        <p class="card-subtext mb-md">
                            Akun bersifat <strong>opsional</strong>. Anda tetap dapat menggunakan seluruh fitur utama tanpa perlu masuk.
                            Dengan membuat akun, Anda dapat menyimpan riwayat transkripsi dan penyederhanaan teks Anda.
                        </p>

                        <!-- Tab switcher: Login / Register -->
                        <div class="auth-tabs-bar mb-md">
                            <button type="button" id="tab-auth-login" class="btn-auth-tab active">🔑 Masuk</button>
                            <button type="button" id="tab-auth-register" class="btn-auth-tab">📝 Buat Akun Baru</button>
                        </div>

                        <!-- Alert Box -->
                        <div id="auth-alert-msg" class="status-alert error hidden mb-md"></div>

                        <!-- Login Form -->
                        <form id="form-auth-login">
                            <div class="form-group mb-md">
                                <label class="form-label" for="login-username">Username atau Email:</label>
                                <input type="text" id="login-username" class="form-input" required placeholder="Username atau email Anda...">
                            </div>
                            <div class="form-group mb-md">
                                <label class="form-label" for="login-password">Kata Sandi:</label>
                                <input type="password" id="login-password" class="form-input" required placeholder="Kata sandi...">
                            </div>
                            <button type="submit" class="btn btn-primary w-full btn-lg">Masuk Sekarang</button>
                        </form>

                        <!-- Register Form -->
                        <form id="form-auth-register" class="hidden">
                            <div class="form-group mb-md">
                                <label class="form-label" for="reg-username">Username Baru:</label>
                                <input type="text" id="reg-username" class="form-input" required placeholder="Pilih username...">
                            </div>
                            <div class="form-group mb-md">
                                <label class="form-label" for="reg-email">Email:</label>
                                <input type="email" id="reg-email" class="form-input" required placeholder="nama@email.com">
                            </div>
                            <div class="form-group mb-md">
                                <label class="form-label" for="reg-password">Kata Sandi:</label>
                                <input type="password" id="reg-password" class="form-input" required placeholder="Minimal 6 karakter...">
                            </div>
                            <button type="submit" class="btn btn-primary w-full btn-lg">Daftar Akun Gratis</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalContainer);
    }

    bindEvents() {
        const modal = document.getElementById('modal-auth');
        const closeBtn = document.getElementById('btn-close-auth');
        const tabLogin = document.getElementById('tab-auth-login');
        const tabRegister = document.getElementById('tab-auth-register');
        const formLogin = document.getElementById('form-auth-login');
        const formRegister = document.getElementById('form-auth-register');
        const alertMsg = document.getElementById('auth-alert-msg');

        const switchTab = (mode) => {
            alertMsg.classList.add('hidden');
            if (mode === 'login') {
                tabLogin.classList.add('active');
                tabRegister.classList.remove('active');
                formLogin.classList.remove('hidden');
                formRegister.classList.add('hidden');
                document.getElementById('modal-auth-title').textContent = 'Masuk ke AksesAI';
            } else {
                tabRegister.classList.add('active');
                tabLogin.classList.remove('active');
                formRegister.classList.remove('hidden');
                formLogin.classList.add('hidden');
                document.getElementById('modal-auth-title').textContent = 'Pendaftaran Akun AksesAI';
            }
        };

        tabLogin.addEventListener('click', () => switchTab('login'));
        tabRegister.addEventListener('click', () => switchTab('register'));
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

        // Handle Login Submit
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            alertMsg.classList.add('hidden');
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                await AuthService.login(username, password);
                modal.classList.add('hidden');
                formLogin.reset();
            } catch (err) {
                alertMsg.textContent = err.message || 'Gagal masuk. Periksa username dan password.';
                alertMsg.classList.remove('hidden');
            }
        });

        // Handle Register Submit
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            alertMsg.classList.add('hidden');
            const username = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;

            try {
                await AuthService.register(username, email, password);
                modal.classList.add('hidden');
                formRegister.reset();
            } catch (err) {
                alertMsg.textContent = err.message || 'Gagal mendaftar.';
                alertMsg.classList.remove('hidden');
            }
        });
    }

    static open() {
        const modal = document.getElementById('modal-auth');
        if (modal) modal.classList.remove('hidden');
    }
}
